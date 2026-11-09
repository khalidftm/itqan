/**
 * Safe, additive GitHub ↔ FTM reconciliation.
 * Remote files are restored into IndexedDB using their original IDs; metadata
 * is merged by ID, not replaced. No cloud deletes are performed by this module.
 * File names and paths are untrusted input from a public repository.
 */
(function () {
  "use strict";
  const safeId=id=>/^[a-zA-Z0-9_-]{1,128}$/.test(String(id||""));
  const plainArray=value=>Array.isArray(value)?value:[];
  const isRecord=value=>value&&typeof value==="object"&&!Array.isArray(value);
  const comparable=value=>JSON.stringify(value??null);
  function lastEdit(item) {
    const time=Date.parse(item?.updatedAt||item?.linkedAt||item?.modifiedAt||item?.uploadedAt||"");
    return Number.isFinite(time)?time:0;
  }
  function mergeItems(localItems,remoteItems,userId) {
    const merged=new Map();
    // Remote first; a known newer timestamp wins, otherwise preserve local edits.
    for(const source of [plainArray(remoteItems),plainArray(localItems)]) {
      for(const item of source) {
        if(!isRecord(item)||item.userId!==userId||!safeId(item.id))continue;
        const id=String(item.id),prior=merged.get(id);
        if(!prior||lastEdit(item)>=lastEdit(prior))merged.set(id,{...prior,...item});
      }
    }
    return merged;
  }
  function mergeCollections({localLinked,localPending,remoteLinked,remotePending,userId}) {
    const linked=mergeItems(localLinked,remoteLinked,userId);
    // If the item was linked on either device, it stays linked.
    const fromRemote=mergeItems(remoteLinked,localLinked,userId);
    for(const [id,item] of fromRemote) {
      if(!linked.has(id))linked.set(id,item);
    }
    const pending=mergeItems(localPending,remotePending,userId);
    for(const id of linked.keys())pending.delete(id);
    return {linked:[...linked.values()],pending:[...pending.values()]};
  }
  function mergeManifest(local,remote,userId) {
    const result={};
    const validPrefix="uploads/ftm/"+String(userId).replace(/[^a-zA-Z0-9_-]/g,"_")+"/";
    for(const source of [local,remote]) {
      if(!isRecord(source))continue;
      for(const [id,entry] of Object.entries(source)) {
        if(!safeId(id)||!isRecord(entry))continue;
        if(typeof entry.sha!=="string"||!/^[0-9a-f]{40}$/i.test(entry.sha))continue;
        if(typeof entry.path!=="string"||!entry.path.startsWith(validPrefix))continue;
        result[id]={path:entry.path,sha:entry.sha};
      }
    }
    return result;
  }
  function asFile(bytes,name,mime){
    const safeName=String(name||"restored-document").slice(0,240);
    const type=String(mime||"application/octet-stream");
    try {return new File([bytes],safeName,{type,lastModified:Date.now()});}
    catch {
      const blob=new Blob([bytes],{type});
      try{Object.defineProperty(blob,"name",{value:safeName,configurable:true});}catch{}
      return blob;
    }
  }
  async function reconcile({storage,blobs,userId,remote,cloudFiles,download,localManifest,onSave}) {
    if(remote && (!isRecord(remote)||remote.userId!==userId||remote.schemaVersion!==1)) {
      throw new Error("ملف النسخة السحابية لا يطابق حساب المعلمة أو إصدار البيانات الحالي.");
    }
    const localDB=storage.getDB();
    const localLinked=plainArray(localDB.portfolioItems).filter(item=>item.userId===userId);
    const localPending=plainArray(localDB.unlinkedFiles).filter(item=>item.userId===userId);
    const cloudLinked=plainArray(remote?.portfolioItems).filter(item=>item.userId===userId);
    const cloudPending=plainArray(remote?.unlinkedFiles).filter(item=>item.userId===userId);
    const recovered=plainArray(cloudFiles).filter(item=>item.userId===userId);
    const matches=mergeCollections({
      localLinked,localPending,
      remoteLinked:cloudLinked,
      remotePending:[...cloudPending,...recovered],
      userId
    });
    const manifest=mergeManifest(localManifest,remote?.files,userId);
    // A valid cloud file not represented in a snapshot must be recovered as an
    // unlinked file rather than discarded when another device saved its snapshot.
    for(const item of recovered) {
      if(item?.cloudPath&&item?.cloudSha&&safeId(item.id)) {
        const prefix="uploads/ftm/"+String(userId).replace(/[^a-zA-Z0-9_-]/g,"_")+"/";
        if(item.cloudPath.startsWith(prefix) && /^[0-9a-f]{40}$/i.test(item.cloudSha)) {
          if(!manifest[item.id])manifest[item.id]={path:item.cloudPath,sha:item.cloudSha};
        }
      }
    }
    let restored=0,missing=0;
    for(const item of [...matches.linked,...matches.pending]) {
      const record=manifest[item.id];
      if(!record) {if(item.fileName)missing++;continue;}
      const existing=await blobs.getFile(item.id);
      if(existing?.blob)continue;
      const bytes=await download(record.sha);
      if(!(bytes instanceof Uint8Array)||!bytes.byteLength)throw new Error("تعذر استعادة الملف السحابي: "+item.id);
      const filename=item.fileName||record.path.split("/").at(-1)||"restored-file";
      const mime=item.mimeType||item.attachmentType||"application/octet-stream";
      if(!await blobs.saveFile(item.id,asFile(bytes,filename,mime))) {
        throw new Error("امتلأ التخزين المحلي أو تعذر استعادة ملف من السحابة.");
      }
      restored++;
    }
    const mergedDB={...localDB,
      portfolioItems:[...plainArray(localDB.portfolioItems).filter(item=>item.userId!==userId),...matches.linked],
      unlinkedFiles:[...plainArray(localDB.unlinkedFiles).filter(item=>item.userId!==userId),...matches.pending]
    };
    let profileChanged=false;
    if(remote?.user?.id===userId) {
      const current=plainArray(localDB.users).find(x=>x.id===userId);
      // On a newly opened device without real locally uploaded files, hydrate
      // the cloud profile. Existing locally edited profiles are not overwritten.
      let hasLocalBlobs=false;
      for(const x of [...localLinked,...localPending]) {
        if((await blobs.getFile(x.id))?.blob){hasLocalBlobs=true;break;}
      }
      if(current && !hasLocalBlobs && comparable(current)!==comparable(remote.user)) {
        // Preserve an undo copy of the local profile before adopting the cloud version.
        try{
          localStorage.setItem("itqan-ftm-precloud-profile:"+userId,JSON.stringify(current));
        }catch{}
        mergedDB.users=plainArray(localDB.users).map(x=>x.id===userId?{
          ...current,...remote.user,id:userId
        }:x);
        profileChanged=true;
      }
    }
    if(onSave && (comparable(mergedDB.portfolioItems)!==comparable(localDB.portfolioItems)||
       comparable(mergedDB.unlinkedFiles)!==comparable(localDB.unlinkedFiles)||profileChanged)) {
      onSave(mergedDB);
    }
    return {manifest,restored,missing,linked:matches.linked,pending:matches.pending,
      profileChanged,changed:restored>0||
        comparable(mergedDB.portfolioItems)!==comparable(localDB.portfolioItems)||
        comparable(mergedDB.unlinkedFiles)!==comparable(localDB.unlinkedFiles)||profileChanged};
  }
  window.FTMCloudMerge=Object.freeze({reconcile,mergeCollections,mergeManifest});
})();

/**
 * FTM opt-in GitHub automatic backup, including public plaintext with explicit consent.
 *
 * Security rules:
 *  - Public uploads require an explicit, session-scoped acknowledgement of visibility.
 *  - Verify the selected destination via GitHub API before EVERY upload pass.
 *  - Back up linked evidence AND unlinked files belonging to the active teacher.
 *  - No long-lived GitHub token in localStorage or the public repository.
 *  - Store credentials only for this browser session; production deployments
 *    handling sensitive data must replace this with server-side OAuth/storage.
 */
(function () {
  "use strict";

  const E = window.ItqanEngines;
  if (!E?.StorageEngine || !E?.IndexedDBFileStore || !E?.ModalEngine) return;
  const storage = E.StorageEngine;
  const blobs = E.IndexedDBFileStore;
  const modal = E.ModalEngine;
  const localKey = "itqan-ftm-private-backup-destination-v1";
  const sessionKey = "itqan-ftm-private-backup-token-session-v1";
  const publicConsentKey = "itqan-ftm-public-upload-accepted-session-v1";
  const status = document.getElementById("ftm-auto-backup-status");
  let token = "";
  let publicConsent = false;
  let destination = null;
  let active = false;
  let queued = false;
  let timer = null;
  let latestError = "";
  let controller = new AbortController();
  let discoveredOrphans = null;
  let discoveredAt = 0;

  function safeRead(store, key) {
    try { return store.getItem(key); } catch { return null; }
  }
  function safeWrite(store, key, value) {
    try { store.setItem(key,value); return true; } catch { return false; }
  }
  function safeDelete(store, key) {
    try { store.removeItem(key); } catch {}
  }
  function statusUpdate(label, state = "idle") {
    if (status) {
      status.textContent = label;
      status.dataset.state = state;
      status.title = label;
    }
    window.dispatchEvent(new CustomEvent("itqan:cloudSyncChanged",{detail:{state}}));
  }
  function validPart(value) {
    return /^[a-zA-Z0-9_.-]{1,100}$/.test(value || "") && value !== "." && value !== "..";
  }
  function cleanId(value) {
    return String(value ?? "unknown").replace(/[^\p{L}\p{N}._-]/gu,"_").slice(0,90);
  }
  function cleanFile(value) {
    return String(value ?? "document.bin").replace(/[^\p{L}\p{N}._-]/gu,"_").slice(0,110) || "document.bin";
  }
  function repoSlug() {
    return (destination?.owner + "/" + destination?.repo).toLowerCase();
  }
  function authHeaders() {
    return {Accept:"application/vnd.github+json", Authorization:"Bearer " + token,
      "X-GitHub-Api-Version":"2022-11-28"};
  }
  function api(path) {
    return "https://api.github.com/repos/" + encodeURIComponent(destination.owner) +
      "/" + encodeURIComponent(destination.repo) + path;
  }
  function userPath(userId) {
    return "ftm/" + cleanId(userId);
  }
  function manifestKey(userId) {
    return "itqan-ftm-remote-manifest-v1:" + repoSlug() + ":" + cleanId(userId);
  }
  function getManifest(userId) {
    try {
      const stored = JSON.parse(safeRead(localStorage, manifestKey(userId)) || "{}");
      return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
    } catch { return {}; }
  }
  function putManifest(userId, record) {
    safeWrite(localStorage, manifestKey(userId), JSON.stringify(record));
    window.dispatchEvent(new CustomEvent("itqan:cloudSyncChanged",{detail:{state:"manifest"}}));
  }
  function fileSyncState(fileId) {
    if (!token || !destination) return "local";
    const userId=storage.getCurrentUser()?.id;
    if (!userId || !fileId) return "local";
    const entry=getManifest(userId)[String(fileId)];
    return entry?.sha ? "synced" : "pending";
  }
  async function github(path, options = {}) {
    const response = await fetch(api(path), {
      ...options,
      signal:controller.signal,
      headers:{...authHeaders(), ...(options.body ? {"Content-Type":"application/json"} : {})},
      cache:"no-store"
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err=new Error(result.message || "GitHub HTTP " + response.status);
      err.status=response.status;
      throw err;
    }
    return result;
  }
  async function verifyDestination() {
    if (!token || !destination) throw new Error("لم يُضبط اتصال GitHub لهذه الجلسة.");
    if (!validPart(destination.owner) || !validPart(destination.repo)) throw new Error("اسم المستودع غير صالح.");
    const repo = await github("");
    if (String(repo.full_name || "").toLowerCase() !== repoSlug()) throw new Error("تعذر التحقق من تطابق المستودع.");
    if (!repo.permissions?.push) throw new Error("رمز GitHub لا يمتلك صلاحية كتابة Contents.");
    if (repo.private !== true) {
      if (!publicConsent || safeRead(sessionStorage,publicConsentKey)!==repoSlug()) {
        throw new Error("المستودع عام؛ يلزم الموافقة الصريحة على أن الملفات وبيانات المعلمة ستكون متاحة لأي شخص.");
      }
    }
    return repo;
  }
  function dataPath(path) {
    return "/contents/" + path.split("/").map(encodeURIComponent).join("/");
  }
  async function currentSha(path) {
    const response = await fetch(api(dataPath(path)), {headers:authHeaders(),cache:"no-store",signal:controller.signal});
    if (response.status === 404) return null;
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "تعذر قراءة نسخة الملف السحابي");
    return result.sha || null;
  }
  async function pushFile(path, base64, message) {
    const oldSha = await currentSha(path);
    const body = {message,content:base64,branch:destination.branch || "main"};
    if (oldSha) body.sha = oldSha;
    const result = await github(dataPath(path), {method:"PUT",body:JSON.stringify(body)});
    return {path,sha:result.content?.sha || ""};
  }
  async function removeFile(path, sha) {
    if (!sha || !path.startsWith("uploads/ftm/")) return;
    await github(dataPath(path), {
      method:"DELETE",
      body:JSON.stringify({message:"حذف شاهد من نسخة FTM الاحتياطية",sha,
        branch:destination.branch || "main"})
    });
  }
  function base64Utf8(value) {
    const bytes = new TextEncoder().encode(value);
    let result = "";
    for (let i=0;i<bytes.length;i+=0x4000) {
      result += String.fromCharCode(...bytes.subarray(i,i+0x4000));
    }
    return btoa(result);
  }
  function base64Blob(blob) {
    return new Promise((resolve,reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const data = String(reader.result || "");
        const comma = data.indexOf(",");
        if (comma<0) return reject(new Error("تعذّر ترميز الملف"));
        resolve(data.slice(comma+1));
      };
      reader.onerror = () => reject(reader.error || new Error("تعذر قراءة المرفق"));
      reader.readAsDataURL(blob);
    });
  }
  // Read a remote snapshot BEFORE any upload; its SHA prevents overwriting
  // changes another device committed between the read and the write.
  function decodeBase64(encoded) {
    const raw=atob(String(encoded||"").replace(/\s/g,""));
    const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return bytes;
  }
  async function fetchRemoteSnapshot(userId) {
    const path="data/"+userPath(userId)+"/snapshot.json";
    const response=await fetch(api(dataPath(path)),{
      headers:authHeaders(),signal:controller.signal,cache:"no-store"
    });
    if(response.status===404)return {snapshot:null,sha:null,path};
    const info=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(info.message||"تعذر قراءة نسخة البيانات السحابية.");
    const sha=info.sha;
    if(typeof sha!=="string"||!/^[a-f0-9]{40}$/i.test(sha))throw new Error("تعذر التحقق من نسخة البيانات البعيدة.");
    const encoded=info.encoding==="base64"&&info.content?
      info.content:(await github("/git/blobs/"+encodeURIComponent(sha))).content;
    if(!encoded)throw new Error("ملف البيانات البعيدة لا يحتوي على محتوى قابل للقراءة.");
    let snapshot;
    try {snapshot=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(decodeBase64(encoded)));}
    catch{throw new Error("صيغة بيانات السحابة غير صالحة؛ لن نكتب فوقها.");}
    if(snapshot?.schemaVersion!==1 || snapshot?.userId!==userId){
      throw new Error("معرف المعلمة أو إصدار النسخة السحابية لا يطابق هذا الجهاز. لا يُسمح بالدمج التلقائي.");
    }
    return {snapshot,sha,path};
  }
  async function listCloudDir(path) {
    const response=await fetch(api(dataPath(path)),{
      headers:authHeaders(),signal:controller.signal,cache:"no-store"
    });
    if(response.status===404)return [];
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.message||"تعذر فحص مجلد المرفقات السحابي.");
    if(!Array.isArray(data))throw new Error("رد غير متوقع من مجلد المرفقات السحابي.");
    return data;
  }
  async function discoverCloudOrphans(userId,known) {
    // A legacy device may have overwritten the snapshot while the actual files
    // stayed in GitHub. Recover these files conservatively as unlinked.
    if(discoveredOrphans && Date.now()-discoveredAt<10*60*1000)return discoveredOrphans;
    const base="uploads/"+userPath(userId);
    const directories=(await listCloudDir(base)).filter(entry=>
      entry.type==="dir" && /^[a-zA-Z0-9_-]{1,128}$/.test(entry.name));
    if(directories.length>250)throw new Error("عدد مجلدات المرفقات كبير؛ يلزم استرجاعها على دفعات.");
    const found=[];
    for(const dir of directories) {
      if(known.has(dir.name))continue;
      const files=await listCloudDir(dir.path);
      const candidate=files.find(entry=>entry.type==="file" &&
        /^[a-f0-9]{40}$/i.test(entry.sha||""));
      if(!candidate)continue;
      found.push({
        id:dir.name,userId,title:candidate.name,fileName:candidate.name,
        mimeType:"application/octet-stream",size:candidate.size||0,
        uploadedAt:new Date().toISOString(),recoveredFromCloud:true,
        cloudPath:candidate.path,cloudSha:candidate.sha
      });
    }
    discoveredOrphans=found;discoveredAt=Date.now();
    return found;
  }
  async function downloadCloudBlob(sha) {
    if(!/^[a-f0-9]{40}$/i.test(sha))throw new Error("مرجع مرفق سحابي غير صالح.");
    const data=await github("/git/blobs/"+encodeURIComponent(sha));
    if(data.encoding!=="base64"||!data.content)throw new Error("تعذر تنزيل محتوى المرفق من GitHub.");
    return decodeBase64(data.content);
  }
  async function pushSnapshotStrict(path,encoded,previousSha) {
    const body={message:"FTM two-way merged backup",content:encoded,branch:destination.branch||"main"};
    if(previousSha)body.sha=previousSha;
    return github(dataPath(path),{method:"PUT",body:JSON.stringify(body)});
  }
  // Exclude authentication material even if older user records contain it.
  const scrubSecrets = value => {
    if (Array.isArray(value)) return value.map(scrubSecrets);
    if (value && typeof value==="object") {
      const clean={};
      for (const [key,val] of Object.entries(value)) {
        if (/password|passphrase|access[_-]?token|refresh[_-]?token|github[_-]?token|api[_-]?key|authorization|credential|client[_-]?secret/i.test(key)) continue;
        clean[key]=scrubSecrets(val);
      }
      return clean;
    }
    return value;
  };
  async function snapshotUser() {
    const initialUser=storage.getCurrentUser();
    if(!initialUser?.id)throw new Error("تعذر تحديد حساب المعلمة لمزامنة البيانات.");
    if(!window.FTMCloudMerge)throw new Error("محرك دمج بيانات السحابة لم يُحمّل.");
    let lastConflict=null;
    for(let attempt=0;attempt<3;attempt++) {
      const userId=initialUser.id;
      const remote=await fetchRemoteSnapshot(userId);
      const known=new Set([
        ...(remote.snapshot?.portfolioItems||[]).map(x=>String(x.id)),
        ...(remote.snapshot?.unlinkedFiles||[]).map(x=>String(x.id))
      ]);
      const orphaned=await discoverCloudOrphans(userId,known);
      const merged=await window.FTMCloudMerge.reconcile({
        storage,blobs,userId,remote:remote.snapshot,cloudFiles:orphaned,
        download:downloadCloudBlob,localManifest:getManifest(userId),
        onSave:db=>originalSave.call(storage,db)
      });
      const manifest=merged.manifest;
      putManifest(userId,manifest);
      if(merged.profileChanged){
        const refreshed=storage.getUsers().find(u=>u.id===userId);
        if(refreshed)storage.saveSessionUser(refreshed);
      }
      const identityKey="itqan-ftm-school-v1:"+userId;
      if(remote.snapshot?.schoolIdentity &&
         Object.keys(remote.snapshot.schoolIdentity).length &&
         !safeRead(localStorage,identityKey)) {
        safeWrite(localStorage,identityKey,JSON.stringify(remote.snapshot.schoolIdentity));
        window.dispatchEvent(new Event("itqan:ftmIdentityChanged"));
      }
      if(merged.changed){
        window.FTMUnlinkedFiles?.render();
        window.FTMPerformanceRecords?.render();
        window.dispatchEvent(new Event("itqan:portfolioChanged"));
        window.dispatchEvent(new Event("itqan:activeUserChanged"));
        window.dispatchEvent(new CustomEvent("itqan:cloudDataPulled",{detail:{
          restored:merged.restored,linked:merged.linked.length,
          unlinked:merged.pending.length
        }}));
      }
      const items=storage.getPortfolioForUser(userId);
      const unlinkedFiles=(storage.getDB().unlinkedFiles||[]).filter(f=>f.userId===userId);
      let uploaded=0;
      for(const item of [...items,...unlinkedFiles]) {
        const id=String(item.id);
        if(manifest[id]?.sha)continue;
        const file=await blobs.getFile(id);
        if(!file?.blob)continue;
        const path="uploads/"+userPath(userId)+"/"+cleanId(id)+"/"+
          cleanFile(file.name||item.fileName);
        const result=await pushFile(path,await base64Blob(file.blob),
          "FTM automatic file backup "+cleanId(id));
        manifest[id]=result;
        putManifest(userId,manifest);
        uploaded++;
      }
      let schoolIdentity={};
      try {schoolIdentity=JSON.parse(safeRead(localStorage,identityKey)||"{}");}catch{}
      const user=storage.getCurrentUser();
      const snapshot={
        schemaVersion:1,exportedAt:new Date().toISOString(),
        userId,user:scrubSecrets(user),
        portfolioItems:scrubSecrets(items),
        unlinkedFiles:scrubSecrets(unlinkedFiles),
        includedLibraryIds:user.includedLibraryIds||[],
        schoolIdentity,
        files:manifest
      };
      try {
        await pushSnapshotStrict(remote.path,
          base64Utf8(JSON.stringify(snapshot,null,2)),remote.sha);
        putManifest(userId,manifest);
        return {uploaded,restored:merged.restored,recovered:orphaned.length,
          count:items.length+unlinkedFiles.length,
          linked:items.length,unlinked:unlinkedFiles.length};
      }catch(error){
        if((error.status===409||error.status===422)&&attempt<2){
          lastConflict=error;continue;
        }
        throw error;
      }
    }
    throw lastConflict||new Error("تعذر دمج تعديلات الجهازين.");
  }

  async function flush() {
    if (active || !queued || !token || !destination) return;
    active = true;
    try {
      while (queued && token && destination) {
        queued = false;
        statusUpdate("☁️ جارٍ استرجاع الملفات ودمج البيانات ثم حفظها سحابيًا...","syncing");
        const destinationRepo = await verifyDestination();
        const summary = await snapshotUser();
        latestError = "";
        statusUpdate((destinationRepo.private ? "✓ نسخة خاصة محفوظة" : "⚠ نسخة محفوظة في مستودع عام") +
          " • " + summary.linked + " شواهد + " + summary.unlinked + " ملفات غير مرتبطة" +
          (summary.restored?" • استُعيدت "+summary.restored+" ملفات":"") ,"synced");
      }
    } catch (error) {
      latestError = error.message;
      if (token && destination) {
        statusUpdate("⚠ لم يكتمل النسخ السحابي: " + error.message,"error");
      } else {
        statusUpdate("◌ محلي فقط • النسخ السحابي متوقف","idle");
      }
      // Do not spin indefinitely on a failed network request; the next local
      // change or explicit reconnection will retry pending backups.
    } finally { active = false; }
  }
  function queueBackup(reason = "changed") {
    if (!token || !destination) {
      statusUpdate("◌ محلي فقط • يلزم إعداد اتصال سحابي","idle");
      return;
    }
    queued = true;
    clearTimeout(timer);
    timer = setTimeout(flush,["evidence-saved","unlinked-file-saved"].includes(reason) ? 100 : 900);
  }
  function disconnect() {
    token = "";
    discoveredOrphans = null;
    discoveredAt = 0;
    publicConsent = false;
    safeDelete(sessionStorage,publicConsentKey);
    controller.abort();
    controller = new AbortController();
    queued = false;
    clearTimeout(timer);
    safeDelete(sessionStorage,sessionKey);
    statusUpdate("◌ محلي فقط • الاتصال السحابي غير مفعّل","idle");
  }
  async function connect(owner,repo,credential,options={}) {
    if (active) throw new Error("انتظري انتهاء النسخ الجاري قبل تغيير المستودع.");
    const proposed={owner:String(owner).trim(),repo:String(repo).trim(),branch:"main"};
    if (!validPart(proposed.owner)||!validPart(proposed.repo)) throw new Error("اسم مالك المستودع أو المستودع غير صالح.");
    if (!String(credential).trim()) throw new Error("رمز GitHub مطلوب.");
    destination=proposed;
    token=String(credential).trim();
    // Consent is specific to the selected repository and never survives the browser session.
    publicConsent = options.publicConsent === true;
    if(publicConsent) safeWrite(sessionStorage,publicConsentKey,repoSlug());
    else safeDelete(sessionStorage,publicConsentKey);
    try {
      const verified=await verifyDestination();
      if(verified.default_branch)destination.branch=verified.default_branch;
      safeWrite(localStorage,localKey,JSON.stringify(destination));
      safeWrite(sessionStorage,sessionKey,token);
      queueBackup("connected");
    }catch(error){
      disconnect();
      throw error;
    }
  }
  function openSettings() {
    const saved=destination||{owner:"khalidftm",repo:"itqan"};
    const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
    modal.open({
      type:"form",title:"الرفع السحابي التلقائي إلى GitHub",size:"lg",
      confirmText:"التحقق وتفعيل الرفع التلقائي",cancelText:"إلغاء",showCancel:true,
      html:`<div class="form-group"><label class="form-label" for="ftm-cloud-owner">حساب GitHub مالك المستودع</label>
          <input id="ftm-cloud-owner" class="form-control" autocomplete="off" value="${esc(saved.owner)}"></div>
        <div class="form-group"><label class="form-label" for="ftm-cloud-repo">اسم المستودع</label>
          <input id="ftm-cloud-repo" class="form-control" autocomplete="off" value="${esc(saved.repo)}"></div>
        <div class="form-group"><label class="form-label" for="ftm-cloud-token">رمز GitHub محدود للمستودع المحدد بصلاحية Contents: Read and write</label>
          <input id="ftm-cloud-token" type="password" class="form-control" autocomplete="off" spellcheck="false" placeholder="لا تضعي الرمز في كود الموقع أو ملفات المستودع"></div>
        <div class="ftm-cloud-warning"><strong>تنبيه مهم:</strong> مستودع itqan عام. الملفات والأسماء وبيانات المعلمة التي ترفعينها إليه دون تشفير يمكن لأي شخص مشاهدتها وتنزيلها، وقد تبقى في سجل GitHub بعد الحذف. لا ترفعي مستندات حساسة أو بيانات طالبات أو موظفات دون تصريح الجهة.</div>
        <label class="ftm-cloud-consent"><input type="checkbox" id="ftm-cloud-public-consent"><span>أُقر بأنني أسمح مؤقتًا بنشر الملفات وبيانات الحساب في المستودع العام دون تشفير، وأتحمل مسؤولية التحقق من ملاءمة البيانات للنشر العام.</span></label>
        <p class="text-muted">عند تفعيل الاتصال تبدأ النسخة الأولى تلقائيًا وتشمل الشواهد والملفات غير المرتبطة. بعد ذلك ترفع التعديلات تلقائيًا عند الحفظ ما دامت الجلسة متصلة. رمز GitHub يبقى في جلسة المتصفح وليس في ملفات المستودع.</p>
        <button id="ftm-cloud-stop" type="button" class="btn btn-sm btn-outline">إيقاف الرفع السحابي</button>`,
      onConfirm:()=>{
        const owner=document.getElementById("ftm-cloud-owner")?.value.trim()||"";
        const repo=document.getElementById("ftm-cloud-repo")?.value.trim()||"";
        const credential=document.getElementById("ftm-cloud-token")?.value.trim()||"";
        const consent=document.getElementById("ftm-cloud-public-consent")?.checked===true;
        if(!validPart(owner)||!validPart(repo)||!credential){
          E.ToastEngine?.show({type:"warning",title:"بيانات الاتصال ناقصة",message:"أدخلي المالك والمستودع ورمز الوصول."});
          return false;
        }
        statusUpdate("⏳ جارٍ التحقق من المستودع وصلاحيات الكتابة...","syncing");
        connect(owner,repo,credential,{publicConsent:consent}).catch(error=>{
          statusUpdate("⚠ تعذر التفعيل: "+error.message,"error");
          E.ToastEngine?.show({type:"warning",title:"لم يُفعَّل الرفع",message:error.message});
        });
      }
    });
    document.getElementById("ftm-cloud-stop")?.addEventListener("click",()=>{
      disconnect();
      modal.close();
    });
  }

  window.FTMAutoSync = Object.freeze({queueBackup,openSettings,disconnect,connect,fileSyncState});
  // Automatic retries after network restoration or when the page becomes active
  // again; no GitHub interaction is required while the session is connected.
  window.addEventListener("online",()=>queueBackup("online"));
  document.addEventListener("visibilitychange",()=>{
    if (!document.hidden && token && destination && latestError) queueBackup("retry-on-return");
  });

  // Observe all local edits without altering the app's shared storage layer.
  const originalSave = storage.saveDB;
  storage.saveDB = function(...args) {
    const result = originalSave.apply(this,args);
    queueBackup("data-saved");
    return result;
  };
  document.getElementById("ftm-cloud-settings")?.addEventListener("click",openSettings);

  const storedRepo = safeRead(localStorage,localKey);
  if (storedRepo) {
    try {
      const parsed = JSON.parse(storedRepo);
      if (validPart(parsed.owner)&&validPart(parsed.repo)) destination = {
        owner:parsed.owner,repo:parsed.repo,branch:"main"
      };
    } catch {}
  }
  token = safeRead(sessionStorage,sessionKey) || "";
  publicConsent = !!destination && safeRead(sessionStorage,publicConsentKey)===repoSlug();
  if(token && destination) queueBackup("resume-session");
  else statusUpdate("◌ محلي فقط • اتصلي بالمستودع لتفعيل الرفع التلقائي","idle");
})();

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
      throw new Error(result.message || "GitHub HTTP " + response.status);
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
    const user = storage.getCurrentUser();
    if (!user?.id) throw new Error("لم يتم تحديد مستخدم لنسخ ملف الإنجاز.");
    const items = storage.getPortfolioForUser(user.id);
    const unlinkedFiles = (storage.getDB().unlinkedFiles || []).filter(file => file.userId === user.id);
    // Both collections reference the SAME IndexedDB binary ID when a file gets linked.
    // Preserve the remote path and SHA so linking will never upload a duplicate blob.
    const allFiles = [...items, ...unlinkedFiles];
    const manifest = getManifest(user.id);
    const managed = new Set(allFiles.map(item => String(item.id)));
    // Remove previously backed-up attachments that have been deleted locally.
    for (const [id, entry] of Object.entries(manifest)) {
      if (managed.has(id)) continue;
      if (entry?.path && entry?.sha) await removeFile(entry.path,entry.sha);
      delete manifest[id];
      putManifest(user.id,manifest);
    }

    let uploaded = 0;
    for (const item of allFiles) {
      const id = String(item.id);
      if (manifest[id]?.sha) continue;
      const record = await blobs.getFile(id);
      if (!record?.blob) continue; // legacy seed examples with no actual file
      const blob = record.blob;
      const path = "uploads/" + userPath(user.id) + "/" + cleanId(id) + "/" +
        cleanFile(record.name || item.fileName);
      const saved = await pushFile(path,await base64Blob(blob),
        "FTM automatic file backup " + cleanId(id));
      manifest[id] = saved;
      putManifest(user.id,manifest);
      uploaded++;
    }

    const identityKey = "itqan-ftm-school-v1:" + user.id;
    let schoolIdentity = {};
    try { schoolIdentity = JSON.parse(safeRead(localStorage,identityKey) || "{}"); } catch {}
    // Never export authentication tokens or other users' records in this snapshot.
    const snapshot = {
      schemaVersion:1,exportedAt:new Date().toISOString(),
      userId:user.id,user:scrubSecrets(user),
      portfolioItems:scrubSecrets(items),
      unlinkedFiles:scrubSecrets(unlinkedFiles),
      includedLibraryIds:user.includedLibraryIds || [],
      schoolIdentity,
      files:manifest
    };
    const snapshotPath = "data/" + userPath(user.id) + "/snapshot.json";
    await pushFile(snapshotPath,base64Utf8(JSON.stringify(snapshot,null,2)),
      "FTM automatic metadata backup");
    return {uploaded,count:allFiles.length,linked:items.length,unlinked:unlinkedFiles.length};
  }

  async function flush() {
    if (active || !queued || !token || !destination) return;
    active = true;
    try {
      while (queued && token && destination) {
        queued = false;
        statusUpdate("☁️ جارٍ رفع النسخة السحابية تلقائيًا...","syncing");
        const destinationRepo = await verifyDestination();
        const summary = await snapshotUser();
        latestError = "";
        statusUpdate((destinationRepo.private ? "✓ نسخة خاصة محفوظة" : "⚠ نسخة محفوظة في مستودع عام") +
          " • " + summary.linked + " شواهد + " + summary.unlinked + " ملفات غير مرتبطة",destinationRepo.private ? "synced" : "public");
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

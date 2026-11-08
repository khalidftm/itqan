/**
 * FTM opt-in private GitHub automatic backup.
 *
 * Security rules:
 *  - NEVER upload to a public repository (including khalidftm/itqan).
 *  - Verify the selected destination via GitHub API before EVERY upload pass.
 *  - Only transfer the active teacher's snapshot and locally stored evidence.
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
  const status = document.getElementById("ftm-auto-backup-status");
  let token = "";
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
  async function verifyPrivate() {
    if (!token || !destination) throw new Error("لم يُضبط اتصال المستودع الخاص لهذه الجلسة.");
    if (!validPart(destination.owner) || !validPart(destination.repo)) {
      throw new Error("اسم المالك أو المستودع غير صالح.");
    }
    const fullName = repoSlug();
    if (fullName === "khalidftm/itqan") {
      throw new Error("مستودع الموقع itqan عام؛ لن تُرسل إليه الشواهد.");
    }
    const repo = await github("");
    if (repo.private !== true) {
      throw new Error("المستودع المحدد ليس Private. الحفظ السحابي موقوف لحماية البيانات.");
    }
    if (!repo.permissions?.push) {
      throw new Error("رمز الاتصال لا يمتلك صلاحية كتابة الملفات إلى هذا المستودع الخاص.");
    }
    if (String(repo.full_name || "").toLowerCase() !== fullName) {
      throw new Error("المستودع المتحقق منه لا يطابق المستودع المطلوب.");
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
  async function snapshotUser() {
    const user = storage.getCurrentUser();
    if (!user?.id) throw new Error("لم يتم تحديد مستخدم لنسخ ملف الإنجاز.");
    const items = storage.getPortfolioForUser(user.id);
    const manifest = getManifest(user.id);
    const managed = new Set(items.map(item => String(item.id)));
    // Remove previously backed-up attachments that have been deleted locally.
    for (const [id, entry] of Object.entries(manifest)) {
      if (managed.has(id)) continue;
      if (entry?.path && entry?.sha) await removeFile(entry.path,entry.sha);
      delete manifest[id];
      putManifest(user.id,manifest);
    }

    let uploaded = 0;
    for (const item of items) {
      const id = String(item.id);
      if (manifest[id]?.sha) continue;
      const record = await blobs.getFile(id);
      if (!record?.blob) continue; // legacy seed examples with no actual file
      const blob = record.blob;
      const path = "uploads/" + userPath(user.id) + "/" + cleanId(id) + "/" +
        cleanFile(record.name || item.fileName);
      const saved = await pushFile(path,await base64Blob(blob),
        "FTM: حفظ شاهد في المستودع الخاص " + cleanId(id));
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
      userId:user.id,user,
      portfolioItems:items,
      includedLibraryIds:user.includedLibraryIds || [],
      schoolIdentity,
      files:manifest
    };
    const snapshotPath = "data/" + userPath(user.id) + "/snapshot.json";
    await pushFile(snapshotPath,base64Utf8(JSON.stringify(snapshot,null,2)),
      "FTM: تحديث النسخة الاحتياطية الخاصة بالمستخدمة");
    return {uploaded,count:items.length};
  }

  async function flush() {
    if (active || !queued || !token || !destination) return;
    active = true;
    try {
      while (queued && token && destination) {
        queued = false;
        statusUpdate("☁️ جارٍ النسخ التلقائي إلى المستودع الخاص...","syncing");
        await verifyPrivate(); // fail closed on any visibility or authorization change
        const summary = await snapshotUser();
        latestError = "";
        statusUpdate("✓ نسخة خاصة محفوظة تلقائيًا • " + summary.count + " شواهد","synced");
      }
    } catch (error) {
      latestError = error.message;
      statusUpdate("⚠ لم يكتمل النسخ السحابي: " + error.message,"error");
      // Do not spin indefinitely on a failed network request; the next local
      // change or explicit reconnection will retry pending backups.
    } finally { active = false; }
  }
  function queueBackup(reason = "changed") {
    if (!token || !destination) {
      statusUpdate("◌ محلي فقط • يلزم إعداد مستودع خاص","idle");
      return;
    }
    queued = true;
    clearTimeout(timer);
    timer = setTimeout(flush,reason==="evidence-saved" ? 100 : 900);
  }
  function disconnect() {
    token = "";
    controller.abort();
    controller = new AbortController();
    queued = false;
    clearTimeout(timer);
    safeDelete(sessionStorage,sessionKey);
    statusUpdate("◌ محلي فقط • الاتصال السحابي غير مفعّل","idle");
  }
  async function connect(owner,repo,credential) {
    if (active) throw new Error("أكملي النسخ الحالي قبل تغيير المستودع.");
    const proposed = {owner:owner.trim(),repo:repo.trim(),branch:"main"};
    if (!validPart(proposed.owner) || !validPart(proposed.repo)) {
      throw new Error("المالك والمستودع يجب أن يكونا اسمي GitHub صحيحين.");
    }
    destination = proposed;
    token = credential.trim();
    try {
      const verified = await verifyPrivate();
      if (verified.default_branch) destination.branch = verified.default_branch;
      safeWrite(localStorage,localKey,JSON.stringify(destination));
      safeWrite(sessionStorage,sessionKey,token);
      queueBackup("connected");
    } catch(error) {
      disconnect();
      throw error;
    }
  }
  function openSettings() {
    const saved = destination || {owner:"",repo:""};
    const esc = value=>String(value).replace(/[&<>"']/g,char=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[char]));
    modal.open({
      type:"form",title:"إعداد النسخ الاحتياطي التلقائي إلى GitHub خاص",size:"lg",
      confirmText:"التحقق من الاتصال وتفعيل النسخ التلقائي",
      cancelText:"إلغاء",showCancel:true,
      html:`<div class="form-group"><label class="form-label" for="ftm-cloud-owner">حساب مالك المستودع الخاص</label>
          <input id="ftm-cloud-owner" class="form-control" autocomplete="off" value="${esc(saved.owner)}" placeholder="اسم حساب GitHub"></div>
        <div class="form-group"><label class="form-label" for="ftm-cloud-repo">اسم المستودع الخاص (Private)</label>
          <input id="ftm-cloud-repo" class="form-control" autocomplete="off" value="${esc(saved.repo)}" placeholder="اسم مستودع خاص منفصل عن itqan"></div>
        <div class="form-group"><label class="form-label" for="ftm-cloud-token">رمز GitHub بصلاحية Contents: Read and write للمستودع الخاص فقط</label>
          <input id="ftm-cloud-token" type="password" class="form-control" autocomplete="off" spellcheck="false" placeholder="يُستخدم لهذه الجلسة فقط ولا يُحفظ في قاعدة بيانات الموقع"></div>
        <p class="text-muted">بعد التفعيل: تُرفع الشواهد الجديدة ونسخة بيانات المعلمة تلقائيًا عند الحفظ، دون زر مزامنة أو رفع سحابي. يُتحقق من كون المستودع Private قبل كل دفعة. الملفات تبقى محفوظة محليًا عند تعذر الاتصال.</p>
        <p class="text-muted"><strong>تنبيه خصوصية:</strong> هذا حل متصفح تجريبي، وتظل رموز الوصول قابلة للقراءة من سكربتات نفس الموقع. لا تستخدمه لبيانات الطالبات أو غيرها من البيانات الحساسة قبل اعتماد خدمة خلفية آمنة وتصريح جهة العمل.</p>
        <button id="ftm-cloud-stop" type="button" class="btn btn-sm btn-outline">إيقاف النسخ السحابي لهذه الجلسة</button>`,
      onConfirm:() => {
        const owner=document.getElementById("ftm-cloud-owner")?.value.trim()||"";
        const repo=document.getElementById("ftm-cloud-repo")?.value.trim()||"";
        const secret=document.getElementById("ftm-cloud-token")?.value.trim()||"";
        if (!validPart(owner)||!validPart(repo)||!secret) {
          E.ToastEngine?.show({type:"warning",title:"بيانات ناقصة",message:"أدخلي المالك والمستودع ورمز هذه الجلسة."});
          return false;
        }
        statusUpdate("⏳ جارٍ التحقق من خصوصية المستودع...","syncing");
        connect(owner,repo,secret).catch(error=>{
          statusUpdate("⚠ فشل التفعيل: " + error.message,"error");
          E.ToastEngine?.show({type:"warning",title:"لم يُفعّل النسخ السحابي",message:error.message});
        });
      }
    });
    document.getElementById("ftm-cloud-stop")?.addEventListener("click", () => {
      disconnect();
      modal.close();
    });
  }

  window.FTMAutoSync = Object.freeze({queueBackup,openSettings,disconnect,connect});

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
  if (token && destination) queueBackup("resume-session");
  else statusUpdate("◌ محلي فقط • أعدي اتصال الخزنة الخاصة لهذه الجلسة","idle");
})();

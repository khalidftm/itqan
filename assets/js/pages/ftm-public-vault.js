/*
 * Public-repository backup envelope, v1.
 * Only ciphertext is uploaded. This does NOT provide a full security audit or
 * protect a compromised browser, malicious scripts on this origin, or weak passwords.
 */
(function () {
  "use strict";
  const MAGIC = [70,84,77,49]; // "FTM1"
  const SALT_LENGTH = 16;
  const IV_LENGTH = 12;
  const ITERATIONS = 250000;
  const MAX_SIZE = 20 * 1024 * 1024; // conservative limit for browser-to-GitHub API
  function webCrypto() {
    const c = window.crypto;
    if (!c?.subtle || typeof c.getRandomValues !== "function") {
      throw new Error("التشفير غير متاح في هذا المتصفح. استخدمي متصفحًا حديثًا عبر HTTPS.");
    }
    return c;
  }
  function randomBytes(count) {
    const result = new Uint8Array(count);
    webCrypto().getRandomValues(result);
    return result;
  }
  function randomId() {
    return Array.from(randomBytes(18), v => v.toString(16).padStart(2,"0")).join("");
  }
  function b64(bytes) {
    let output = "";
    for (let i=0;i<bytes.byteLength;i+=0x4000) {
      output+=String.fromCharCode(...bytes.subarray(i,i+0x4000));
    }
    return btoa(output);
  }
  function from64(encoded) {
    const raw=atob(String(encoded).replace(/\s/g,""));
    const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return bytes;
  }
  async function key(password,salt,usage) {
    const c=webCrypto();
    const secret=await c.subtle.importKey("raw",new TextEncoder().encode(password),
      {name:"PBKDF2"},false,["deriveKey"]);
    return c.subtle.deriveKey({
      name:"PBKDF2",hash:"SHA-256",salt,iterations:ITERATIONS
    },secret,{name:"AES-GCM",length:256},false,[usage]);
  }
  async function encryptBytes(bytes,passphrase) {
    if (typeof passphrase!=="string"||passphrase.length<16) {
      throw new Error("كلمة مرور التشفير يجب ألا تقل عن 16 حرفًا.");
    }
    if(bytes.byteLength>MAX_SIZE)throw new Error("يتجاوز الملف حد النسخ المشفر المؤقت (20 ميجابايت).");
    const salt=randomBytes(SALT_LENGTH),iv=randomBytes(IV_LENGTH);
    const secret=await key(passphrase,salt,"encrypt");
    const ciphertext=new Uint8Array(await webCrypto().subtle.encrypt({name:"AES-GCM",iv},secret,bytes));
    const payload=new Uint8Array(MAGIC.length+SALT_LENGTH+IV_LENGTH+ciphertext.byteLength);
    payload.set(MAGIC,0);payload.set(salt,MAGIC.length);payload.set(iv,MAGIC.length+SALT_LENGTH);
    payload.set(ciphertext,MAGIC.length+SALT_LENGTH+IV_LENGTH);
    return b64(payload);
  }
  async function decryptBytes(encoded,passphrase) {
    const bytes=from64(encoded);
    if(bytes.byteLength<4+SALT_LENGTH+IV_LENGTH+16 ||
       !MAGIC.every((v,i)=>bytes[i]===v)) throw new Error("صيغة النسخة المشفرة غير صالحة.");
    const salt=bytes.slice(4,4+SALT_LENGTH);
    const iv=bytes.slice(4+SALT_LENGTH,4+SALT_LENGTH+IV_LENGTH);
    const cipher=bytes.slice(4+SALT_LENGTH+IV_LENGTH);
    try {
      const secret=await key(passphrase,salt,"decrypt");
      return new Uint8Array(await webCrypto().subtle.decrypt({name:"AES-GCM",iv},secret,cipher));
    }catch{throw new Error("تعذّر فتح النسخة المشفرة. تحققي من كلمة مرور التشفير.");}
  }
  function encodeText(text){return new TextEncoder().encode(String(text));}
  async function encryptText(text,passphrase){return encryptBytes(encodeText(text),passphrase);}
  async function encryptBlob(blob,passphrase){
    if(!blob || typeof blob.arrayBuffer!=="function")throw new Error("تعذّر قراءة الملف المراد تشفيره.");
    if(blob.size>MAX_SIZE)throw new Error("الملف أكبر من الحد المؤقت للنسخ المشفر (20 ميجابايت).");
    return encryptBytes(new Uint8Array(await blob.arrayBuffer()),passphrase);
  }
  async function decryptText(encoded,passphrase){
    return new TextDecoder("utf-8",{fatal:true}).decode(await decryptBytes(encoded,passphrase));
  }
  window.FTMPublicVault=Object.freeze({
    encryptBlob,encryptText,decryptText,randomId,MAX_SIZE
  });
})();

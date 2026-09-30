(function(){
"use strict";
const products=window.SEACHLOOM_GUMROAD_PRODUCTS||{};
const file=(location.pathname.split("/").pop()||"").replace(/\.html$/,"");
const product=products[file];
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
async function api(path,opts={}){const r=await fetch(path,{credentials:"same-origin",headers:{"content-type":"application/json",...(opts.headers||{})},...opts});let d={};try{d=await r.json()}catch(_){}if(!r.ok)throw new Error(d.message||"Request failed");return d}
async function access(){if(!product)return{active:false};try{return await api("/api/auth/entitlements?tool="+encodeURIComponent(product.productPermalink),{method:"GET",headers:{}})}catch(_){return{active:false}}}
window.openPaywall=async function(){
 const result=document.getElementById("result");if(!result||!product)return;
 const me=await api("/api/auth/me",{method:"GET",headers:{}}).catch(()=>({authenticated:false}));
 const a=await access();
 if(a.active){result.innerHTML=`<div class="paywall"><div class="eyebrow">Lifetime access</div><h3>✓ ${esc(product.name)} is unlocked</h3><p>Your account has lifetime access to this tool.</p><button class="amber wide" onclick="location.reload()">Continue to tool</button></div>`;return;}
 result.innerHTML=`<div class="paywall">
 <div class="eyebrow">Protected result</div><h3>Unlock ${esc(product.name)}</h3>
 <p>Purchase this tool once for lifetime access. No credits and no recurring subscription.</p>
 <a class="amber wide" href="${esc(product.checkoutUrl)}" target="_blank" rel="noopener">Buy lifetime access →</a>
 <div style="height:14px"></div>
 <div class="eyebrow">Already purchased?</div>
 ${me.authenticated?`<p>You're signed in as <b>${esc(me.user.email)}</b>. Enter the Gumroad license key from your receipt to activate lifetime access on this account.</p>`:
 `<p>First <button class="outline" onclick="showLogin()">log in</button> or <button class="outline" onclick="showSignup()">create an account</button>, then activate your purchase.</p>`}
 <input id="gumroadLicenseKey" class="modal-input" placeholder="Enter your Gumroad license key" autocomplete="off">
 <button class="outline wide" id="activateGumroadLicense">Activate lifetime access</button>
 <div id="gumroadVerifyMsg" class="muted" style="margin-top:10px"></div>
 <small class="muted">Your license is verified with Gumroad and attached to your SeachLoomAI account.</small>
 </div>`;
 document.getElementById("activateGumroadLicense").addEventListener("click",async()=>{
   const me2=await api("/api/auth/me",{method:"GET",headers:{}}).catch(()=>({authenticated:false}));
   const msg=document.getElementById("gumroadVerifyMsg"),btn=document.getElementById("activateGumroadLicense");
   if(!me2.authenticated){msg.textContent="Please log in or create your account first.";return}
   const key=document.getElementById("gumroadLicenseKey").value.trim(); if(!key){msg.textContent="Please enter your Gumroad license key.";return}
   btn.disabled=true;msg.textContent="Verifying purchase…";
   try{const d=await api("/api/gumroad/activate",{method:"POST",body:JSON.stringify({product_permalink:product.productPermalink,license_key:key,tool_slug:file})});
     msg.textContent=d.message||"Purchase activated."; if(d.ok){btn.textContent="✓ Lifetime access activated";setTimeout(()=>location.reload(),700)}
   }catch(e){msg.textContent=e.message||"Activation failed."}finally{btn.disabled=false}
 });
};
window.seachloomCheckGumroadAccess=access;
})();
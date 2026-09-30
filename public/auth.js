(function(){
"use strict";
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
async function api(path, opts={}){
  const r=await fetch(path,{credentials:"same-origin",headers:{"content-type":"application/json",...(opts.headers||{})},...opts});
  let d={}; try{d=await r.json();}catch(_){}
  if(!r.ok) throw new Error(d.message||"Request failed");
  return d;
}
function ensureModal(){
  if(document.getElementById("authModal")) return;
  const el=document.createElement("div");
  el.id="authModal"; el.className="modal";
  el.innerHTML='<div class="modal-box auth-box"><button class="x" onclick="closeAuth()">×</button><div id="authContent"></div></div>';
  document.body.appendChild(el);
}
function authForm(mode="login",msg=""){
  ensureModal();
  const login=mode==="login";
  document.getElementById("authContent").innerHTML=`
    <div class="eyebrow">${login?"Welcome back":"Create your account"}</div>
    <h2>${login?"Log in to SeachLoom AI":"Create your SeachLoom AI account"}</h2>
    <p>${login?"Access your purchased tools and lifetime entitlements.":"Create one account to manage your purchases and access your tools."}</p>
    <form id="authForm">
      ${login?"":'<label>Full name<input name="name" required maxlength="80" autocomplete="name"></label>'}
      <label>Email<input name="email" type="email" required maxlength="254" autocomplete="email"></label>
      <label>Password<input name="password" type="password" required minlength="8" autocomplete="${login?"current-password":"new-password"}"></label>
      ${login?'<label class="auth-check"><input type="checkbox" name="remember"> Remember me</label>':""}
      <button class="amber wide" type="submit">${login?"Log in":"Create account"}</button>
      <p id="authMsg" class="form-msg">${esc(msg)}</p>
    </form>
    <div class="auth-switch">${login?`New here? <button type="button" onclick="showSignup()">Create an account</button>`:`Already have an account? <button type="button" onclick="showLogin()">Log in</button>`}</div>
  `;
  document.getElementById("authModal").classList.add("show");
  document.getElementById("authForm").addEventListener("submit",async e=>{
    e.preventDefault(); const f=new FormData(e.target); const payload=Object.fromEntries(f.entries());
    const m=document.getElementById("authMsg"); m.textContent="Please wait…";
    try{
      const d=await api(login?"/api/auth/login":"/api/auth/signup",{method:"POST",body:JSON.stringify(payload)});
      m.textContent=d.message||"Success"; setTimeout(()=>{closeAuth(); updateAuthUI(); if(window.seachloomAfterAuth) window.seachloomAfterAuth();},300);
    }catch(err){m.textContent=err.message||"Unable to continue.";}
  });
}
window.showLogin=()=>authForm("login");
window.showSignup=()=>authForm("signup");
window.closeAuth=()=>{const m=document.getElementById("authModal");if(m)m.classList.remove("show");};
window.seachloomLogout=async()=>{try{await api("/api/auth/logout",{method:"POST",body:"{}"});}catch(_){} updateAuthUI();};
window.seachloomGetSession=async()=>{try{return await api("/api/auth/me",{method:"GET",headers:{}});}catch(_){return {authenticated:false};}};
async function updateAuthUI(){
  const d=await window.seachloomGetSession();
  document.querySelectorAll("[data-auth-action]").forEach(b=>{
    b.textContent=d.authenticated?`Hi, ${d.user.name||d.user.email.split("@")[0]}`:"Log in";
    b.onclick=()=>d.authenticated?window.openDashboard():window.showLogin();
  });
  document.querySelectorAll("[data-dashboard-link]").forEach(e=>e.style.display=d.authenticated?"":"none");
}
window.openDashboard=async()=>{
  const d=await window.seachloomGetSession(); if(!d.authenticated){showLogin();return;}
  ensureModal();
  const tools=Object.values(window.SEACHLOOM_GUMROAD_PRODUCTS||{});
  let rows="";
  for(const p of tools){
    let active=false;
    try{const r=await api("/api/auth/entitlements?tool="+encodeURIComponent(p.productPermalink),{method:"GET",headers:{}});active=!!r.active;}catch(_){}
    rows+=`<div class="account-tool"><div><b>${esc(p.name)}</b><small>${active?"Lifetime access active":"Not purchased"}</small></div>${active?`<span class="status-ok">✓ Active</span>`:`<a class="amber" href="${esc(p.checkoutUrl)}" target="_blank" rel="noopener">Buy →</a>`}</div>`;
  }
  document.getElementById("authContent").innerHTML=`
    <div class="eyebrow">My account</div><h2>Welcome, ${esc(d.user.name||d.user.email)}</h2>
    <p>${esc(d.user.email)}</p>
    <div class="account-tools">${rows}</div>
    <button class="outline wide" onclick="seachloomLogout();closeAuth()">Log out</button>`;
  document.getElementById("authModal").classList.add("show");
};
document.addEventListener("DOMContentLoaded",updateAuthUI);
})();
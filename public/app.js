const tools = [
["ai-content-optimizer","AI Content Optimizer","Improve content structure, relevance and SEO signals."],
["keyword-researcher","Keyword Researcher","Discover keyword ideas and organize opportunities."],
["keyword-clusterer","Keyword Clustering","Group related keywords into practical topic clusters."],
["search-intent","Search Intent Analyzer","Classify the intent behind a search and content opportunity."],
["keyword-opportunity","Keyword Opportunity Finder","Find promising topics from your seed keyword."],
["seo-brief","SEO Brief Builder","Build a structured brief before writing."],
["content-gap","Content Gap Analyzer","Identify missing topics and coverage opportunities."],
["content-outline","Content Outline Generator","Create a clear, search-focused content outline."],
["onpage-audit","On-Page SEO Audit","Review core on-page elements and identify issues."],
["meta-generator","Meta Generator","Create search-ready title and meta description options."],
["internal-links","Internal Link Suggestions","Find useful internal-link opportunities."],
["schema-generator","Schema Generator","Generate structured-data starting points."],
["ai-visibility","AI Search Visibility Tracker","Prepare a workflow for monitoring AI-search visibility."],
["ai-citations","AI Citation Analyzer","Analyze citation opportunities in AI-search responses."],
["geo-optimizer","AI Search Content Optimizer","Improve content for generative search experiences."]
];

const icons=["🔍","🗝️","🧩","🎯","📈","📝","🕳️","🧭","🧪","🏷️","🔗","🧱","🤖","📚","✨"];
const grid=document.getElementById("toolGrid");
function renderTools(list=tools){
 grid.innerHTML=list.map((t,i)=>{
   const product=(window.SEACHLOOM_GUMROAD_PRODUCTS||{})[t[0]];
   const checkout=product && product.checkoutUrl ? product.checkoutUrl : `tools/${t[0]}.html`;
   return `<article class="tool-card">
 <div class="tool-icon">${icons[i%icons.length]}</div>
 <span class="tool-tag">AI + SEO</span>
 <h3>${t[1]}</h3><p>${t[2]}</p>
 <a class="tool-btn" href="tools/${t[0]}.html">Open tool <span>→</span></a>
 <a class="tool-btn" style="margin-top:8px" href="${checkout}" target="_blank" rel="noopener">Buy lifetime access <span>↗</span></a>
 </article>`;
 }).join("");
}
renderTools();

function filterTools(){const q=document.getElementById("toolSearch").value.toLowerCase();renderTools(tools.filter(t=>(t[1]+" "+t[2]).toLowerCase().includes(q)))}
async function runPreview(slug,name){
 const modal=document.getElementById("modal"); modal.classList.add("show");
 document.getElementById("modalContent").innerHTML=`<div class="eyebrow">Tool preview</div><h2>${name}</h2><p>Enter a topic, URL or keyword to generate a limited preview. The complete report remains protected.</p><input id="toolInput" class="modal-input" placeholder="Enter your topic or URL"><button class="amber wide" onclick="generatePreview('${slug}','${name}')">Generate preview</button><div id="previewOut"></div>`;
}
async function generatePreview(slug,name){
 const input=document.getElementById("toolInput").value.trim()||"example topic";
 const out=document.getElementById("previewOut");
 out.innerHTML=`<div class="preview-box"><strong>Preview ready</strong><p>${name} identified useful analysis opportunities for <b>${escapeHtml(input)}</b>.</p><div class="blur-lines"><i></i><i></i><i></i></div><button class="amber wide" onclick="openPaywall()">🔒 Unlock full report</button></div>`;
}
function openPaywall(){document.getElementById("modal").classList.add("show");document.getElementById("modalContent").innerHTML=`<div class="eyebrow">Full report</div><h2>Unlock your SeachLoom result</h2><p>The preview is free. The complete analysis is a paid deliverable and will be released after verified payment or credits.</p><div class="price">Unlock report <span>Payment-ready</span></div><button class="amber wide" onclick="showToast('Payment gateway placeholder — connect your chosen provider next.');closeModal()">Continue to payment</button><small class="muted">No payment is processed by this MVP build yet.</small>`}
function openLesson(title){document.getElementById("modal").classList.add("show");document.getElementById("modalContent").innerHTML=`<div class="eyebrow">Tutorial</div><h2>${title}</h2><p>SeachLoom's tutorials are designed to teach the workflow while you use the tools. This module can later be expanded into a full learning library.</p><div class="lesson-detail"><b>Learn → Apply → Measure → Improve</b><p>Start with the user's search intent, apply it to the page or content, measure the result, then refine the next iteration.</p></div>`}
function submitArticle(e){e.preventDefault();const f=new FormData(e.target);const data=Object.fromEntries(f.entries());fetch("/api/write-for-us",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)}).then(r=>r.json()).then(()=>{document.getElementById("formMsg").textContent="Thank you. Your article has been submitted for editorial review.";e.target.reset()}).catch(()=>{document.getElementById("formMsg").textContent="The submission interface is ready, but the production Worker/database connection still needs to be deployed."})}
function closeModal(){document.getElementById("modal").classList.remove("show")}
function showToast(msg){alert(msg)}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

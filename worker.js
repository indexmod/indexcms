// =========================================================
// ================= CSS ENGINE ============================
// =========================================================
function baseCSS() {
  return `
/* ===== RESET ===== */
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }

/* ===== BODY ===== */

body {
 font-family: Georgia, "Times New Roman", serif;
 font-size: 22px;
 line-height: 1.75;

 color: #000;
 background: #fff;

 /* 📐 сетка страницы */
 max-width: 1100px;
 margin: 0 auto;

 /* 🔥 критично: воздух всей системы */
 padding: 100px 40px 100px;
}

.topbar {
  position: relative;

  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  padding: 0;
  margin-bottom: 40px;
}

/* ===== LOGO CONTROL ===== */

.logo {
  display: inline-flex;
  align-items: flex-start;

  padding: 0;
  margin: 0;
}

.logo {
  margin-left: 0;
}

.logo img {
 height: 250px;
 display: block;
 transform-origin: center;

 /* постоянное дыхание */
 animation: pulse 4s infinite ease-in-out;
}

/* мягкое дыхание */
@keyframes pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.04); }
  100% { transform: scale(1); }
}

/* ===== NAV ===== */
.nav { display: flex; gap: 18px; }

/* ===== TYPO ===== */
h1 { font-size: 48px; margin: 0 0 40px; font-weight: normal; }
h2 { font-size: 28px; margin: 40px 0 10px; font-weight: normal; }

p { margin: 16px 0; }
ul { padding-left: 24px; }

a { color: #1a73e8; text-decoration: none; }
a:hover { text-decoration: underline; }

button {
  all: unset;
  cursor: pointer;
  color: #1a73e8;
}

/* ===== EDITOR ===== */
textarea {
  width: 100%;
  height: 80vh;
  border: none;
  outline: none;
  resize: none;
  font-family: monospace;
  font-size: 16px;
}

/* ===== CONTENT ===== */
pre { white-space: pre-wrap; }

/* ===== PRELOAD ===== */

#preload {
  font-size: 40px;
  margin: 20px 0;
}

/* ===== MARKDOWN EXTENSIONS ===== */

/* strong (зеленый текст) */
strong {
  font-weight: 100;
  color: green;
}

/* изображения из markdown */
img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 20px 0;
}

/* таблицы */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 40px 0;
}

th, td {
  border: 1px solid #000;
  padding: 8px 10px;
  text-align: left;
  vertical-align: top;
}

/* ===== FOOTNOTE STYLE ===== */

.fn {
  font-size: 0.7em;
  vertical-align: super;
  position: relative;
  top: -0.2em;
  margin-left: 2px;
}

/* ===== INDEX GRID ===== */

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}

/* ===== LETTER SECTION ===== */
.letter {
  font-size: 90px;
  margin: 20px 0 10px;
  font-weight: normal;
}

/* ===== COLUMN LINKS ===== */
.col a {
  display: block;
  margin: 6px 0;
}

/* =========================================================
   📱 RESPONSIVE LAYER
   ========================================================= */

   @media (max-width: 1024px) {
     .letter {
       font-size: 42px;
     }
   }

   @media (max-width: 640px) {
     .letter {
       font-size: 32px;
     }
   }
   /* ===== FOOTER ===== */

   .site-footer {
     display: inline-flex;
     align-items: center;

     padding: 12px 16px;
     margin-top: 80px;

     border: 1px dotted rgba(168, 85, 247, 0.5);
     border-radius: 30px;
     font-family: monospace;

     display: block;
     width: fit-content;
     margin-left: auto;
   }

   .footer-link {
     display: inline-flex;
     align-items: center;
     gap: 10px;

     text-decoration: none !important;
     color: #a855f7 !important;
     font-size: 17px;
     font-family: monospace;
   }

/* override любых глобальных ссылок */
.footer-link,
.footer-link:visited,
.footer-link:hover,
.footer-link:active {
  color: #a855f7 !important;
  text-decoration: none !important;
}

.footer-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a855f7;
  display: inline-block;
}

.footer-text {
  font-weight: 900;
}
`;
}

// =========================================================
// ================= HTML WRAPPER ==========================
// =========================================================
function html(c, rightUI = "") {
  return new Response(`
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>${baseCSS()}</style>

<meta name="viewport" content="width=device-width, initial-scale=1">

<meta name="description" content="Indexmod — evolving fashion and art encyclopedia">

<meta property="og:type" content="article">
<meta property="og:site_name" content="Indexmod Fashion and Art">

<meta name="twitter:card" content="summary_large_image">

<!-- Yandex.Metrika counter -->
<script type="text/javascript">
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=109041768', 'ym');

    ym(109041768, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/109041768" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Yandex.Metrika counter -->
</head>

<body>

<div class="topbar">
  <a href="/" class="logo">
    <img src="/logo.svg">
  </a>
  <div class="nav">${rightUI}</div>
</div>

${c}
<footer class="site-footer">
  <a class="footer-link" href="https://mod.indexmod.press">
    <span class="footer-dot"></span>
    <span class="footer-text">Mod</span>
  </a>
</footer>
</body>
</html>
`, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
// =========================================================
// ================= STORAGE ===============================
// =========================================================
const file = (slug) => slug + ".md";
const INDEX_FILE = "index.json"; // 🆕 кэш списка страниц


// =========================================================
// ================= PARSER ================================
// =========================================================
function parse(md = "") {
  const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { title: "", slug: "", content: md };

  const fm = {};
  m[1].split("\n").forEach(l => {
    const i = l.indexOf(":");
    if (i === -1) return;
    fm[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  });

  return {
    title: fm.title || "",
    slug: fm.slug || "",
    content: m[2]
  };
}


// =========================================================
// ================= R2 ====================================
// =========================================================
async function getFile(env, slug) {
  const obj = await env.PAGES.get(file(slug));
  return obj ? await obj.text() : null;
}

async function putFile(env, slug, content) {
  await env.PAGES.put(file(slug), content);
}


// =========================================================
// ================= 🆕 INDEX CACHE =========================
// =========================================================
async function getIndex(env) {
  const obj = await env.PAGES.get(INDEX_FILE);
  if (!obj) return null;
  return JSON.parse(await obj.text());
}

async function saveIndex(env, pages) {
  await env.PAGES.put(INDEX_FILE, JSON.stringify(pages));
}


// =========================================================
// ================= LIST (fallback) =======================
// =========================================================
async function list(env) {
  const res = await env.PAGES.list();

  const pages = await Promise.all(
    res.objects
      .filter(o => o.key.endsWith(".md"))
      .map(async o => {
        const slug = o.key.replace(".md", "");
        const md = await getFile(env, slug);
        const parsed = parse(md);

        return {
          slug,
          title: parsed.title || slug
        };
      })
  );

  pages.sort((a, b) => a.title.localeCompare(b.title));
  return pages;
}


// =========================================================
// ================= 🆕 SAVE + INDEX UPDATE ================
// =========================================================
async function savePage(env, slug, content) {
  await putFile(env, slug, content);

  const parsed = parse(content);

  let index = await getIndex(env);
  if (!index) index = [];

  const existing = index.find(p => p.slug === slug);

  if (existing) {
    existing.title = parsed.title || slug;
  } else {
    index.push({
      slug,
      title: parsed.title || slug
    });
  }

  index.sort((a, b) => a.title.localeCompare(b.title));

  await saveIndex(env, index);
}


// =========================================================
// ================= 🧾 SEO META ===========================
// =========================================================
function meta({ title, content, url }) {
  const desc = (content || "")
    .replace(/[#_*>\-\n]/g, " ")
    .slice(0, 160);

  return `
<title>${title}</title>

<meta name="description" content="${desc}">

<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">

<meta name="twitter:card" content="summary_large_image">
`;
}


// =========================================================
// ================= HTML ================================
// =========================================================
function html(c, metaBlock = "", rightUI = "") {
  return new Response(`
<!doctype html>
<html>
<head>
<meta charset="utf-8">

${metaBlock}

<link rel="icon" href="/favicon.svg">
<meta name="viewport" content="width=device-width, initial-scale=1">

<style>
body {
 font-family: Georgia, serif;
 max-width: 1100px;
 margin: 0 auto;
 padding: 100px 40px;
}
.grid { display: grid; grid-template-columns: repeat(3,1fr); gap:40px;}
.letter { font-size:40px; }
img { max-width:100%; margin:20px 0;}
.fn { font-size:0.7em; vertical-align:super;}
</style>
</head>

<body>

<div class="topbar">
  <a href="/"><img src="/logo.svg" height="120"></a>
  <div>${rightUI}</div>
</div>

${c}

</body>
</html>
`, {
    headers: { "Content-Type": "text/html" }
  });
}


// =========================================================
// ================= INDEX ================================
// =========================================================
const INDEX = `
<div id="list">
  <div id="preload">Loading Indexmod…</div>
</div>

<script>
fetch("/_index")
.then(r => r.json())
.then(items => {

  const container = document.getElementById("list");

  const groups = {};
  items.forEach(p => {
    const l = (p.title[0]||"#").toUpperCase();
    if (!groups[l]) groups[l] = [];
    groups[l].push(p);
  });

  const letters = Object.keys(groups).sort();
  const cols = [[],[],[]];
  letters.forEach((l,i)=>cols[i%3].push(l));

  container.innerHTML = '<div class="grid"></div>';
  const grid = container.firstChild;

  cols.forEach(colLetters=>{
    const col = document.createElement("div");

    colLetters.forEach(letter=>{
      const h = document.createElement("div");
      h.className="letter";
      h.textContent=letter;
      col.appendChild(h);

      groups[letter].forEach(p=>{
        const a=document.createElement("a");
        a.href="/"+p.slug;
        a.textContent=p.title;
        col.appendChild(a);
      });
    });

    grid.appendChild(col);
  });

});
</script>
`;


// =========================================================
// ================= VIEW ================================
// =========================================================
const VIEW = `
<h1 id="t"></h1>
<div id="c"></div>

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

<script>
const slug = location.pathname.split("/").pop();

fetch("/_get/"+slug)
.then(r=>r.json())
.then(d=>{
  document.getElementById("t").innerText=d.title||slug;

  let html = marked.parse(d.content||"");

  // images
  html = html.replace(
    /(^|\\s)(https?:\\/\\/[^\\s]+\\.(jpg|png|jpeg|webp|gif))/gi,
    '$1<img src="$2">'
  );

  // footnotes
  html = html.replace(
    /\\[(\\d+)\\]/g,
    '<span class="fn">[$1]</span>'
  );

  document.getElementById("c").innerHTML = html;
});
</script>
`;


// =========================================================
// ================= ROUTER ===============================
// =========================================================
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;

    try {

      // ================= INDEX API =================
      if (p === "/_index") {
        let data = await getIndex(env);
        if (!data) data = await list(env);
        return new Response(JSON.stringify(data));
      }

      // ================= GET =================
      if (p.startsWith("/_get/")) {
        const slug = p.split("/").pop();
        const md = await getFile(env, slug);
        return new Response(JSON.stringify(parse(md)), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // ================= SAVE =================
      if (p === "/_save") {
        const body = await req.json();
        await savePage(env, body.slug, body.content);
        return new Response("ok");
      }

      // ================= INDEX PAGE =================
      if (p === "/") {
        return html(
          INDEX,
          meta({
            title: "Indexmod",
            content: "Fashion and Art Encyclopedia",
            url: url.href
          }),
          `<a href="/new">New</a>`
        );
      }

      // ================= VIEW PAGE =================
      if (p !== "/" && !p.startsWith("/_")) {
        const slug = p.slice(1);
        const md = await getFile(env, slug);
        const parsed = parse(md);

        return html(
          VIEW,
          meta({
            title: parsed.title || slug,
            content: parsed.content,
            url: url.href
          }),
          `<a href="/edit/${slug}">Edit</a>`
        );
      }

      return new Response("404", { status: 404 });

    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  }
};

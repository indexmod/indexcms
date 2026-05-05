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

/* ===== TOPBAR ===== */

.topbar {
  position: relative;

  display: flex;
  justify-content: space-between;

  padding: 0;
  margin: 0 0 40px 0;

  align-items: flex-start;
}

/* ===== LOGO CONTROL ===== */

.logo {
  display: flex;

  margin: 0;
  padding: 0;

  align-self: flex-start;
}

/* картинка логотипа */
.logo img {
  height: 250px;
  width: auto;

  display: block;

  /* убираем любой зазор снизу/сбоку */
  margin: 0;
  padding: 0;

  /* прижимаем к верхнему и левому краю контейнера */
  transform: translate(0, 0);

  transform-origin: center;

  animation: pulse 4s infinite ease-in-out;
}

/* дыхание */
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
   display: block;
   width: fit-content;
   margin-left: auto;
   margin-top: 80px;

   padding: 12px 16px;

   background: #a855f7;
   border: 1px dotted rgba(255, 255, 255, 0.55);
   border-radius: 40px;

   font-family: monospace;
 }

 /* ссылка */
 .footer-link {
   display: inline-flex;
   align-items: center;
   gap: 10px;

   text-decoration: none !important;
   color: #ffffff !important;

   font-size: 9px;
   font-family: monospace;
 }

 /* override любых глобальных ссылок */
 .footer-link,
 .footer-link:visited,
 .footer-link:hover,
 .footer-link:active {
   color: #ffffff !important;
   text-decoration: none !important;
 }

 /* DOT — инверсия + увеличение + подъём */
 .footer-dot {
   width: 10px;          /* было 8px → чуть крупнее */
   height: 10px;

   border-radius: 50%;
   background: #ffffff;  /* инверсия */

   display: inline-block;

   transform: translateY(-10px); /* приподняли на полстроки */
 }

 /* текст */
 .footer-text {
   font-weight: 100;
   color: #ffffff;
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
    <span class="footer-text">XX лет</span>
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
const file = (slug) => slug + ".md";

// =========================================================
// ================= PARSER ================================
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
async function getFile(env, slug) {
  const obj = await env.PAGES.get(file(slug));
  return obj ? await obj.text() : null;
}

async function putFile(env, slug, content) {
  await env.PAGES.put(file(slug), content);
}

async function savePage(env, slug, content) {
  await putFile(env, slug, content);
}

// =========================================================
// ================= LIST ================================
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
// ================= INDEX ================================
const INDEX = `
<h1></h1>

<div id="list">
  <div id="preload">Loading topics Indexmod Fashion and Art</div>
</div>

<script>
fetch("/_list")
.then(r => r.json())
.then(items => {
  const container = document.getElementById("list");

  if (!items.length) {
    container.innerHTML = "no pages yet";
    return;
  }

  // группировка по первой букве
  const groups = {};
  items.forEach(p => {
    const letter = (p.title[0] || "#").toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(p);
  });

  const letters = Object.keys(groups).sort();

  // делим на 3 колонки
  const cols = [[], [], []];
  letters.forEach((l, i) => {
    cols[i % 3].push(l);
  });

  container.innerHTML = '<div class="grid"></div>';
  const grid = container.firstChild;

  cols.forEach(colLetters => {
    const col = document.createElement("div");
    col.className = "col";

    colLetters.forEach(letter => {
      const h = document.createElement("div");
      h.className = "letter";
      h.textContent = letter;

      col.appendChild(h);

      groups[letter].forEach(p => {
        const a = document.createElement("a");
        a.href = "/" + p.slug;
        a.textContent = p.title;
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
const VIEW = `
<h1 id="t"></h1>
<div id="c"></div>

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

<script>
const slug = location.pathname.split("/").filter(Boolean).pop();

fetch("/_get/" + slug)
.then(r => r.json())
.then(d => {
  document.getElementById("t").innerText = d.title || slug;

  const container = document.getElementById("c");

  // ===============================
  // MARKDOWN → HTML
  // ===============================
  let html = marked.parse(d.content || "");

  // ===============================
  // AUTO IMAGE LINKS
  // ===============================
  html = html.replace(
    /(^|\\s)(https?:\\/\\/[^\\s]+?\\.(jpg|jpeg|png|gif|webp|svg))(\\s|$)/gi,
    '$1<img src="$2" style="max-width:100%;display:block;margin:20px 0;">$4'
  );

  // ===============================
  // FOOTNOTES [1]
  // ===============================
  html = html.replace(
    /\\[(\\d+)\\]/g,
    '<span class="fn">[$1]</span>'
  );

  // ===============================
  // RENDER
  // ===============================
  container.innerHTML = html;
});
</script>
`;
// =========================================================
// ================= EDITOR ================================
const EDITOR = `
<textarea id="md"></textarea>

<script>
const slug = location.pathname.split("/").filter(Boolean).pop();

const tpl = (title, slug) => \`---
title: \${title}
slug: \${slug}
---

Write here...

https://images.unsplash.com/photo-1520975916090-3105956dac38


## Basic markup

**bold text**

*italic text*

- list item 1
- list item 2

## Footnote example

Text with reference [1]

\`;

async function load() {
  if (location.pathname === "/new") {
    document.getElementById("md").value = tpl("New page", "new-page");
    return;
  }

  const r = await fetch("/_get/" + slug);
  const d = await r.json();

  document.getElementById("md").value =
\`---
title: \${d.title || slug}
slug: \${slug}
---

\${d.content || ""}\`;
}

async function save() {
  const md = document.getElementById("md").value;

  const slug =
    (md.match(/slug:\\s*(.*)/)?.[1] || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-") || "untitled";

  await fetch("/_save", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ slug, content: md })
  });

  location.href = "/" + slug;
}

load();
</script>
`;

// =========================================================
// ================= ROUTER ================================
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;

    try {

      if (p === "/logo.svg") return new Response(await (await env.PAGES.get("logo.svg")).arrayBuffer(), { headers: { "Content-Type": "image/svg+xml" }});
      if (p === "/favicon.svg") return new Response(await (await env.PAGES.get("favicon.svg")).arrayBuffer(), { headers: { "Content-Type": "image/svg+xml" }});

      if (p === "/_list") {
        return new Response(JSON.stringify(await list(env)), {
          headers: { "Content-Type": "application/json" }
        });
      }

      if (p.startsWith("/_get/")) {
        const slug = p.split("/").pop();
        const md = await getFile(env, slug);

        if (!md) {
          return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
        }

        return new Response(JSON.stringify(parse(md)), {
          headers: { "Content-Type": "application/json" }
        });
      }

      if (p === "/_save") {
        const body = await req.json();
        await savePage(env, body.slug, body.content);
        return new Response("ok");
      }

      if (p === "/") return html(INDEX, `<a href="/new">New</a>`);
      if (p === "/new") return html(EDITOR, `<button onclick="save()">Save</button>`);
      if (p.startsWith("/edit/")) return html(EDITOR, `<button onclick="save()">Save</button>`);
      if (p.startsWith("/") && !p.startsWith("/_")) {
        return html(VIEW, `<a href="/edit/${p.slice(1)}">Edit</a>`);
      }

      return new Response("404", { status: 404 });

    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  }
};

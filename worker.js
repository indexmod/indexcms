// =========================================================
// ================= CONFIG ================================
// =========================================================
const file = (slug) => slug + ".md";
const INDEX_FILE = "index.json";


// =========================================================
// ================= STATIC FILES ==========================
// =========================================================
async function getAsset(env, path, type) {
  const obj = await env.PAGES.get(path);
  if (!obj) return null;

  return new Response(await obj.arrayBuffer(), {
    headers: { "Content-Type": type }
  });
}


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
// ================= INDEX CACHE ===========================
// =========================================================
async function getIndex(env) {
  const obj = await env.PAGES.get(INDEX_FILE);
  return obj ? JSON.parse(await obj.text()) : null;
}

async function saveIndex(env, pages) {
  await env.PAGES.put(INDEX_FILE, JSON.stringify(pages));
}


// =========================================================
// ================= SAVE ================================
// =========================================================
async function savePage(env, slug, content) {
  await putFile(env, slug, content);

  const parsed = parse(content);

  let index = await getIndex(env) || [];

  const existing = index.find(p => p.slug === slug);

  if (existing) {
    existing.title = parsed.title || slug;
  } else {
    index.push({ slug, title: parsed.title || slug });
  }

  index.sort((a, b) => a.title.localeCompare(b.title));

  await saveIndex(env, index);
}


// =========================================================
// ================= META ================================
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
function html(c, css, metaBlock = "", rightUI = "") {
  return new Response(`
<!doctype html>
<html>
<head>
<meta charset="utf-8">
${metaBlock}

<link rel="icon" href="/favicon.svg">
<meta name="viewport" content="width=device-width, initial-scale=1">

<link rel="stylesheet" href="/base.css">
<link rel="stylesheet" href="/${css}.css">

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
// ================= VIEWS ================================
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

  html = html.replace(
    /(^|\\s)(https?:\\/\\/[^\\s]+\\.(jpg|png|jpeg|webp|gif))/gi,
    '$1<img src="$2">'
  );

  html = html.replace(
    /\\[(\\d+)\\]/g,
    '<span class="fn">[$1]</span>'
  );

  document.getElementById("c").innerHTML = html;
});
</script>
`;


const EDITOR = `
<textarea id="md"></textarea>
<button onclick="save()">Save</button>

<script>
const slug = location.pathname.split("/").pop();

async function load() {
  if (location.pathname === "/new") {
    document.getElementById("md").value = "Write here...";
    return;
  }

  const r = await fetch("/_get/" + slug);
  const d = await r.json();

  document.getElementById("md").value = d.content || "";
}

async function save() {
  const md = document.getElementById("md").value;

  const slug =
    (md.match(/slug:\\s*(.*)/)?.[1] || "untitled")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");

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
// ================= ROUTER ===============================
// =========================================================
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;

    try {

      // ===== STATIC FILES =====
      if (p === "/base.css") return getAsset(env, "base.css", "text/css");
      if (p === "/index.css") return getAsset(env, "index.css", "text/css");
      if (p === "/view.css") return getAsset(env, "view.css", "text/css");
      if (p === "/editor.css") return getAsset(env, "editor.css", "text/css");

      if (p === "/logo.svg") return getAsset(env, "logo.svg", "image/svg+xml");
      if (p === "/favicon.svg") return getAsset(env, "favicon.svg", "image/svg+xml");

      // ===== API =====
      if (p === "/_index") {
        let data = await getIndex(env);
        if (!data) data = await list(env);
        return new Response(JSON.stringify(data));
      }

      if (p.startsWith("/_get/")) {
        const slug = p.split("/").pop();
        return new Response(JSON.stringify(parse(await getFile(env, slug))));
      }

      if (p === "/_save") {
        const body = await req.json();
        await savePage(env, body.slug, body.content);
        return new Response("ok");
      }

      // ===== PAGES =====
      if (p === "/") {
        return html(INDEX, "index", meta({
          title: "Indexmod",
          content: "Fashion and Art Encyclopedia",
          url: url.href
        }), `<a href="/new">New</a>`);
      }

      if (p === "/new") {
        return html(EDITOR, "editor", "", "");
      }

      if (p.startsWith("/edit/")) {
        return html(EDITOR, "editor", "", "");
      }

      if (!p.startsWith("/_")) {
        const slug = p.slice(1);
        const md = await getFile(env, slug);
        const parsed = parse(md);

        return html(VIEW, "view", meta({
          title: parsed.title,
          content: parsed.content,
          url: url.href
        }), `<a href="/edit/${slug}">Edit</a>`);
      }

      return new Response("404", { status: 404 });

    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  }
};

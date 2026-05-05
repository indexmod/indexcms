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

// =========================================================
// ================= CSS ENGINE ============================
// =========================================================
function baseCSS() {
  return `
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }

body {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 22px;
  line-height: 1.75;
  color: #000;
  background: #fff;

  max-width: 720px;
  margin: 0 auto;
  padding: 100px 24px 80px;
}

.topbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 20px;
}

.logo img { height: 28px; }
.nav { display: flex; gap: 16px; }

h1 { font-size: 42px; margin: 0 0 32px; font-weight: normal; }
h2 { font-size: 30px; margin: 48px 0 16px; font-weight: normal; }

p { margin: 16px 0; }
ul { padding-left: 24px; }

a { color: #1a73e8; text-decoration: none; }
a:hover { text-decoration: underline; }

button {
  all: unset;
  cursor: pointer;
  color: #1a73e8;
}

textarea {
  width: 100%;
  height: 80vh;
  border: none;
  outline: none;
  resize: none;
  font-family: monospace;
  font-size: 16px;
}

pre { white-space: pre-wrap; }
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
</head>

<body>

<div class="topbar">
  <a href="/" class="logo">
    <img src="/logo.svg">
  </a>
  <div class="nav">${rightUI}</div>
</div>

${c}

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
// ================= R2 HELPERS ============================
// =========================================================
async function getFile(env, slug) {
  const obj = await env.PAGES.get(file(slug));
  return obj ? await obj.text() : null;
}

async function putFile(env, slug, content) {
  await env.PAGES.put(file(slug), content);
}

// =========================================================
// ================= SAVE ================================
// =========================================================
async function savePage(env, slug, content) {
  await putFile(env, slug, content);
}

// =========================================================
// ================= LIST (NO INDEX.JSON) =================
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

  // сортировка по алфавиту
  pages.sort((a, b) => a.title.localeCompare(b.title));

  return pages;
}

// =========================================================
// ================= ASSETS ===============================
// =========================================================
async function serveAsset(env, name, type) {
  const obj = await env.PAGES.get(name);
  if (!obj) return new Response("not found", { status: 404 });

  return new Response(await obj.arrayBuffer(), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400"
    }
  });
}

// =========================================================
// ================= INDEX PAGE ============================
// =========================================================
const INDEX = `
<h1>Indexmod Fashion and Art</h1>

<div id="list">loading...</div>

<script>
fetch("/_list")
.then(r => r.json())
.then(items => {
  const el = document.getElementById("list");
  el.innerHTML = "";

  if (!items.length) {
    el.innerHTML = "no pages yet";
    return;
  }

  items.forEach(p => {
    const a = document.createElement("a");
    a.href = "/" + p.slug;
    a.textContent = p.title || p.slug;

    el.appendChild(a);
    el.appendChild(document.createElement("br"));
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
const slug = location.pathname.split("/").filter(Boolean).pop();

fetch("/_get/" + slug)
.then(r => r.json())
.then(d => {
  document.getElementById("t").innerText = d.title || slug;
  document.getElementById("c").innerHTML = marked.parse(d.content || "");
});
</script>
`;

// =========================================================
// ================= EDITOR ================================
// =========================================================
const EDITOR = `
<textarea id="md"></textarea>

<script>
const slug = location.pathname.split("/").filter(Boolean).pop();

const tpl = (title, slug) => \`---
title: \${title}
slug: \${slug}
---

Write here...
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
// =========================================================
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;

    try {

      if (p === "/logo.svg") return serveAsset(env, "logo.svg", "image/svg+xml");
      if (p === "/favicon.svg") return serveAsset(env, "favicon.svg", "image/svg+xml");

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

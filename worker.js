// =========================================================
// ================= CSS ENGINE ============================
// =========================================================
function baseCSS() {
  return `
/* ================= RESET ================= */

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
}

/* ================= LAYOUT ================= */

body {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 22px;
  line-height: 1.75;
  color: #000;
  background: #fff;

  max-width: 720px;
  margin: 0 auto;
  padding: 80px 24px;
}

/* ================= TYPOGRAPHY ================= */

h1 {
  font-size: 42px;
  font-weight: normal;
  margin: 0 0 32px;
}

h2 {
  font-size: 30px;
  font-weight: normal;
  margin: 48px 0 16px;
}

h3 {
  font-size: 24px;
  font-weight: normal;
  margin: 32px 0 12px;
}

p {
  margin: 16px 0;
}

ul {
  padding-left: 24px;
  margin: 16px 0;
}

li {
  margin: 6px 0;
}

/* ================= LINKS ================= */

a {
  color: #1a73e8;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* ================= UI (минимально) ================= */

button {
  all: unset;
  cursor: pointer;
  color: #1a73e8;
}

button:hover {
  text-decoration: underline;
}

/* ================= EDITOR ================= */

textarea {
  width: 100%;
  height: 80vh;

  border: none;
  outline: none;
  resize: none;

  font-family: monospace;
  font-size: 16px;
  line-height: 1.6;
}

/* ================= MARKDOWN ================= */

pre {
  white-space: pre-wrap;
}

code {
  font-family: monospace;
  font-size: 0.95em;
}
`;
}

// =========================================================
// ================= HTML WRAPPER ==========================
// =========================================================
function html(c) {
  return new Response(`
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${baseCSS()}</style>
</head>
<body>
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
const INDEX_KEY = "index.json";

// =========================================================
// ================= INDEX STORAGE =========================
// =========================================================
async function getIndex(env) {
  const obj = await env.PAGES.get(INDEX_KEY);
  return obj ? JSON.parse(await obj.text()) : [];
}

async function saveIndex(env, index) {
  await env.PAGES.put(INDEX_KEY, JSON.stringify(index || [], null, 2));
}

// =========================================================
// ================= FRONTMATTER PARSER ===================
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
// ================= SAVE PAGE =============================
// =========================================================
async function savePage(env, slug, content) {
  await putFile(env, slug, content);

  const parsed = parse(content);
  const title = parsed.title || slug;

  let index = await getIndex(env);

  const existing = index.find(i => i.slug === slug);

  if (existing) {
    existing.title = title;
  } else {
    index.push({ slug, title });
  }

  await saveIndex(env, index);
}

// =========================================================
// ================= API LIST ==============================
// =========================================================
async function list(env) {
  const index = await getIndex(env);
  return Array.isArray(index) ? index : [];
}

// =========================================================
// ================= INDEX PAGE ============================
// =========================================================
const INDEX = `
<h1>Indexmmod Fashion and Art</h1>
<a href="/new">+ New</a>

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
})
.catch(() => {
  document.getElementById("list").innerHTML = "error loading index";
});
</script>
`;

// =========================================================
// ================= VIEW PAGE =============================
// =========================================================
const VIEW = `
<button id="edit">Edit</button>

<h1 id="t"></h1>
<div id="c"></div>

<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

<script>
const slug = location.pathname.split("/").filter(Boolean).pop();

fetch("/_get/" + slug)
.then(r => r.json())
.then(d => {
  document.getElementById("t").innerText = d.title || slug;

  // 🔥 ВОТ ГЛАВНОЕ
  document.getElementById("c").innerHTML =
    marked.parse(d.content || "");

  document.getElementById("edit").onclick = () =>
    location.href = "/edit/" + slug;
});
</script>
`;

// =========================================================
// ================= EDITOR ================================
// =========================================================
const EDITOR = `
<button onclick="save()">Save</button>

<textarea id="md" style="width:100%;height:90vh;"></textarea>

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
    document.getElementById("md").value =
      tpl("New page", "new-page");
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
      .replace(/[^a-z0-9-]/g, "-")
      || "untitled";

  await fetch("/_save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

      // ---------------- API ----------------
      if (p === "/_list") {
        return new Response(JSON.stringify(await list(env)), {
          headers: { "Content-Type": "application/json" }
        });
      }

      if (p.startsWith("/_get/")) {
        const slug = p.split("/").pop();
        const md = await getFile(env, slug);

        if (!md) {
          return new Response(JSON.stringify({ error: "not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" }
          });
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

      // ---------------- UI ----------------
      if (p === "/") return html(INDEX);
      if (p === "/new") return html(EDITOR);
      if (p.startsWith("/edit/")) return html(EDITOR);
      if (p.startsWith("/") && !p.startsWith("/_")) return html(VIEW);

      return new Response("404", { status: 404 });

    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  }
};

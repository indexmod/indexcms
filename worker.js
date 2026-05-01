
// ================= SAFE JSON =================
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// ================= HTML RESPONSE =================
function htmlPage(html) {
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// ================= PARSER =================
function parseMD(raw = "") {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { title: "", slug: "", content: raw };
  }

  const fm = match[1];
  const content = match[2];

  const data = {};

  fm.split("\n").forEach(line => {
    const idx = line.indexOf(":");
    if (idx === -1) return;

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();

    data[key] = value;
  });

  return {
    title: data.title || "",
    slug: data.slug || "",
    content
  };
}

// ================= SAVE =================
async function savePage(req, env) {
  const data = await req.json();

  if (!data.slug) return json({ error: "no slug" }, 400);

  const md = `---
id: ${crypto.randomUUID()}
title: ${data.title || ""}
slug: ${data.slug}
---

${data.content || ""}
`;

  await env.PAGES.put(`${data.slug}.md`, md);

  return json({ ok: true });
}

// ================= GET PAGE =================
async function getPage(env, slug) {
  const raw = await env.PAGES.get(`${slug}.md`);

  if (!raw) return json({ error: "not found" }, 404);

  const text = await raw.text();
  const parsed = parseMD(text);

  return json(parsed);
}

// ================= LIST =================
async function listPages(env) {
  const list = await env.PAGES.list();

  const pages = [];

  for (const k of list.keys) {
    const obj = await env.PAGES.get(k.name);

    if (!obj) continue;

    const text = await obj.text();
    const p = parseMD(text);

    if (p.slug) {
      pages.push({
        title: p.title,
        slug: p.slug
      });
    }
  }

  return json(pages);
}

// ================= HTML UI =================
const INDEX_HTML = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>IndexCMS</title>
</head>
<body>

<h1>Pages</h1>
<button onclick="location.href='/editor'">+ New Page</button>

<div id="list">loading...</div>

<script>
fetch('/api/pages')
.then(r => r.json())
.then(pages => {
  const el = document.getElementById('list');
  el.innerHTML = "";

  pages.forEach(p => {
    const a = document.createElement('a');
    a.href = '/page/' + p.slug;
    a.textContent = p.title || p.slug;
    el.appendChild(a);
    el.appendChild(document.createElement('br'));
  });
});
</script>

</body>
</html>
`;

const PAGE_HTML = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Page</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>

<a href="/">← back</a>
<h1 id="title"></h1>
<div id="content"></div>

<script>
const slug = location.pathname.split("/").pop();

fetch('/api/page/' + slug)
.then(r => r.json())
.then(data => {
  document.getElementById('title').textContent = data.title;
  document.getElementById('content').innerHTML =
    marked.parse(data.content || "");
});
</script>

</body>
</html>
`;

const EDITOR_HTML = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Editor</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>

<input id="title" placeholder="title"><br>
<input id="slug" placeholder="slug"><br>

<textarea id="md" style="width:100%;height:300px;"></textarea>

<br>
<button onclick="save()">Save</button>

<h3>Preview</h3>
<div id="preview"></div>

<script>
const md = document.getElementById('md');

md.addEventListener('input', () => {
  document.getElementById('preview').innerHTML =
    marked.parse(md.value);
});

function save() {
  fetch('/api/save', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      title: document.getElementById('title').value,
      slug: document.getElementById('slug').value,
      content: md.value
    })
  }).then(() => {
    location.href = '/';
  });
}
</script>

</body>
</html>
`;

// ================= ROUTER =================
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;

    try {

      // ===== API =====
      if (path === "/api/save") return savePage(req, env);

      if (path.startsWith("/api/page/")) {
        const slug = decodeURIComponent(path.split("/").pop());
        return getPage(env, slug);
      }

      if (path === "/api/pages") return listPages(env);

      // ===== UI =====
      if (path === "/") return htmlPage(INDEX_HTML);
      if (path === "/editor") return htmlPage(EDITOR_HTML);
      if (path.startsWith("/page/")) return htmlPage(PAGE_HTML);

      return new Response("Not found", { status: 404 });

    } catch (e) {
      return json({
        error: "worker crash",
        message: e.message
      }, 500);
    }
  }
};

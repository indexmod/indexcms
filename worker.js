// ================= PARSER =================
function parseMD(raw = "") {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { title: "", slug: "", content: raw };
  }

  const frontmatter = match[1];
  const content = match[2];

  const data = {};

  frontmatter.split("\n").forEach(line => {
    const [key, ...rest] = line.split(":");
    if (!key) return;
    data[key.trim()] = rest.join(":").trim();
  });

  return {
    title: data.title || "",
    slug: data.slug || "",
    content
  };
}

// ================= UTILS =================
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// ================= SAVE =================
async function savePage(req, env) {
  const data = await req.json();

  if (!data.slug) {
    return json({ error: "slug required" }, 400);
  }

  const id = crypto.randomUUID();

  const md = `---
id: ${id}
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

  if (!raw) {
    return json({ error: "not found" }, 404);
  }

  const parsed = parseMD(await raw.text());

  return json(parsed);
}

// ================= LIST =================
async function listPages(env) {
  const list = await env.PAGES.list();

  const pages = [];

  for (const k of list.keys) {
    const raw = await env.PAGES.get(k.name);
    if (!raw) continue;

    const p = parseMD(await raw.text());

    pages.push({
      title: p.title,
      slug: p.slug
    });
  }

  return json(pages);
}

// ================= STATIC =================
function serveHTML(html) {
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// ================= HTML =================
const INDEX_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>IndexMod</title>
</head>
<body>
<h1>IndexMod</h1>
<div id="list"></div>
<button onclick="location.href='/editor'">New Page</button>

<script>
fetch('/api/pages')
.then(r => r.json())
.then(pages => {
  const el = document.getElementById('list');
  pages.forEach(p => {
    const a = document.createElement('a');
    a.href = '/page/' + p.slug;
    a.innerText = p.title || p.slug;
    el.appendChild(a);
    el.appendChild(document.createElement('br'));
  });
});
</script>
</body>
</html>`;

// ================= PAGE =================
const PAGE_HTML = `<!doctype html>
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
  document.getElementById('title').innerText = data.title;
  document.getElementById('content').innerHTML = marked.parse(data.content);
});
</script>
</body>
</html>`;

// ================= EDITOR =================
const EDITOR_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Editor</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>
textarea { width: 100%; height: 200px; }
#preview { border-top:1px solid #ccc; padding-top:10px; }
</style>
</head>
<body>

<input id="title" placeholder="title"><br>
<input id="slug" placeholder="slug"><br>
<textarea id="content"></textarea><br>

<button onclick="save()">Save</button>

<h3>Preview</h3>
<div id="preview"></div>

<script>
const content = document.getElementById('content');

content.addEventListener('input', () => {
  document.getElementById('preview').innerHTML =
    marked.parse(content.value);
});

function save() {
  fetch('/api/save', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      title: document.getElementById('title').value,
      slug: document.getElementById('slug').value,
      content: content.value
    })
  }).then(() => {
    alert('saved');
    location.href = '/page/' + document.getElementById('slug').value;
  });
}
</script>

</body>
</html>`;

// ================= ROUTER =================
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;

    // API
    if (path === "/api/save") return savePage(req, env);
    if (path.startsWith("/api/page/")) {
      const slug = path.split("/").pop();
      return getPage(env, slug);
    }
    if (path === "/api/pages") return listPages(env);

    // PAGES
    if (path === "/") return serveHTML(INDEX_HTML);
    if (path === "/editor") return serveHTML(EDITOR_HTML);
    if (path.startsWith("/page/")) return serveHTML(PAGE_HTML);

    return new Response("Not found", { status: 404 });
  }
};

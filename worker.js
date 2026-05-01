
// ================= JSON =================
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// ================= HTML =================
function html(content) {
  return new Response(content, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// ================= SAVE =================
async function save(req, env) {
  const data = await req.json();

  if (!data.name) {
    return json({ error: "no name" }, 400);
  }

  await env.PAGES.put(data.name, data.content || "");

  return json({ ok: true });
}

// ================= GET FILE =================
async function getFile(env, name) {
  const file = await env.PAGES.get(name);
  if (!file) return "";

  return await file.text();
}

// ================= LIST =================
async function list(env) {
  const res = await env.PAGES.list();

  const files = res.keys
    .map(k => k.name)
    .filter(n => n.endsWith(".md") || n.endsWith(".txt"))
    .sort();

  return json(files);
}

const INDEX = `
<!doctype html>
<html>
<body>

<h1>Pages</h1>

<button onclick="location.href='/file/new.md'">+ New</button>

<div id="list">loading...</div>

<script>
fetch('/api/list')
.then(r => r.json())
.then(files => {
  const el = document.getElementById('list');
  el.innerHTML = '';

  files.forEach(f => {
    const a = document.createElement('a');
    a.href = '/view/' + encodeURIComponent(f);
    a.textContent = f;
    el.appendChild(a);
    el.appendChild(document.createElement('br'));
  });
});
</script>

</body>
</html>
`;

// ================= EDITOR =================
const EDITOR = `
<!doctype html>
<html>
<body>

<button onclick="save()">Save</button>
<button onclick="view()">View</button>

<textarea id="md" style="width:100%;height:90vh;"></textarea>

<script>
const name = decodeURIComponent(location.pathname.split('/').pop());

function template() {
  return \`---
id: 123456789
title: Edit title here
permalink: Edit permalink here
---

Paste markdown here
\`;
}

async function load() {
  const res = await fetch('/api/file/' + encodeURIComponent(name));
  const text = await res.text();

  document.getElementById('md').value = text || template();
}

function save() {
  fetch('/api/save', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      name,
      content: document.getElementById('md').value
    })
  }).then(() => {
    location.href = '/view/' + encodeURIComponent(name);
  });
}

function view() {
  location.href = '/view/' + encodeURIComponent(name);
}

load();
</script>

</body>
</html>
`;

// ================= VIEW =================
const VIEW = `
<!doctype html>
<html>
<head>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>

<a href="/">back</a>
<button id="edit">edit</button>

<div id="out"></div>

<script>
const name = decodeURIComponent(location.pathname.split('/').pop());

fetch('/api/file/' + encodeURIComponent(name))
.then(r => r.text())
.then(md => {
  document.getElementById('out').innerHTML = marked.parse(md);

  document.getElementById('edit').onclick = () => {
    location.href = '/file/' + encodeURIComponent(name);
  };
});
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

      // API
      if (path === "/api/save") return save(req, env);
      if (path === "/api/list") return list(env);

      if (path.startsWith("/api/file/")) {
        const name = decodeURIComponent(path.split("/").pop());
        const text = await getFile(env, name);
        return new Response(text);
      }

      // UI
      if (path === "/") return html(INDEX);

      // EDITOR
      if (path.startsWith("/file/")) return html(EDITOR);

      // VIEW
      if (path.startsWith("/view/")) return html(VIEW);

      return new Response("404", { status: 404 });

    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function html(content) {
  return new Response(content, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// ================= LIST FILES =================
async function list(env) {
  const res = await env.PAGES.list();
  const files = res.keys.map(k => k.name).filter(n => n.endsWith(".md"));
  files.sort();
  return json(files);
}

// ================= GET FILE =================
async function get(env, name) {
  const file = await env.PAGES.get(name);
  if (!file) return json({ error: "not found" }, 404);
  return json({ name, content: await file.text() });
}

// ================= SAVE FILE =================
async function save(req, env) {
  const data = await req.json();
  if (!data.name) return json({ error: "no name" }, 400);

  await env.PAGES.put(data.name, data.content || "");
  return json({ ok: true });
}

// ================= INDEX =================
const INDEX = `
<!doctype html>
<html>
<body>

<h1>Files</h1>
<button onclick="newFile()">+ New</button>

<div id="list">loading...</div>

<script>
function load() {
  fetch('/api/list')
    .then(r => r.json())
    .then(files => {
      const el = document.getElementById('list');
      el.innerHTML = '';

      files.forEach(f => {
        const a = document.createElement('a');
        a.href = '/file/' + f;
        a.textContent = f;
        el.appendChild(a);
        el.appendChild(document.createElement('br'));
      });
    });
}

function newFile() {
  const name = prompt("filename", "page.md");
  if (!name) return;
  location.href = '/file/' + name;
}

load();
</script>

</body>
</html>
`;

// ================= EDITOR =================
const EDITOR = `
<!doctype html>
<html>
<body>

<a href="/">back</a>
<button onclick="save()">save</button>

<h3 id="name"></h3>
<textarea id="t" style="width:100%;height:80vh;"></textarea>

<script>
const name = location.pathname.split('/').pop();

document.getElementById('name').textContent = name;

function load() {
  fetch('/api/file/' + name)
    .then(r => r.json())
    .then(d => {
      document.getElementById('t').value = d.content || '';
    });
}

function save() {
  fetch('/api/save', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      name,
      content: document.getElementById('t').value
    })
  }).then(() => alert('saved'));
}

load();
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

      if (path === "/api/list") return list(env);

      if (path.startsWith("/api/file/")) {
        const name = decodeURIComponent(path.split("/").pop());
        return get(env, name);
      }

      if (path === "/api/save") return save(req, env);

      if (path === "/") return html(INDEX);

      if (path.startsWith("/file/")) return html(EDITOR);

      return new Response("404", { status: 404 });

    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
};

// ================= UTILS =================
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

// ================= PARSE =================
function parse(raw = "") {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { title: "", permalink: "", content: raw };
  }

  const fm = match[1];
  const content = match[2];

  const data = {};

  fm.split("\n").forEach(line => {
    const i = line.indexOf(":");
    if (i === -1) return;

    const key = line.slice(0, i).trim();
    const val = line.slice(i + 1).trim();

    data[key] = val;
  });

  return {
    title: data.title || "",
    permalink: data.permalink || "",
    content
  };
}

// ================= STORAGE =================
async function getFile(env, name) {
  const f = await env.PAGES.get(name);
  return f ? await f.text() : "";
}

// ================= SAVE =================
async function save(req, env) {
  const data = await req.json();

  let name = data.name;
  let content = data.content;

  if (!name) return json({ error: "no name" }, 400);

  // если новый файл → генерим uuid
  if (name === "__new__") {
    name = crypto.randomUUID() + ".md";
  }

  await env.PAGES.put(name, content);

  return json({ ok: true, name });
}

// ================= FIND BY PERMALINK =================
async function findByPermalink(env, permalink) {
  const list = await env.PAGES.list();

  for (const k of list.keys) {
    if (!k.name.endsWith(".md")) continue;
    if (k.name === "template.md") continue;

    const raw = await getFile(env, k.name);
    const p = parse(raw);

    if (p.permalink === permalink) {
      return { file: k.name, ...p };
    }
  }

  return null;
}

// ================= LIST =================
async function list(env) {
  const res = await env.PAGES.list();

  const pages = [];

  for (const k of res.keys) {
    if (!k.name.endsWith(".md")) continue;
    if (k.name === "template.md") continue;

    const raw = await getFile(env, k.name);
    const p = parse(raw);

    pages.push({
      title: p.title || k.name,
      permalink: p.permalink || ""
    });
  }

  pages.sort((a, b) => a.title.localeCompare(b.title));

  return json(pages);
}

// ================= INDEX =================
const INDEX = `
<!doctype html>
<html>
<body>

<h1>Pages</h1>
<button onclick="location.href='/file/__new__'">+ New</button>

<div id="list">loading...</div>

<script>
fetch('/api/list')
.then(r => r.json())
.then(pages => {
  const el = document.getElementById('list');
  el.innerHTML = '';

  pages.forEach(p => {
    if (!p.permalink) return;

    const a = document.createElement('a');
    a.href = '/' + p.permalink;
    a.textContent = p.title;
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

<textarea id="md" style="width:100%;height:90vh;"></textarea>

<script>
let name = location.pathname.split('/').pop();

// ===== LOAD =====
async function load() {

  // новый файл → загружаем template.md
  if (name === "__new__") {
    const res = await fetch('/api/file/template.md');
    const tpl = await res.text();
    document.getElementById('md').value = tpl;
    return;
  }

  const res = await fetch('/api/file/' + encodeURIComponent(name));
  const text = await res.text();

  document.getElementById('md').value = text;
}

// ===== SAVE =====
function save() {
  let md = document.getElementById('md').value;

  let permalink = (md.match(/permalink:\\s*(.*)/)?.[1] || "").trim();

  // если нет permalink → генерим
  if (!permalink) {
    const title = (md.match(/title:\\s*(.*)/)?.[1] || "").trim();

    permalink = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    md = md.replace(/permalink:\\s*(.*)/, "permalink: " + permalink);
  }

  fetch('/api/save', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      name,
      content: md
    })
  })
  .then(() => {
    location.href = '/' + permalink;
  });
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

<h1 id="title"></h1>
<div id="out"></div>

<script>
const permalink = location.pathname.slice(1);

fetch('/api/find/' + encodeURIComponent(permalink))
.then(r => r.json())
.then(d => {

  document.getElementById('title').textContent = d.title;
  document.getElementById('out').innerHTML = marked.parse(d.content);

  document.getElementById('edit').onclick = () => {
    location.href = '/file/' + d.file;
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
        return new Response(await getFile(env, name));
      }

      if (path.startsWith("/api/find/")) {
        const permalink = decodeURIComponent(path.split("/").pop());
        const page = await findByPermalink(env, permalink);

        if (!page) return json({ error: "not found" }, 404);

        return json(page);
      }

      // UI
      if (path === "/") return html(INDEX);
      if (path.startsWith("/file/")) return html(EDITOR);

      // permalink route
      return html(VIEW);

    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
};

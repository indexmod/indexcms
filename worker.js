
// ================= JSON =================
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// ================= HTML =================
function html(html) {
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
    const i = line.indexOf(":");
    if (i === -1) return;

    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();

    data[key] = value;
  });

  return {
    title: data.title || "",
    slug: data.slug || "",
    id: data.id || "",
    content
  };
}

// ================= SAVE =================
async function savePage(req, env) {
  const data = await req.json();

  if (!data.slug) return json({ error: "no slug" }, 400);

  const md = `---
id: ${data.id || crypto.randomUUID()}
title: ${data.title || ""}
slug: ${data.slug || ""}
---

${data.content || ""}
`;

  await env.PAGES.put(`${data.slug}.md`, md);

  return json({ ok: true });
}

// ================= GET =================
async function getPage(env, slug) {
  const raw = await env.PAGES.get(`${slug}.md`);

  if (!raw) return json({ error: "not found" }, 404);

  const text = await raw.text();
  return json(parseMD(text));
}

// ================= LIST =================
async function listPages(env) {
  const list = await env.PAGES.list();

  const pages = [];

  for (const k of list.keys) {
    if (!k.name.endsWith(".md")) continue;

    const obj = await env.PAGES.get(k.name);
    if (!obj) continue;

    const text = await obj.text();
    const p = parseMD(text);

    pages.push({
      title: p.title || k.name,
      slug: p.slug || k.name.replace(".md", "")
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
<button onclick="location.href='/editor'">+ New</button>

<div id="list">loading...</div>

<script>
fetch('/api/pages')
.then(r => r.json())
.then(p => {
  const el = document.getElementById('list');
  el.innerHTML = '';

  p.forEach(x => {
    const a = document.createElement('a');
    a.href = '/page/' + x.slug;
    a.textContent = x.title;
    el.appendChild(a);
    el.appendChild(document.createElement('br'));
  });
});
</script>

</body>
</html>
`;

// ================= PAGE =================
const PAGE = `
<!doctype html>
<html>
<body>

<a href="/">back</a>
<button id="edit">edit</button>

<h1 id="title"></h1>
<pre id="content"></pre>

<script>
const slug = location.pathname.split('/').pop();

fetch('/api/page/' + slug)
.then(r => r.json())
.then(d => {

  document.getElementById('title').textContent = d.title;

  document.getElementById('content').textContent =
`---\nid: ${d.id}\ntitle: ${d.title}\nslug: ${d.slug}\n---\n\n${d.content}`;

  document.getElementById('edit').onclick = () => {
    location.href = '/editor?slug=' + slug;
  };
});
</script>

</body>
</html>
`;

// ================= EDITOR (AUTO TEMPLATE) =================
const EDITOR = `
<!doctype html>
<html>
<body>

<h2>Editor</h2>

<textarea id="md" style="width:100%;height:400px;"></textarea>
<br>
<button onclick="save()">Save</button>

<script>
const md = document.getElementById('md');
const slug = new URLSearchParams(location.search).get('slug');

// ===== NEW PAGE TEMPLATE =====
function newTemplate() {
  const id = crypto.randomUUID();

  return \`---
id: \${id}
title: New page
slug: new-page
---

Write content here...
\`;
}

// ===== LOAD EXISTING =====
if (slug) {
  fetch('/api/page/' + slug)
  .then(r => r.json())
  .then(d => {
    md.value =
\`---
id: \${d.id}
title: \${d.title}
slug: \${d.slug}
---

\${d.content}\`;
  });
} else {
  md.value = newTemplate();
}

// ===== SAVE =====
function save() {
  const id = (md.value.match(/id:\\s*(.*)/)?.[1] || '').trim();
  const title = (md.value.match(/title:\\s*(.*)/)?.[1] || '').trim();
  const slug = (md.value.match(/slug:\\s*(.*)/)?.[1] || '').trim();

  fetch('/api/save', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      id,
      title,
      slug,
      content: md.value
    })
  }).then(() => location.href = '/');
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

      if (path === "/api/save") return savePage(req, env);

      if (path.startsWith("/api/page/")) {
        const slug = decodeURIComponent(path.split("/").pop());
        return getPage(env, slug);
      }

      if (path === "/api/pages") return listPages(env);

      if (path === "/") return html(INDEX);
      if (path === "/editor") return html(EDITOR);
      if (path.startsWith("/page/")) return html(PAGE);

      return new Response("404", { status: 404 });

    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
};

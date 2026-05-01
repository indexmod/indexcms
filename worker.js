// =========================================================
// HTML WRAPPER
// =========================================================
function html(c) {
  return new Response(c, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// =========================================================
// SAFE FRONTMATTER PARSER
// =========================================================
function parse(md = "") {
  const m = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!m) {
    return {
      id: "",
      title: "",
      slug: "",
      content: md
    };
  }

  const fm = {};
  m[1].split("\n").forEach(line => {
    const i = line.indexOf(":");
    if (i === -1) return;
    fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });

  return {
    id: fm.id || "",
    title: fm.title || "",
    slug: fm.slug || "",
    content: m[2] || ""
  };
}

// =========================================================
// STORAGE HELPERS (R2)
// =========================================================
const file = (slug) => `${slug}.md`;

async function get(env, slug) {
  const obj = await env.PAGES.get(file(slug));
  if (!obj) return null;
  return await obj.text();
}

async function put(env, slug, content) {
  await env.PAGES.put(file(slug), content);
}

// =========================================================
// LIST (FIXED — ALWAYS JSON ARRAY)
// =========================================================
async function list(env) {
  const res = await env.PAGES.list();

  const files = (res.keys || [])
    .map(k => k.name)
    .filter(n => n.endsWith(".md"))
    .map(n => n.replace(".md", ""));

  return files;
}

// =========================================================
// INDEX PAGE
// =========================================================
const INDEX = `
<!doctype html>
<html>
<body>

<h1>Topics</h1>
<a href="/new">+ New</a>

<div id="list">loading...</div>

<script>
fetch("/_list")
.then(r => r.json())
.then(files => {
  const el = document.getElementById("list");
  el.innerHTML = "";

  if (!files.length) {
    el.innerHTML = "no pages yet";
    return;
  }

  files.forEach(slug => {
    const a = document.createElement("a");
    a.href = "/" + slug;
    a.textContent = slug;
    el.appendChild(a);
    el.appendChild(document.createElement("br"));
  });
})
.catch(err => {
  document.getElementById("list").innerHTML = "error loading index";
});
</script>

</body>
</html>
`;

// =========================================================
// VIEW PAGE (HTML RENDER)
// =========================================================
const VIEW = `
<a href="/">back</a>
<button id="edit">edit</button>

<h1 id="t"></h1>
<pre id="c"></pre>

<script>
const slug = location.pathname.slice(1);

fetch("/_get/" + slug)
.then(r => r.json())
.then(d => {
  document.getElementById("t").innerText = d.title || slug;
  document.getElementById("c").innerText = d.content || "";

  document.getElementById("edit").onclick = () => {
    location.href = "/edit/" + slug;
  };
});
</script>
`;

// =========================================================
// EDITOR (SAFE SINGLE FLOW)
// =========================================================
const EDITOR = `
<a href="/">back</a>
<button onclick="save()">save</button>

<textarea id="md" style="width:100%;height:90vh;"></textarea>

<script>
const slug = location.pathname.split("/").pop();

function template(id, title, slug) {
  return \`---
id: \${id}
title: \${title}
slug: \${slug}
---

Write here...
\`;
}

async function load() {
  if (location.pathname === "/new") {
    document.getElementById("md").value =
      template(crypto.randomUUID(), "New page", "new-page");
    return;
  }

  const r = await fetch("/_get/" + slug);
  const d = await r.json();

  document.getElementById("md").value =
\`---
id: \${d.id || crypto.randomUUID()}
title: \${d.title || ""}
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
// ROUTER
// =========================================================
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;

    try {

      // ---------------- UI ----------------
      if (p === "/") return html(INDEX);
      if (p === "/new") return html(EDITOR);
      if (p.startsWith("/edit/")) return html(EDITOR);
      if (p.startsWith("/") && !p.startsWith("/_")) return html(VIEW);

      // ---------------- API ----------------
      if (p === "/_list") {
        return new Response(JSON.stringify(await list(env)), {
          headers: { "Content-Type": "application/json" }
        });
      }

      if (p.startsWith("/_get/")) {
        const slug = p.split("/").pop();
        const md = await get(env, slug);

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
        await put(env, body.slug, body.content);
        return new Response("ok");
      }

      return new Response("404", { status: 404 });

    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  }
};

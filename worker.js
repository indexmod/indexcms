// =========================================================
// HTML WRAPPER
// =========================================================
function html(c) {
  return new Response(c, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// =========================================================
// FRONTMATTER PARSER (SAFE)
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
    id: fm.id || "",
    title: fm.title || "",
    slug: fm.slug || "",
    content: m[2]
  };
}

// =========================================================
// R2 HELPERS
// =========================================================
const file = (slug) => slug + ".md";

async function getRaw(env, slug) {
  const obj = await env.PAGES.get(file(slug));
  return obj ? await obj.text() : null;
}

async function put(env, slug, content) {
  await env.PAGES.put(file(slug), content);
}

// =========================================================
// INDEX LIST (100% STABLE)
// =========================================================
async function list(env) {
  const res = await env.PAGES.list();

  const pages = [];

  for (const k of res.keys) {
    if (!k.name.endsWith(".md")) continue;

    const slug = k.name.replace(".md", "");

    let title = slug;

    try {
      const raw = await getRaw(env, slug);
      if (raw) {
        const p = parse(raw);
        if (p.title) title = p.title;
      }
    } catch (e) {
      // never break index
    }

    pages.push({ slug, title });
  }

  return pages;
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
.then(pages => {
  const el = document.getElementById("list");
  el.innerHTML = "";

  if (!pages.length) {
    el.innerHTML = "no pages yet";
    return;
  }

  pages.forEach(p => {
    const a = document.createElement("a");
    a.href = "/" + p.slug;
    a.textContent = p.title;

    el.appendChild(a);
    el.appendChild(document.createElement("br"));
  });
})
.catch(() => {
  document.getElementById("list").innerHTML = "error loading index";
});
</script>

</body>
</html>
`;

// =========================================================
// VIEW
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

  document.getElementById("edit").onclick = () =>
    location.href = "/edit/" + slug;
});
</script>
`;

// =========================================================
// EDITOR
// =========================================================
const EDITOR = `
<a href="/">back</a>
<button onclick="save()">save</button>

<textarea id="md" style="width:100%;height:90vh;"></textarea>

<script>
const slug = location.pathname.split("/").pop();

function tpl() {
  return \`---
id: \${crypto.randomUUID()}
title: New page
slug: new-page
---

Write here...
\`;
}

async function load() {
  if (location.pathname === "/new") {
    document.getElementById("md").value = tpl();
    return;
  }

  const r = await fetch("/_get/" + slug);
  const d = await r.json();

  document.getElementById("md").value =
\`---
id: \${d.id}
title: \${d.title}
slug: \${slug}
---

\${d.content}\`;
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

      // UI
      if (p === "/") return html(INDEX);
      if (p === "/new") return html(EDITOR);
      if (p.startsWith("/edit/")) return html(EDITOR);
      if (p.startsWith("/") && !p.startsWith("/_")) return html(VIEW);

      // API LIST
      if (p === "/_list") {
        return new Response(JSON.stringify(await list(env)), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // API GET
      if (p.startsWith("/_get/")) {
        const slug = p.split("/").pop();
        const md = await getRaw(env, slug);

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

      // SAVE
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

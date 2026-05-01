// =========================================================
// HTML WRAPPER
// =========================================================
function html(c) {
  return new Response(c, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// =========================================================
// R2 FILE NAME
// =========================================================
const file = (slug) => slug + ".md";

// =========================================================
// LOAD PAGE
// =========================================================
async function get(env, slug) {
  const obj = await env.PAGES.get(file(slug));
  return obj ? await obj.text() : null;
}

// =========================================================
// SAVE PAGE + INDEX UPDATE
// =========================================================
async function save(env, slug, content) {
  await env.PAGES.put(file(slug), content);

  let idx = await env.PAGES.get("index.json");
  idx = idx ? await idx.json() : [];

  if (!idx.includes(slug)) {
    idx.push(slug);
  }

  await env.PAGES.put("index.json", JSON.stringify(idx));

  return idx;
}

// =========================================================
// LIST PAGES
// =========================================================
async function list(env) {
  const idx = await env.PAGES.get("index.json");
  return idx ? await idx.json() : [];
}

// =========================================================
// INDEX PAGE
// =========================================================
const INDEX = `
<h1>Topics</h1>
<a href="/new">+ New</a>
<div id="list">loading...</div>

<script>
fetch("/_list")
.then(r => r.json())
.then(list => {
  const el = document.getElementById("list");
  el.innerHTML = "";

  if (!list.length) {
    el.innerHTML = "no pages yet";
    return;
  }

  list.forEach(slug => {
    const a = document.createElement("a");
    a.href = "/" + slug;
    a.textContent = slug;

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
// VIEW PAGE
// =========================================================
const VIEW = `
<a href="/">back</a>
<button id="edit">edit</button>

<h1 id="t"></h1>
<pre id="c"></pre>

<script>
const slug = location.pathname.slice(1);

fetch("/_get/" + slug)
.then(r => r.text())
.then(md => {
  document.getElementById("c").textContent = md;

  const title = (md.match(/title:\\s*(.*)/)?.[1] || slug);
  document.getElementById("t").textContent = title;

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

function tpl(id, title, slug) {
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
      tpl(crypto.randomUUID(), "New page", "new-page");
    return;
  }

  const md = await fetch("/_get/" + slug).then(r => r.text());

  document.getElementById("md").value = md;
}

async function save() {
  const md = document.getElementById("md").value;

  let slug =
    (md.match(/slug:\\s*(.*)/)?.[1] || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");

  if (!slug) slug = "untitled";

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
        const md = await get(env, slug);

        if (!md) {
          return new Response("not found", { status: 404 });
        }

        return new Response(md);
      }

      // API SAVE
      if (p === "/_save") {
        const body = await req.json();
        await save(env, body.slug, body.content);
        return new Response("ok");
      }

      return new Response("404", { status: 404 });

    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  }
};

// =========================================================
// 🔒 INDEXMOD STABLE SNAPSHOT v1
// =========================================================

/* ===== CSS ENGINE ===== */
function baseCSS() {
  return `
/* ===== RESET ===== */
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }

/* ===== BODY ===== */
body {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 22px;
  line-height: 1.75;

  color: #000;
  background: #fff;

  max-width: 1100px;
  margin: 0 auto;

  padding: 140px 40px 100px;
}

/* ===== TOPBAR ===== */
.topbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 40px 0 20px;
  margin-bottom: 40px;
}

/* ===== LOGO ===== */
.logo {
  display: inline-flex;
  align-items: center;
  padding: 30px 0;
}

.logo img {
  height: 150px;
  display: block;
  transform-origin: center;
  animation: pulse 4s infinite ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.04); }
  100% { transform: scale(1); }
}

/* ===== NAV ===== */
.nav { display: flex; gap: 18px; }

/* ===== TYPO ===== */
h1 { font-size: 48px; margin: 0 0 40px; font-weight: normal; }
h2 { font-size: 28px; margin: 40px 0 10px; font-weight: normal; }

p { margin: 16px 0; }
ul { padding-left: 24px; }

a { color: #1a73e8; text-decoration: none; }
a:hover { text-decoration: underline; }

button {
  all: unset;
  cursor: pointer;
  color: #1a73e8;
}

/* ===== EDITOR ===== */
textarea {
  width: 100%;
  height: 80vh;
  border: none;
  outline: none;
  resize: none;

  font-family: monospace;
  font-size: 16px;
}

/* ===== CONTENT ===== */
pre { white-space: pre-wrap; }

/* ===== INDEX GRID ===== */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}

.letter {
  font-size: 32px;
  margin: 20px 0 10px;
}

.col a {
  display: block;
  margin: 6px 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
  .letter { font-size: 28px; }
}

@media (max-width: 640px) {
  .grid { grid-template-columns: 1fr; }
  .letter { font-size: 24px; }
}
`;
}

/* ===== HTML WRAPPER ===== */
function html(c, rightUI = "") {
  return new Response(`
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>${baseCSS()}</style>
</head>

<body>
<div class="topbar">
  <a href="/" class="logo">
    <img src="/logo.svg">
  </a>
  <div class="nav">${rightUI}</div>
</div>

${c}
</body>
</html>
`, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

/* ===== STORAGE ===== */
const file = (slug) => slug + ".md";

/* ===== PARSER ===== */
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

/* ===== R2 ===== */
async function getFile(env, slug) {
  const obj = await env.PAGES.get(file(slug));
  return obj ? await obj.text() : null;
}

async function putFile(env, slug, content) {
  await env.PAGES.put(file(slug), content);
}

async function savePage(env, slug, content) {
  await putFile(env, slug, content);
}

/* ===== LIST ===== */
async function list(env) {
  const res = await env.PAGES.list();

  const pages = await Promise.all(
    res.objects
      .filter(o => o.key.endsWith(".md"))
      .map(async o => {
        const slug = o.key.replace(".md", "");
        const md = await getFile(env, slug);
        const parsed = parse(md);

        return {
          slug,
          title: parsed.title || slug
        };
      })
  );

  pages.sort((a, b) => a.title.localeCompare(b.title));
  return pages;
}

/* ===== ROUTER ===== */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;

    try {

      if (p === "/logo.svg")
        return new Response(await (await env.PAGES.get("logo.svg")).arrayBuffer(),
          { headers: { "Content-Type": "image/svg+xml" }});

      if (p === "/favicon.svg")
        return new Response(await (await env.PAGES.get("favicon.svg")).arrayBuffer(),
          { headers: { "Content-Type": "image/svg+xml" }});

      if (p === "/_list") {
        return new Response(JSON.stringify(await list(env)), {
          headers: { "Content-Type": "application/json" }
        });
      }

      if (p.startsWith("/_get/")) {
        const slug = p.split("/").pop();
        const md = await getFile(env, slug);

        if (!md) {
          return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
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

      if (p === "/") return html(INDEX, `<a href="/new">New</a>`);
      if (p === "/new") return html(EDITOR, `<button onclick="save()">Save</button>`);
      if (p.startsWith("/edit/")) return html(EDITOR, `<button onclick="save()">Save</button>`);
      if (p.startsWith("/") && !p.startsWith("/_")) {
        return html(VIEW, `<a href="/edit/${p.slice(1)}">Edit</a>`);
      }

      return new Response("404", { status: 404 });

    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  }
};

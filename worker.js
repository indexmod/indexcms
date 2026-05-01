
// ================= SAFE JSON =================
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
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

// ================= LIST PAGES (SAFE VERSION) =================
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

      return new Response("OK");
    } catch (e) {
      return json({
        error: "worker crash",
        message: e.message
      }, 500);
    }
  }
};

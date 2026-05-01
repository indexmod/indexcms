import { parseMD } from "./parser.js";

// ================= SAVE =================
async function savePage(req, env) {
  const data = await req.json();

  const id = crypto.randomUUID();

  const md = `---
id: ${id}
title: ${data.title}
slug: ${data.slug}
---

${data.content}
`;

  await env.PAGES.put(`${data.slug}.md`, md);

  return new Response("ok");
}

// ================= GET PAGE =================
async function getPage(req, env, slug) {
  const raw = await env.PAGES.get(`${slug}.md`);

  if (!raw) {
    return new Response("not found", { status: 404 });
  }

  const parsed = parseMD(await raw.text());

  return Response.json({
    title: parsed.title,
    slug: parsed.slug,
    content: parsed.content
  });
}

// ================= LIST =================
async function listPages(req, env) {
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

  return Response.json(pages);
}

// ================= ROUTER =================
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;

    // POST /save
    if (path === "/save") {
      return savePage(req, env);
    }

    // GET /page/:slug
    if (path.startsWith("/page/")) {
      const slug = path.split("/").pop();
      return getPage(req, env, slug);
    }

    // GET /pages
    if (path === "/pages") {
      return listPages(req, env);
    }

    return new Response("API OK");
  }
};

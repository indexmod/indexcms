const API = "https://indexcms.workers.dev";

// ================= HELPERS =================
async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API error");
  }

  const type = res.headers.get("content-type");

  if (type && type.includes("application/json")) {
    return res.json();
  }

  return res.text();
}

// ================= LIST =================
export function listPages() {
  return request(`${API}/api/pages`);
}

// ================= GET =================
export function getPage(slug) {
  return request(`${API}/api/page/${slug}`);
}

// ================= SAVE =================
export function savePage(data) {
  return request(`${API}/api/save`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

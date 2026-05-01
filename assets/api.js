const API = "https://YOUR-WORKER.workers.dev";

// ================= LIST =================
export async function listPages() {
  const res = await fetch(`${API}/pages`);
  return res.json();
}

// ================= GET =================
export async function getPage(slug) {
  const res = await fetch(`${API}/page/${slug}`);
  return res.json();
}

// ================= SAVE =================
export async function savePage(data) {
  return fetch(`${API}/save`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

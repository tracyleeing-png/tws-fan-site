const NOTES_API_URL = "https://tws-247-with-tws.tracyleeing.chatgpt.site/api/notes";
const ADMIN_SESSION_KEY = "tws-42-admin-session";

const loginSection = document.querySelector("#admin-login");
const dashboard = document.querySelector("#admin-dashboard");
const loginForm = document.querySelector("#admin-login-form");
const tokenInput = document.querySelector("#admin-token");
const loginStatus = document.querySelector("#admin-login-status");
const notesContainer = document.querySelector("#admin-notes");
const countLabel = document.querySelector("#admin-count");
let adminToken = "";

function updateClock() {
  document.querySelector("#admin-clock").textContent = new Date().toLocaleTimeString("zh-CN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

async function adminRequest(path = "", options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${adminToken}`);
  const response = await fetch(`${NOTES_API_URL}${path}`, { ...options, headers, mode: "cors" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "留言后台暂时无法连接");
  return data;
}

function renderNotes(notes) {
  notesContainer.replaceChildren();
  countLabel.textContent = `${notes.length} 条留言`;
  if (!notes.length) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "留言墙现在是空的。";
    notesContainer.append(empty);
    return;
  }

  notes.forEach((note) => {
    const article = document.createElement("article");
    article.className = "admin-note";
    const copy = document.createElement("div");
    const message = document.createElement("p");
    const footer = document.createElement("footer");
    const name = document.createElement("span");
    const date = document.createElement("time");
    const remove = document.createElement("button");
    message.textContent = note.message;
    name.textContent = `— ${note.name}`;
    date.textContent = note.date;
    footer.append(name, date);
    copy.append(message, footer);
    remove.type = "button";
    remove.textContent = "删除留言";
    remove.addEventListener("click", async () => {
      if (!window.confirm(`确定删除“${note.name}”的这条留言吗？`)) return;
      remove.disabled = true;
      remove.textContent = "删除中…";
      try {
        await adminRequest(`?id=${encodeURIComponent(note.id)}`, { method: "DELETE" });
        article.remove();
        const remaining = notesContainer.querySelectorAll(".admin-note").length;
        countLabel.textContent = `${remaining} 条留言`;
        if (!remaining) renderNotes([]);
      } catch (error) {
        remove.disabled = false;
        remove.textContent = "删除留言";
        window.alert(error.message || "暂时无法删除，请稍后再试。");
      }
    });
    article.append(copy, remove);
    notesContainer.append(article);
  });
}

async function loadDashboard() {
  notesContainer.innerHTML = '<p class="admin-empty">正在读取留言…</p>';
  const data = await adminRequest("?limit=300");
  if (!data.admin) throw new Error("管理员密钥不正确");
  renderNotes(Array.isArray(data.notes) ? data.notes : []);
  loginSection.hidden = true;
  dashboard.hidden = false;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminToken = tokenInput.value.trim();
  if (!adminToken) return;
  loginStatus.classList.remove("error");
  loginStatus.textContent = "正在验证…";
  try {
    await loadDashboard();
    sessionStorage.setItem(ADMIN_SESSION_KEY, adminToken);
    tokenInput.value = "";
    loginStatus.textContent = "密钥只会临时保存在当前标签页。";
  } catch (error) {
    adminToken = "";
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    loginStatus.classList.add("error");
    loginStatus.textContent = error.message || "验证失败，请检查密钥。";
  }
});

document.querySelector("#admin-refresh").addEventListener("click", () => {
  loadDashboard().catch((error) => window.alert(error.message || "刷新失败，请稍后再试。"));
});

document.querySelector("#admin-logout").addEventListener("click", () => {
  adminToken = "";
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  dashboard.hidden = true;
  loginSection.hidden = false;
  tokenInput.focus();
});

updateClock();
setInterval(updateClock, 1000);

adminToken = sessionStorage.getItem(ADMIN_SESSION_KEY) || "";
if (adminToken) {
  loadDashboard().catch(() => {
    adminToken = "";
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    loginSection.hidden = false;
    dashboard.hidden = true;
  });
}

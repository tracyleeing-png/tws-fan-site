const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const memberData = {
  shinyu: {
    index: "01", monogram: "S", name: "SHINYU", korean: "申惟 · 신유", date: "2003.11.07", color: "#9ee2ce",
    url: "https://zh.wikipedia.org/wiki/申惟",
    facts: [
      ["本名", "Shin Junghwan · 신정환 · 申晶寏"], ["生日", "2003.11.07 · 天蝎座"], ["身高", "182 cm"],
      ["MBTI", "INFP"], ["学校", "Lila 艺术高中"], ["出生地", "忠清南道礼山郡礼山邑"],
    ],
  },
  dohoon: {
    index: "02", monogram: "D", name: "DOHOON", korean: "道勋 · 도훈", date: "2005.01.30", color: "#ffe273",
    url: "https://zh.wikipedia.org/wiki/道勳",
    facts: [
      ["本名", "Kim Dohoon · 김도훈 · 金道勋"], ["生日", "2005.01.30 · 水瓶座"], ["身高", "182 cm"],
      ["MBTI", "ENFP → INFP → ISTP → INTP"], ["学校", "Lila 艺高 → 翰林艺高实用音乐科"], ["出生地", "首尔特别市芦原区孔陵洞"],
    ],
  },
  youngjae: {
    index: "03", monogram: "Y", name: "YOUNGJAE", korean: "英宰 · 영재", date: "2005.05.31", color: "#9bd6ff",
    url: "https://zh.wikipedia.org/wiki/英宰",
    facts: [
      ["本名", "Choi Youngjae · 최영재 · 崔英宰"], ["生日", "2005.05.31 · 双子座"], ["身高", "183 cm"],
      ["MBTI", "ISFJ → ISTJ"], ["学校", "蚕新高中"], ["出生地", "庆尚南道金海市"],
    ],
  },
  hanjin: {
    index: "04", monogram: "H", name: "HANJIN", korean: "韩振 · 한진", date: "2006.01.05", color: "#ffb6a4",
    url: "https://zh.wikipedia.org/wiki/%E9%9F%93%E6%8C%AF",
    facts: [
      ["本名", "韩振 · 한진"], ["生日", "2006.01.05 · 摩羯座"], ["身高", "178 cm"],
      ["MBTI", "INFJ"], ["学校", "河南师大附中国际部日韩班"], ["出生地", "河南省新乡市"],
    ],
  },
  jihoon: {
    index: "05", monogram: "J", name: "JIHOON", korean: "志薰 · 지훈", date: "2006.03.28", color: "#cfc5ff",
    url: "https://zh.wikipedia.org/wiki/志薫",
    facts: [
      ["本名", "Han Jihoon · 한지훈 · 韩志薰"], ["生日", "2006.03.28 · 白羊座"], ["身高", "180 cm"],
      ["MBTI", "INFJ"], ["学校", "翰林艺高实用舞蹈科"], ["出生地", "首尔特别市江南区大峙洞"],
    ],
  },
  kyungmin: {
    index: "06", monogram: "K", name: "KYUNGMIN", korean: "炅潣 · 이경민", date: "2007.10.02", color: "#7898c7",
    url: "https://zh.wikipedia.org/wiki/炅潣",
    facts: [
      ["本名", "Lee Kyungmin · 이경민 · 李炅潣"], ["生日", "2007.10.02 · 天秤座"], ["身高", "176 cm"],
      ["MBTI", "ISFP → ENTJ → INTP → INTJ"], ["学校", "翰林艺高实用音乐科"], ["出生地", "京畿道金浦市场基洞"],
    ],
  },
};

const moodSongs = {
  heart: { label: "FOR A LITTLE HEART FLUTTER", title: "plot twist", album: "Sparkling Blue · 2024", message: "计划之外的相遇，也许正是青春最好的开场。", url: "https://y.qq.com/n/ryqq/songDetail/002DQFDz4VpodY", color: "#88cfff" },
  sunny: { label: "FOR A BRIGHT AFTERNOON", title: "hey! hey!", album: "SUMMER BEAT! · 2024", message: "把窗户打开吧，今天的风正好适合一起奔跑。", url: "https://y.qq.com/n/ryqq/songDetail/002kL3361NLAWZ", color: "#88dfb5" },
  friend: { label: "FOR OUR FOREVER FRIENDSHIP", title: "BFF", album: "Sparkling Blue · 2024", message: "最好的青春从来不是一个人，而是回头时你们都在。", url: "https://y.qq.com/n/ryqq/songDetail/000E1B0a4dgZGM", color: "#ffe26e" },
  courage: { label: "FOR YOUR NEXT BIG STEP", title: "Countdown!", album: "TRY WITH US · 2025", message: "不必等到完全准备好，倒数三秒，我们一起出发。", url: "https://y.qq.com/n/ryqq/songDetail/000bTyS54GvKWI", color: "#ffad70" },
  sunset: { label: "FOR A SOFT GOODBYE", title: "Last Festival", album: "Last Bell · 2024", message: "晚霞会落下，但喜欢过的这一刻不会真正结束。", url: "https://y.qq.com/n/ryqq/songDetail/002kXKxU3PaKZZ", color: "#ef958d" },
  energy: { label: "FOR A SEVEN-SECOND BOOST", title: "Oh Mymy : 7s", album: "Sparkling Blue · 2024", message: "只要七秒，就把犹豫留在身后，把音量调到最大。", url: "https://y.qq.com/n/ryqq/songDetail/0040p5IJ1YCuu4", color: "#a9a2f2" },
};

let manualTheme = null;
let toastTimer;

function updateTime() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();
  const isNight = manualTheme ? manualTheme === "night" : hour < 6 || hour >= 19;
  const timeText = now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const daySeconds = hour * 3600 + minute * 60 + second;
  const progress = daySeconds / 86400;

  document.body.classList.toggle("time-night", isNight);
  $(".theme-icon").textContent = isNight ? "☾" : "☼";
  $("meta[name='theme-color']").setAttribute("content", isNight ? "#0d1b31" : "#dff3ff");
  $("#clock").textContent = timeText;
  $("#final-time").textContent = timeText;
  $("#home-date").textContent = now.toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).replaceAll("/", ".") + ` · ${now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}`;
  $("#day-progress").textContent = `${(progress * 100).toFixed(1)}% OF TODAY`;
  $("#day-meter-fill").style.width = `${progress * 100}%`;
  $("#clock-orbit").style.setProperty("--day-progress", `${progress * 360}deg`);
  $("#hour-hand").style.transform = `rotate(${(hour % 12) * 30 + minute * 0.5}deg)`;
  $("#minute-hand").style.transform = `rotate(${minute * 6 + second * 0.1}deg)`;
  $("#second-hand").style.transform = `rotate(${second * 6}deg)`;
}

function initNavigation() {
  const header = $(".site-header");
  const menuButton = $(".menu-button");
  const navLinks = $(".nav-links");
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 18);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    $(".scroll-progress span").style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    navLinks.classList.toggle("open", open);
  });
  $$("a", navLinks).forEach((link) => link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false"); navLinks.classList.remove("open");
  }));
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) $$(".nav-links a").forEach((link) => link.classList.toggle("active", link.hash === `#${entry.target.id}`));
  }), { rootMargin: "-35% 0px -55%", threshold: 0 });
  $$('main section[id]').forEach((section) => observer.observe(section));
}

function initReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $$(".reveal").forEach((item) => item.classList.add("visible")); return;
  }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return; entry.target.classList.add("visible"); observer.unobserve(entry.target);
  }), { threshold: 0.1 });
  $$(".reveal").forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 3, 2) * 60}ms`; observer.observe(item);
  });
}

function openMember(id) {
  const member = memberData[id];
  const dialog = $("#member-dialog");
  if (!member || !dialog) return;
  $("#dialog-index").textContent = member.index;
  $("#dialog-monogram").textContent = member.monogram;
  $("#dialog-date").textContent = member.date;
  $("#dialog-name").textContent = member.name;
  $("#dialog-korean").textContent = member.korean;
  $("#dialog-link").href = member.url;
  const facts = $("#dialog-facts");
  facts.replaceChildren();
  member.facts.forEach(([label, value]) => {
    const dt = document.createElement("dt"); const dd = document.createElement("dd");
    dt.textContent = label; dd.textContent = value; facts.append(dt, dd);
  });
  dialog.style.setProperty("--dialog-color", member.color);
  dialog.showModal();
  $(".dialog-close").focus();
}

function initMembers() {
  $$("[data-member]").forEach((card) => card.addEventListener("click", () => openMember(card.dataset.member)));
  const dialog = $("#member-dialog");
  $(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}

function showSong(mood) {
  const song = moodSongs[mood];
  const card = $("#song-card");
  if (!song) return;
  card.classList.remove("change"); void card.offsetWidth;
  $("#song-mood").textContent = song.label;
  $("#song-title").textContent = song.title;
  $("#song-album").textContent = song.album;
  $("#song-message").textContent = `“${song.message}”`;
  $("#song-link").href = song.url;
  card.style.setProperty("--lemon", song.color);
  card.classList.add("change");
  $$("[data-mood]").forEach((button) => button.classList.toggle("active", button.dataset.mood === mood));
}

function initMood() {
  $$("[data-mood]").forEach((button) => button.addEventListener("click", () => showSong(button.dataset.mood)));
  $("#shuffle-song").addEventListener("click", () => {
    const moods = Object.keys(moodSongs); const current = $("[data-mood].active")?.dataset.mood;
    const candidates = moods.filter((mood) => mood !== current); showSong(candidates[Math.floor(Math.random() * candidates.length)]);
  });
}

function getNotes() {
  try { const saved = JSON.parse(localStorage.getItem("tws42NotesV2") || "[]"); return Array.isArray(saved) ? saved : []; }
  catch { return []; }
}

function renderNotes() {
  const wall = $("#note-wall"); wall.replaceChildren(); const saved = getNotes();
  if (!saved.length) {
    const empty = document.createElement("article"); empty.className = "note note-empty";
    empty.innerHTML = "<p>42 / LEAVE YOUR MESSAGE HERE.</p><footer><span>— TWS</span><time>24 / 7</time></footer>";
    wall.append(empty); return;
  }
  saved.slice(0, 12).forEach((note) => {
    const article = document.createElement("article"); article.className = "note";
    const message = document.createElement("p"); const footer = document.createElement("footer");
    const name = document.createElement("span"); const date = document.createElement("time");
    message.textContent = note.message; name.textContent = `— ${note.name}`; date.textContent = note.date;
    footer.append(name, date); article.append(message, footer); wall.append(article);
  });
}

function showToast(message) {
  const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function initLetters() {
  const form = $("#letter-form"); const textarea = $("#letter-message");
  textarea.addEventListener("input", () => { $("#letter-count").textContent = `${textarea.value.length} / 100`; });
  form.addEventListener("submit", (event) => {
    event.preventDefault(); const message = textarea.value.trim(); if (!message) return;
    const name = $("#letter-name").value.trim() || "一位 42"; const saved = getNotes();
    saved.unshift({ name: name.slice(0, 16), message: message.slice(0, 100), date: new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }).replace("/", ".") });
    try { localStorage.setItem("tws42NotesV2", JSON.stringify(saved.slice(0, 24))); }
    catch { showToast("暂时无法保存这条留言"); }
    form.reset(); $("#letter-count").textContent = "0 / 100"; renderNotes(); showToast("留言成功！✦");
  });
  renderNotes();
}

function initTilt() {
  if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
  $$('[data-tilt]').forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width - 0.5; const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${-y * 5}deg) rotateY(${x * 7}deg) rotate(2deg)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = "rotate(2deg)"; });
  });
}

function init() {
  updateTime(); setInterval(updateTime, 1000);
  initNavigation(); initReveal(); initMembers(); initMood(); initLetters(); initTilt();
  $(".theme-button").addEventListener("click", () => {
    manualTheme = document.body.classList.contains("time-night") ? "light" : "night"; updateTime();
  });
}

document.addEventListener("DOMContentLoaded", init);

"use strict";

const metadata = window.CV3_BUNDLE_METADATA || { title: "Audio", audio: "", segments: [] };
const audio = document.getElementById("audio");
const title = document.getElementById("title");
const counter = document.getElementById("counter");
const holder = document.getElementById("segments");
const backButton = document.getElementById("backButton");
const nextButton = document.getElementById("nextButton");
const themeButton = document.getElementById("themeButton");

let activeIndex = -1;
const segmentEls = [];

function getInitialTheme() {
  const stored = localStorage.getItem("cv3-reader-theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("cv3-reader-theme", theme);
  themeButton.textContent = theme === "dark" ? "Day" : "Night";
}

setTheme(getInitialTheme());

title.textContent = metadata.title || "Audio";
document.title = metadata.title ? `${metadata.title} - CosyVoice Reader` : "CosyVoice Reader";
audio.src = metadata.audio;

for (const [index, segment] of metadata.segments.entries()) {
  const button = document.createElement("button");
  button.className = "segment";
  button.type = "button";
  button.dataset.index = String(index);
  button.innerHTML = `<span class="id">${escapeHtml(segment.id)}</span><span class="text">${escapeHtml(segment.text)}</span>`;
  button.addEventListener("click", async () => {
    audio.currentTime = segment.time_start;
    await audio.play();
  });
  holder.appendChild(button);
  segmentEls.push(button);
}

counter.textContent = `0 / ${metadata.segments.length}`;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function findSegmentIndex(time) {
  const segments = metadata.segments;
  if (!segments.length) return -1;
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    if (time >= segment.time_start && time < segment.time_end) return i;
  }
  if (time >= segments[segments.length - 1].time_end) return segments.length - 1;
  return -1;
}

function setActiveIndex(index, shouldScroll = true) {
  if (index === activeIndex) return;
  if (activeIndex >= 0 && segmentEls[activeIndex]) {
    segmentEls[activeIndex].classList.remove("active");
  }
  activeIndex = index;
  if (activeIndex >= 0 && segmentEls[activeIndex]) {
    segmentEls[activeIndex].classList.add("active");
    counter.textContent = `${activeIndex + 1} / ${metadata.segments.length}`;
    if (shouldScroll) {
      segmentEls[activeIndex].scrollIntoView({ block: "center", behavior: "smooth" });
    }
  } else {
    counter.textContent = `0 / ${metadata.segments.length}`;
  }
}

function seekAdjacent(delta) {
  const base = activeIndex >= 0 ? activeIndex : findSegmentIndex(audio.currentTime);
  const next = Math.max(0, Math.min(metadata.segments.length - 1, base + delta));
  const segment = metadata.segments[next];
  if (!segment) return;
  audio.currentTime = segment.time_start;
  setActiveIndex(next);
}

audio.addEventListener("timeupdate", () => {
  setActiveIndex(findSegmentIndex(audio.currentTime));
});

backButton.addEventListener("click", () => seekAdjacent(-1));
nextButton.addEventListener("click", () => seekAdjacent(1));
themeButton.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  setTheme(current === "dark" ? "light" : "dark");
});

document.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") seekAdjacent(-1);
  if (event.key === "ArrowRight") seekAdjacent(1);
});

setActiveIndex(-1, false);

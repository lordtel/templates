(function () {
  "use strict";

  const STORAGE_KEY = "ember.tasks.v1";
  const FILTER_KEY = "ember.filter.v1";

  const els = {
    composer: document.getElementById("composer"),
    input: document.getElementById("task-input"),
    list: document.getElementById("task-list"),
    empty: document.getElementById("empty-state"),
    date: document.getElementById("today-heading"),
    progressValue: document.getElementById("progress-value"),
    progressCount: document.getElementById("progress-count"),
    ringFill: document.querySelector(".ring-fill"),
    filters: document.querySelectorAll(".filter"),
    clearDone: document.getElementById("clear-done"),
  };

  let tasks = load();
  let filter = localStorage.getItem(FILTER_KEY) || "all";

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function formatDate() {
    const opts = { weekday: "long", month: "long", day: "numeric" };
    els.date.textContent = new Date().toLocaleDateString(undefined, opts);
  }

  function renderProgress() {
    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    const circumference = 2 * Math.PI * 28;
    els.ringFill.style.strokeDashoffset = circumference - (circumference * pct) / 100;
    els.progressValue.textContent = pct + "%";
    els.progressCount.textContent = done + " of " + total;
  }

  function visibleTasks() {
    if (filter === "active") return tasks.filter((t) => !t.done);
    if (filter === "done") return tasks.filter((t) => t.done);
    return tasks;
  }

  function render() {
    const shown = visibleTasks();
    els.list.innerHTML = "";

    if (shown.length === 0) {
      els.empty.hidden = false;
      const msg = els.empty.querySelector(".empty-title");
      const sub = els.empty.querySelector(".empty-sub");
      if (tasks.length === 0) {
        msg.textContent = "A clean slate.";
        sub.textContent = "Add your first intention above.";
      } else if (filter === "active") {
        msg.textContent = "All clear.";
        sub.textContent = "Nothing active right now.";
      } else {
        msg.textContent = "Nothing finished yet.";
        sub.textContent = "Completed tasks will appear here.";
      }
    } else {
      els.empty.hidden = true;
      shown.forEach((task) => els.list.appendChild(buildItem(task)));
    }

    renderProgress();
  }

  function buildItem(task) {
    const li = document.createElement("li");
    li.className = "task" + (task.done ? " is-done" : "");
    li.dataset.id = task.id;

    const check = document.createElement("button");
    check.className = "task-check";
    check.type = "button";
    check.setAttribute("aria-label", task.done ? "Mark as incomplete" : "Mark as complete");
    check.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="5,12 10,17 19,7"/></svg>';
    check.addEventListener("click", () => toggle(task.id));

    const label = document.createElement("span");
    label.className = "task-label";
    label.textContent = task.text;

    const remove = document.createElement("button");
    remove.className = "task-remove";
    remove.type = "button";
    remove.setAttribute("aria-label", "Remove task");
    remove.textContent = "×";
    remove.addEventListener("click", () => removeTask(task.id));

    li.append(check, label, remove);
    return li;
  }

  function add(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    tasks.unshift({ id: uid(), text: trimmed, done: false, createdAt: Date.now() });
    save();
    render();
  }

  function toggle(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.done = !task.done;
    save();
    render();
  }

  function removeTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    save();
    render();
  }

  function setFilter(next) {
    filter = next;
    localStorage.setItem(FILTER_KEY, filter);
    els.filters.forEach((btn) => {
      const active = btn.dataset.filter === filter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    render();
  }

  els.composer.addEventListener("submit", (e) => {
    e.preventDefault();
    add(els.input.value);
    els.input.value = "";
    els.input.focus();
  });

  els.filters.forEach((btn) => {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
  });

  els.clearDone.addEventListener("click", () => {
    tasks = tasks.filter((t) => !t.done);
    save();
    render();
  });

  formatDate();
  setFilter(filter);
})();

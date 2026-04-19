import {
  subscribe,
  toggleTask,
  removeTask,
  clearCompleted,
  visibleTasks,
} from "../../core/store.js";

export function initTasks() {
  const list = document.getElementById("task-list");
  const empty = document.getElementById("empty-state");
  const clearBtn = document.getElementById("clear-done");
  if (!list || !empty) return;

  const emptyTitle = empty.querySelector(".empty-title");
  const emptySub = empty.querySelector(".empty-sub");

  clearBtn?.addEventListener("click", clearCompleted);

  subscribe((state) => render(state, { list, empty, emptyTitle, emptySub }));
}

function render(state, els) {
  const shown = visibleTasks();
  els.list.innerHTML = "";

  if (shown.length === 0) {
    els.empty.hidden = false;
    const copy = emptyCopy(state);
    els.emptyTitle.textContent = copy.title;
    els.emptySub.textContent = copy.sub;
    return;
  }

  els.empty.hidden = true;
  shown.forEach((task) => els.list.appendChild(buildItem(task)));
}

function emptyCopy(state) {
  if (state.tasks.length === 0) {
    return { title: "The night is still.", sub: "Set your first intention above." };
  }
  if (state.filter === "active") {
    return { title: "All handled.", sub: "Nothing active right now." };
  }
  return { title: "Nothing finished yet.", sub: "Completed tasks will appear here." };
}

function buildItem(task) {
  const li = document.createElement("li");
  li.className = "task" + (task.done ? " is-done" : "");
  li.dataset.id = task.id;

  const check = document.createElement("button");
  check.className = "task-check";
  check.type = "button";
  check.setAttribute(
    "aria-label",
    task.done ? "Mark as incomplete" : "Mark as complete"
  );
  check.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="5,12 10,17 19,7"/></svg>';
  check.addEventListener("click", () => toggleTask(task.id));

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

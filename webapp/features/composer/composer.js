import { addTask } from "../../core/store.js";

export function initComposer() {
  const form = document.getElementById("composer");
  const input = document.getElementById("task-input");
  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask(input.value);
    input.value = "";
    input.focus();
  });
}

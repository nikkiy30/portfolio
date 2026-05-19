const defaultTasks = [];

const page = document.body.dataset.page;
const navLinks = document.querySelectorAll("[data-nav]");

navLinks.forEach((link) => {
  if (link.dataset.nav === page) {
    link.classList.add("is-current");
  }
});

const storageKey = "studyfolio-learning-tasks-v2";
const visibleTaskLimit = 4;
const taskList = document.getElementById("task-list");
const taskForm = document.getElementById("task-form");
const taskResetButton = document.getElementById("task-reset-button");
const taskOpenButton = document.getElementById("task-open-button");
const taskCloseButton = document.getElementById("task-close-button");
const taskDialog = document.getElementById("task-dialog");
const taskCountTotal = document.getElementById("task-count-total");
const taskCountActive = document.getElementById("task-count-active");
const taskCountDone = document.getElementById("task-count-done");
const taskCountTodo = document.getElementById("task-count-todo");
const taskCountActiveRow = document.getElementById("task-count-active-row");
const taskCountDoneRow = document.getElementById("task-count-done-row");
const taskProgressTodo = document.getElementById("task-progress-todo");
const taskProgressActive = document.getElementById("task-progress-active");
const taskProgressDone = document.getElementById("task-progress-done");
const taskLimitNote = document.getElementById("task-limit-note");

function loadTasks() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : defaultTasks;
  } catch (error) {
    return defaultTasks;
  }
}

function saveTasks(tasks) {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function renderTaskCounts(tasks) {
  if (!taskCountTotal || !taskCountActive || !taskCountDone) {
    return;
  }

  const todoCount = tasks.filter((task) => task.status === "これから").length;
  const activeCount = tasks.filter((task) => task.status === "進行中").length;
  const doneCount = tasks.filter((task) => task.status === "完了").length;
  const totalCount = tasks.length || 1;

  taskCountTotal.textContent = String(tasks.length);
  taskCountActive.textContent = String(activeCount);
  taskCountDone.textContent = String(doneCount);

  if (taskCountTodo) taskCountTodo.textContent = String(todoCount);
  if (taskCountActiveRow) taskCountActiveRow.textContent = String(activeCount);
  if (taskCountDoneRow) taskCountDoneRow.textContent = String(doneCount);

  if (taskProgressTodo) taskProgressTodo.style.width = `${(todoCount / totalCount) * 100}%`;
  if (taskProgressActive) taskProgressActive.style.width = `${(activeCount / totalCount) * 100}%`;
  if (taskProgressDone) taskProgressDone.style.width = `${(doneCount / totalCount) * 100}%`;

  if (taskLimitNote) {
    const hiddenCount = Math.max(tasks.length - visibleTaskLimit, 0);
    taskLimitNote.textContent = hiddenCount > 0
      ? `最新${visibleTaskLimit}件を表示中。過去${hiddenCount}件はブラウザに保存されています。`
      : `最新${visibleTaskLimit}件まで表示します。`;
  }
}

function renderTasks() {
  if (!taskList) {
    return;
  }

  const tasks = loadTasks();
  renderTaskCounts(tasks);
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "まだタスクがありません。今やっていることを追加してみてください。";
    taskList.appendChild(empty);
    return;
  }

  tasks.slice(0, visibleTaskLimit).forEach((task, index) => {
    const article = document.createElement("article");
    article.className = "task-item";
    article.dataset.status = task.status;
    article.dataset.index = String(index);

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const status = document.createElement("span");
    status.className = "task-status";
    status.textContent = task.status;

    const label = document.createElement("span");
    label.textContent = "Learning Task";

    meta.append(status, label);

    const title = document.createElement("strong");
    title.className = "task-item-title";
    title.textContent = task.title;

    const note = document.createElement("p");
    note.className = "task-item-note";
    note.textContent = task.note;

    const deleteButton = document.createElement("button");
    deleteButton.className = "task-delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.deleteTask = String(index);
    deleteButton.textContent = "削除";

    article.append(meta, title, note, deleteButton);
    taskList.appendChild(article);
  });
}

if (taskForm) {
  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(taskForm);
    const title = String(formData.get("title") || "").trim();
    const status = String(formData.get("status") || "進行中").trim();
    const note = String(formData.get("note") || "").trim();

    if (!title) {
      return;
    }

    const tasks = loadTasks();
    tasks.unshift({
      id: Date.now(),
      title,
      status,
      note: note || "学習メモはこれから追記する予定です。"
    });

    saveTasks(tasks);
    taskForm.reset();
    if (taskDialog) {
      taskDialog.close();
    }
    renderTasks();
  });
}

if (taskResetButton) {
  taskResetButton.addEventListener("click", () => {
    saveTasks([]);
    renderTasks();
  });
}

if (taskList) {
  taskList.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const deleteButton = event.target.closest("[data-delete-task]");

    if (!deleteButton) {
      return;
    }

    const index = Number(deleteButton.dataset.deleteTask);
    const tasks = loadTasks();
    tasks.splice(index, 1);
    saveTasks(tasks);
    renderTasks();
  });
}

if (taskList) {
  renderTasks();
}

if (taskOpenButton && taskDialog) {
  taskOpenButton.addEventListener("click", () => {
    taskDialog.showModal();
  });
}

if (taskCloseButton && taskDialog) {
  taskCloseButton.addEventListener("click", () => {
    taskDialog.close();
  });
}

if (taskDialog) {
  taskDialog.addEventListener("click", (event) => {
    if (event.target === taskDialog) {
      taskDialog.close();
    }
  });
}

const portfolioSearch = document.getElementById("portfolio-search");
const portfolioCards = document.querySelectorAll("[data-work-card]");
const portfolioEmpty = document.getElementById("portfolio-empty");

function filterPortfolioCards() {
  if (!portfolioSearch || portfolioCards.length === 0) {
    return;
  }

  const query = portfolioSearch.value.trim().toLowerCase();
  let visibleCount = 0;

  portfolioCards.forEach((card) => {
    const text = `${card.textContent} ${card.dataset.searchText || ""}`.toLowerCase();
    const isVisible = !query || text.includes(query);
    card.hidden = !isVisible;

    if (isVisible) {
      visibleCount += 1;
    }
  });

  if (portfolioEmpty) {
    portfolioEmpty.hidden = visibleCount > 0;
  }
}

if (portfolioSearch) {
  portfolioSearch.addEventListener("input", filterPortfolioCards);
}

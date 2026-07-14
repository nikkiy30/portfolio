const defaultTasks = [];

const page = document.body.dataset.page;
const navLinks = document.querySelectorAll("[data-nav]");

navLinks.forEach((link) => {
  if (link.dataset.nav === page) {
    link.classList.add("is-current");
  }
});

const storageKey = "studyfolio-learning-admin-tasks-v1";
const portfolioStorageKey = "studyfolio-portfolio-admin-projects-v1";
const visibleTaskLimit = 4;
const staticLearningTasks = Array.isArray(window.learningTasks) ? window.learningTasks : [];
const staticPortfolioProjects = Array.isArray(window.portfolioProjects) ? window.portfolioProjects : [];
const isLearningAdmin = Boolean(document.getElementById("task-form"));
const isPortfolioAdmin = Boolean(document.getElementById("portfolio-form"));
const taskList = document.getElementById("task-list");
const previewTaskList = document.getElementById("preview-task-list");
const taskForm = document.getElementById("task-form");
const taskResetButton = document.getElementById("task-reset-button");
const taskExportOutput = document.getElementById("task-export-output");
const portfolioGrid = document.getElementById("portfolio-grid");
const portfolioForm = document.getElementById("portfolio-form");
const portfolioResetButton = document.getElementById("portfolio-reset-button");
const portfolioAdminList = document.getElementById("portfolio-admin-list");
const portfolioExportOutput = document.getElementById("portfolio-export-output");
const portfolioSubmitButton = document.getElementById("portfolio-submit-button");
const portfolioCancelEditButton = document.getElementById("portfolio-cancel-edit-button");
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
const previewTypeLabels = {
  site: "Webサイト画面",
  mobile: "モバイルアプリ画面",
  ui: "UI部品・画面練習",
  notes: "学習ノート・資料"
};

function loadTasks() {
  if (!isLearningAdmin) {
    return staticLearningTasks;
  }

  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : staticLearningTasks;
  } catch (error) {
    return defaultTasks;
  }
}

function saveTasks(tasks) {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function createLearningDataSource(tasks) {
  return `window.learningTasks = ${JSON.stringify(tasks, null, 2)};\n`;
}

function loadPortfolioProjects() {
  if (!isPortfolioAdmin) {
    return staticPortfolioProjects;
  }

  try {
    const saved = localStorage.getItem(portfolioStorageKey);
    return saved ? JSON.parse(saved) : staticPortfolioProjects;
  } catch (error) {
    return staticPortfolioProjects;
  }
}

function savePortfolioProjects(projects) {
  localStorage.setItem(portfolioStorageKey, JSON.stringify(projects));
}

function createPortfolioDataSource(projects) {
  return `window.portfolioProjects = ${JSON.stringify(projects, null, 2)};\n`;
}

function parseAwardLabels(value) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseProjectLinks(value) {
  return value
    .split("\n")
    .map((line) => {
      const [labelPart, ...urlParts] = line.split("|");
      const label = String(labelPart || "").trim();
      const url = urlParts.join("|").trim();
      return label && url ? { label, url } : null;
    })
    .filter(Boolean);
}

function formatAwardLabels(awards = []) {
  return Array.isArray(awards) ? awards.join(", ") : "";
}

function formatProjectLinks(links = []) {
  if (!Array.isArray(links)) {
    return "";
  }

  return links
    .map((link) => `${link.label || ""} | ${link.url || ""}`.trim())
    .filter((line) => line !== "|")
    .join("\n");
}

function getPortfolioProjectFromForm(formData, fallbackId = Date.now()) {
  const title = String(formData.get("title") || "").trim();
  const purpose = String(formData.get("purpose") || "").trim();
  const built = String(formData.get("built") || "").trim();
  const next = String(formData.get("next") || "").trim();
  const searchText = String(formData.get("searchText") || "").trim();
  const awards = parseAwardLabels(String(formData.get("awards") || ""));
  const links = parseProjectLinks(String(formData.get("links") || ""));
  const imageSrc = String(formData.get("imageSrc") || "").trim();
  const imageAlt = String(formData.get("imageAlt") || "").trim();
  const previewType = String(formData.get("previewType") || "site").trim();

  if (!title || !purpose || !built) {
    return null;
  }

  const project = {
    id: fallbackId,
    title,
    purpose,
    built,
    next,
    searchText: searchText || `${title} ${built}`,
    previewType
  };

  if (awards.length > 0) {
    project.awards = awards;
  }

  if (links.length > 0) {
    project.links = links;
  }

  if (imageSrc) {
    project.image = {
      src: imageSrc,
      alt: imageAlt || `${title}の画面イメージ`
    };
  }

  return project;
}

function setPortfolioEditMode(index = null) {
  if (!portfolioForm) {
    return;
  }

  if (index === null) {
    delete portfolioForm.dataset.editingIndex;
    if (portfolioSubmitButton) portfolioSubmitButton.textContent = "成果物を追加";
    if (portfolioCancelEditButton) portfolioCancelEditButton.hidden = true;
    return;
  }

  portfolioForm.dataset.editingIndex = String(index);
  if (portfolioSubmitButton) portfolioSubmitButton.textContent = "変更を保存";
  if (portfolioCancelEditButton) portfolioCancelEditButton.hidden = false;
}

function fillPortfolioForm(project) {
  if (!portfolioForm) {
    return;
  }

  portfolioForm.elements.namedItem("title").value = project.title || "";
  portfolioForm.elements.namedItem("purpose").value = project.purpose || "";
  portfolioForm.elements.namedItem("built").value = project.built || "";
  portfolioForm.elements.namedItem("next").value = project.next || "";
  portfolioForm.elements.namedItem("searchText").value = project.searchText || "";
  portfolioForm.elements.namedItem("awards").value = formatAwardLabels(project.awards);
  portfolioForm.elements.namedItem("links").value = formatProjectLinks(project.links);
  portfolioForm.elements.namedItem("imageSrc").value = project.image?.src || "";
  portfolioForm.elements.namedItem("imageAlt").value = project.image?.alt || "";
  portfolioForm.elements.namedItem("previewType").value = project.previewType || "site";
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

function createTaskItem(task, index, options = {}) {
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
  label.textContent = options.label || "Learning Task";

  meta.append(status, label);

  const title = document.createElement("strong");
  title.className = "task-item-title";
  title.textContent = task.title;

  const note = document.createElement("p");
  note.className = "task-item-note";
  note.textContent = task.note;

  article.append(meta, title, note);

  if (options.withDelete) {
    const deleteButton = document.createElement("button");
    deleteButton.className = "task-delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.deleteTask = String(index);
    deleteButton.textContent = "削除";
    article.appendChild(deleteButton);
  }

  return article;
}

function renderTaskList(target, tasks, options = {}) {
  if (!target) {
    return;
  }

  target.innerHTML = "";

  if (tasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = options.emptyText || "まだタスクがありません。";
    target.appendChild(empty);
    return;
  }

  tasks.slice(0, visibleTaskLimit).forEach((task, index) => {
    target.appendChild(createTaskItem(task, index, options));
  });
}

function renderTasks() {
  const tasks = loadTasks();
  renderTaskCounts(tasks);
  renderTaskList(taskList, tasks, {
    withDelete: true,
    label: "Admin Task",
    emptyText: "まだタスクがありません。管理者入力から追加してください。"
  });
  renderTaskList(previewTaskList, tasks, {
    label: "Learning Task",
    emptyText: "まだ公開できる学習タスクがありません。"
  });

  if (taskExportOutput) {
    taskExportOutput.value = createLearningDataSource(tasks);
  }
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
    const task = {
      id: Date.now(),
      title,
      status,
      note: note || "学習メモはこれから追記する予定です。"
    };

    tasks.unshift(task);

    saveTasks(tasks);
    taskForm.reset();
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

if (taskList || previewTaskList) {
  renderTasks();
}

const portfolioSearch = document.getElementById("portfolio-search");
const portfolioEmpty = document.getElementById("portfolio-empty");

function createWorkPreview(project) {
  const type = ["site", "mobile", "ui", "notes"].includes(project.previewType) ? project.previewType : "site";

  if (project.image && project.image.src) {
    const preview = document.createElement("figure");
    preview.className = "work-preview work-photo";
    preview.setAttribute("aria-label", `${project.title}の写真`);

    const image = document.createElement("img");
    image.src = project.image.src;
    image.alt = project.image.alt || `${project.title}の画面イメージ`;
    image.loading = "lazy";

    preview.appendChild(image);
    return preview;
  }

  const preview = document.createElement("div");
  preview.className = `work-preview work-preview-${type}`;
  preview.setAttribute("aria-label", `${project.title}の画面イメージ`);

  const bar = document.createElement("span");
  bar.className = "work-window-bar";
  preview.appendChild(bar);

  if (type === "mobile") {
    const phone = document.createElement("span");
    phone.className = "work-preview-phone";

    ["header", "", "", "short"].forEach((modifier) => {
      const row = document.createElement("span");
      row.className = modifier ? `work-preview-mobile-row ${modifier}` : "work-preview-mobile-row";
      phone.appendChild(row);
    });

    preview.appendChild(phone);
    return preview;
  }

  if (type === "ui") {
    ["", "", "wide"].forEach((modifier) => {
      const card = document.createElement("span");
      card.className = modifier ? `work-preview-card ${modifier}` : "work-preview-card";
      preview.appendChild(card);
    });
    return preview;
  }

  if (type === "notes") {
    ["", "", "short"].forEach((modifier) => {
      const row = document.createElement("span");
      row.className = modifier ? `work-preview-row ${modifier}` : "work-preview-row";
      preview.appendChild(row);
    });
    return preview;
  }

  const title = document.createElement("span");
  title.className = "work-preview-title";
  title.textContent = project.title;
  const line = document.createElement("span");
  line.className = "work-preview-line";
  const shortLine = document.createElement("span");
  shortLine.className = "work-preview-line short";
  preview.append(title, line, shortLine);
  return preview;
}

function createWorkCard(project, index, options = {}) {
  const article = document.createElement("article");
  article.className = index === 0 && !options.compact ? "panel work-card accent-card" : "panel work-card";
  article.dataset.workCard = "";
  article.dataset.searchText = project.searchText || "";

  const body = document.createElement("div");
  body.className = "work-card-body";

  const label = document.createElement("p");
  label.className = "card-label";
  label.textContent = `Project ${String(index + 1).padStart(2, "0")}`;

  const title = document.createElement("h3");
  title.textContent = project.title;

  const badges = document.createElement("div");
  badges.className = "work-badges";

  if (Array.isArray(project.awards)) {
    project.awards.forEach((award) => {
      const badge = document.createElement("span");
      badge.textContent = award;
      badges.appendChild(badge);
    });
  }

  const details = document.createElement("dl");
  details.className = "work-details";

  [
    ["Purpose", project.purpose],
    ["Built", project.built],
    ["Next", project.next || "次の改善点を整理中です。"]
  ].forEach(([term, description]) => {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = term;
    dd.textContent = description;
    row.append(dt, dd);
    details.appendChild(row);
  });

  const links = document.createElement("div");
  links.className = "work-links";

  if (Array.isArray(project.links)) {
    project.links.forEach((projectLink) => {
      if (!projectLink.label || !projectLink.url) {
        return;
      }

      const link = document.createElement("a");
      link.href = projectLink.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = projectLink.label;
      links.appendChild(link);
    });
  }

  body.append(label, title);
  if (badges.children.length > 0) {
    body.appendChild(badges);
  }
  body.appendChild(details);
  if (links.children.length > 0) {
    body.appendChild(links);
  }
  article.append(createWorkPreview(project), body);
  return article;
}

function renderPortfolioAdminList(projects) {
  if (!portfolioAdminList) {
    return;
  }

  portfolioAdminList.innerHTML = "";

  if (projects.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "まだ成果物がありません。";
    portfolioAdminList.appendChild(empty);
    return;
  }

  projects.forEach((project, index) => {
    const article = document.createElement("article");
    article.className = "task-item";

    const meta = document.createElement("div");
    meta.className = "task-meta";
    const status = document.createElement("span");
    status.className = "task-status";
    status.textContent = `Project ${String(index + 1).padStart(2, "0")}`;
    const type = document.createElement("span");
    type.textContent = previewTypeLabels[project.previewType] || previewTypeLabels.site;
    meta.append(status, type);

    const title = document.createElement("strong");
    title.className = "task-item-title";
    title.textContent = project.title;

    const note = document.createElement("p");
    note.className = "task-item-note";
    note.textContent = project.purpose;

    const deleteButton = document.createElement("button");
    deleteButton.className = "task-delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.deleteProject = String(index);
    deleteButton.textContent = "削除";

    const editButton = document.createElement("button");
    editButton.className = "task-edit-button";
    editButton.type = "button";
    editButton.dataset.editProject = String(index);
    editButton.textContent = "編集";

    const actions = document.createElement("div");
    actions.className = "task-item-actions";
    actions.append(editButton, deleteButton);

    article.append(meta, title, note, actions);
    portfolioAdminList.appendChild(article);
  });
}

function renderPortfolioProjects() {
  if (!portfolioGrid) {
    return;
  }

  const projects = loadPortfolioProjects();
  portfolioGrid.innerHTML = "";

  projects.forEach((project, index) => {
    portfolioGrid.appendChild(createWorkCard(project, index, { compact: isPortfolioAdmin }));
  });

  renderPortfolioAdminList(projects);

  if (portfolioExportOutput) {
    portfolioExportOutput.value = createPortfolioDataSource(projects);
  }

  filterPortfolioCards();
}

function filterPortfolioCards() {
  const portfolioCards = document.querySelectorAll("[data-work-card]");

  if (!portfolioSearch || portfolioCards.length === 0) {
    if (portfolioEmpty) {
      portfolioEmpty.hidden = portfolioCards.length > 0;
    }
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

if (portfolioGrid) {
  renderPortfolioProjects();
}

if (portfolioForm) {
  portfolioForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(portfolioForm);
    const projects = loadPortfolioProjects();
    const editingIndex = portfolioForm.dataset.editingIndex;
    const parsedIndex = editingIndex === undefined ? NaN : Number(editingIndex);
    const currentIndex = Number.isInteger(parsedIndex) && projects[parsedIndex] ? parsedIndex : null;
    const fallbackId = currentIndex === null ? Date.now() : projects[currentIndex]?.id || Date.now();
    const project = getPortfolioProjectFromForm(formData, fallbackId);

    if (!project) {
      return;
    }

    if (currentIndex === null) {
      projects.push(project);
    } else {
      projects[currentIndex] = project;
    }

    savePortfolioProjects(projects);
    portfolioForm.reset();
    setPortfolioEditMode(null);
    renderPortfolioProjects();
  });
}

if (portfolioResetButton) {
  portfolioResetButton.addEventListener("click", () => {
    savePortfolioProjects([]);
    setPortfolioEditMode(null);
    if (portfolioForm) portfolioForm.reset();
    renderPortfolioProjects();
  });
}

if (portfolioCancelEditButton) {
  portfolioCancelEditButton.addEventListener("click", () => {
    portfolioForm.reset();
    setPortfolioEditMode(null);
  });
}

if (portfolioAdminList) {
  portfolioAdminList.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const editButton = event.target.closest("[data-edit-project]");
    const deleteButton = event.target.closest("[data-delete-project]");

    if (editButton) {
      const index = Number(editButton.dataset.editProject);
      const projects = loadPortfolioProjects();
      const project = projects[index];

      if (!project) {
        return;
      }

      fillPortfolioForm(project);
      setPortfolioEditMode(index);
      portfolioForm.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!deleteButton) {
      return;
    }

    const index = Number(deleteButton.dataset.deleteProject);
    const projects = loadPortfolioProjects();
    projects.splice(index, 1);
    savePortfolioProjects(projects);
    setPortfolioEditMode(null);
    if (portfolioForm) portfolioForm.reset();
    renderPortfolioProjects();
  });
}

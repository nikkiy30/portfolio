const topics = {
  frontend: {
    label: "Frontend Track",
    title: "使いやすく、読みやすいUIを作る",
    description:
      "HTML、CSS、JavaScriptの基礎を固めながら、レスポンシブ対応と情報設計の理解を深めています。",
    points: [
      "セマンティックHTMLで伝わりやすい構造を組み立てる",
      "余白、配色、タイポグラフィで見やすさを整える",
      "小さなインタラクションでページに体験を加える"
    ],
    goal: "次はコンポーネント設計やアクセシビリティを意識したUI改善に進みたいです。"
  },
  design: {
    label: "Design Track",
    title: "情報の見せ方をデザインで整理する",
    description:
      "見た目の派手さだけでなく、読みやすいレイアウトと視線誘導を意識してデザインを学んでいます。",
    points: [
      "配色設計とコントラストで印象をコントロールする",
      "レイアウトの強弱で伝えたい情報の順番を作る",
      "実例を観察して、自分のUIに落とし込む"
    ],
    goal: "ブランド感のあるページデザインを、一貫したルールで組める状態を目指しています。"
  },
  output: {
    label: "Output Track",
    title: "学んだ内容を言葉と制作物で残す",
    description:
      "理解したことを自分の言葉で説明し、短い制作物として出力することで学習を定着させています。",
    points: [
      "小さな制作を繰り返して理解のあいまいさを減らす",
      "振り返りメモを残して次の改善につなげる",
      "ポートフォリオ自体を成長の記録として更新する"
    ],
    goal: "今後は作品ごとに意図、工夫、改善点まで説明できる形でまとめていきたいです。"
  }
};

const defaultTasks = [
  {
    title: "ポートフォリオのページ構成を整理する",
    status: "完了",
    note: "自己紹介、作品、学習ページに役割を分けて全体像を見直した。"
  },
  {
    title: "学習ページに現在のタスクを追加できるようにする",
    status: "進行中",
    note: "今やっていることを更新しやすいUIにして、日々の学習記録として使える形を整える。"
  },
  {
    title: "作品詳細ページの構成を考える",
    status: "これから",
    note: "作品ごとに目的、工夫、改善点をどこまで見せるかを整理する。"
  }
];

const page = document.body.dataset.page;
const navLinks = document.querySelectorAll("[data-nav]");

navLinks.forEach((link) => {
  if (link.dataset.nav === page) {
    link.classList.add("is-current");
  }
});

const tabs = document.querySelectorAll(".tab");
const topicLabel = document.getElementById("topic-label");
const topicTitle = document.getElementById("topic-title");
const topicDescription = document.getElementById("topic-description");
const topicPoints = document.getElementById("topic-points");
const topicGoal = document.getElementById("topic-goal");

function renderTopic(key) {
  const topic = topics[key];

  if (!topic || !topicLabel || !topicTitle || !topicDescription || !topicPoints || !topicGoal) {
    return;
  }

  topicLabel.textContent = topic.label;
  topicTitle.textContent = topic.title;
  topicDescription.textContent = topic.description;
  topicGoal.textContent = topic.goal;
  topicPoints.innerHTML = "";

  topic.points.forEach((point) => {
    const item = document.createElement("li");
    item.textContent = point;
    topicPoints.appendChild(item);
  });
}

if (tabs.length > 0) {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((button) => {
        button.classList.remove("is-active");
        button.setAttribute("aria-selected", "false");
      });

      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");
      renderTopic(tab.dataset.topic);
    });
  });

  renderTopic("frontend");
}

const storageKey = "studyfolio-learning-tasks";
const taskList = document.getElementById("task-list");
const taskForm = document.getElementById("task-form");
const taskResetButton = document.getElementById("task-reset-button");

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

function renderTasks() {
  if (!taskList) {
    return;
  }

  const tasks = loadTasks();
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "まだタスクがありません。今やっていることを追加してみてください。";
    taskList.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const article = document.createElement("article");
    article.className = "task-item";
    article.dataset.status = task.status;

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

    article.append(meta, title, note);
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
      title,
      status,
      note: note || "学習メモはこれから追記する予定です。"
    });

    saveTasks(tasks);
    taskForm.reset();
    renderTasks();
  });
}

if (taskResetButton) {
  taskResetButton.addEventListener("click", () => {
    saveTasks(defaultTasks);
    renderTasks();
  });
}

if (taskList) {
  renderTasks();
}

// Home Selector Tabs
const selectorTabs = document.querySelectorAll('.selector-tab');
selectorTabs.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-target');
    
    // Remove active class from all tabs
    selectorTabs.forEach(b => b.classList.remove('is-active'));
    // Add active class to clicked tab
    btn.classList.add('is-active');
    
    // Hide all panels
    document.querySelectorAll('.content-panel').forEach(p => p.classList.remove('is-active'));
    // Show target panel
    const targetPanel = document.getElementById(target);
    if (targetPanel) {
      targetPanel.classList.add('is-active');
    }
  });
});

// Set first tab as active on load
if (selectorTabs.length > 0) {
  selectorTabs[0].classList.add('is-active');
  const firstPanel = document.getElementById(selectorTabs[0].getAttribute('data-target'));
  if (firstPanel) {
    firstPanel.classList.add('is-active');
  }
}

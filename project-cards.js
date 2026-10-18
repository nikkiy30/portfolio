// Shared presentation only: no draft storage or management actions.
function createWorkPreview(project) {
  const type = ["site", "mobile", "ui", "notes"].includes(project.previewType) ? project.previewType : "site";

  if (project.image && project.image.src) {
    const preview = document.createElement("figure");
    preview.className = "work-preview work-photo";
    preview.setAttribute("aria-label", `${project.title}の紹介画像`);

    const image = document.createElement("img");
    image.src = project.image.src;
    image.alt = project.image.alt || `${project.title}の画面イメージ`;
    image.loading = "lazy";
    image.decoding = "async";

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

  const title = document.createElement(options.headingLevel || "h3");
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
    ["概要", project.purpose],
    ["使用技術", project.built],
    ["次に取り組むこと", project.next]
  ].filter(([, description]) => String(description || "").trim()).forEach(([term, description]) => {
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
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `${projectLink.label}（${project.title}・新しいタブで開く）`);
      link.textContent = projectLink.label;
      const iconName = /^github$/i.test(projectLink.label) ? "github" : /^(demo|website|web)$/i.test(projectLink.label) ? "web" : null;
      if (iconName) {
        const icon = document.createElement("img");
        icon.className = "link-icon";
        icon.src = `images/icon-${iconName}.svg`;
        icon.alt = "";
        icon.width = 18;
        icon.height = 18;
        link.prepend(icon);
      }
      links.appendChild(link);
    });
  }

  if (options.compact) body.appendChild(label);
  body.appendChild(title);
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

// Public pages read published data only. Developer tools use script.js locally.
const publicProjects = Array.isArray(window.portfolioProjects) ? window.portfolioProjects : [];
for (const link of document.querySelectorAll('[data-nav]')) {
  if (link.dataset.nav === document.body.dataset.page) link.setAttribute('aria-current', 'page');
}
const publicGrid = document.getElementById('portfolio-grid');
const featuredGrid = document.getElementById('selected-work-grid');
if (publicGrid) publicProjects.forEach((project,index) => publicGrid.appendChild(createWorkCard(project,index,{headingLevel:'h2'})));
if (featuredGrid) publicProjects.filter(project => Array.isArray(project.awards) && project.awards.length).forEach((project,index) => featuredGrid.appendChild(createWorkCard(project,index)));
const publicSearch = document.getElementById('portfolio-search');
function filterPublicProjects() {
  if (!publicGrid) return;
  const query = (publicSearch?.value || '').trim().toLocaleLowerCase('ja');
  let count = 0;
  for (const card of publicGrid.querySelectorAll('[data-work-card]')) {
    card.hidden = !((card.textContent + ' ' + (card.dataset.searchText || '')).toLocaleLowerCase('ja').includes(query));
    if (!card.hidden) count++;
  }
  const empty = document.getElementById('portfolio-empty');
  if (empty) empty.hidden = count > 0;
}
publicSearch?.addEventListener('input',filterPublicProjects);
filterPublicProjects();
// Public contact profiles are maintained in data/contact-links.js.
function renderContactLinks() {
  const list = document.getElementById("contact-links");
  if (!list) return;

  const contacts = Array.isArray(window.portfolioContacts) ? window.portfolioContacts : [];
  list.replaceChildren();
  contacts.forEach((contact) => {
    const label = String(contact?.label || "").trim();
    const url = String(contact?.url || "").trim();
    if (!label || !url) return;

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return;
    }
    if (parsedUrl.protocol !== "https:") return;

    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = parsedUrl.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `${label}（新しいタブで開く）`);
    if (contact.icon) {
      const frame = document.createElement("span");
      frame.className = "contact-icon-frame";
      const icon = document.createElement("img");
      icon.className = "link-icon";
      icon.src = contact.icon;
      icon.alt = "";
      icon.width = 18;
      icon.height = 18;
      frame.appendChild(icon);
      link.appendChild(frame);
    }
    const name = document.createElement("span");
    name.textContent = label;
    link.appendChild(name);
    item.appendChild(link);
    list.appendChild(item);
  });
  const container = list.closest("[data-contact]");
  if (container) container.hidden = list.children.length === 0;
}

renderContactLinks();

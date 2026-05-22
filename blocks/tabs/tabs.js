import { moveInstrumentation } from '../../scripts/scripts.js';

const TAB_DURATION = 6000;

function startAutoRotation(block) {
  const tabs = block.querySelectorAll('.tabs-tab');
  const panels = block.querySelectorAll('.tabs-panel');
  if (tabs.length === 0) return;

  let currentIdx = 0;
  let interval = null;

  function activateTab(idx) {
    tabs.forEach((t) => {
      t.classList.remove('tabs-tab-active');
      t.classList.remove('tabs-tab-filling');
    });
    panels.forEach((p) => p.classList.remove('tabs-panel-active'));
    tabs[idx].classList.add('tabs-tab-active');
    tabs[idx].classList.add('tabs-tab-filling');
    panels[idx].classList.add('tabs-panel-active');
    currentIdx = idx;
  }

  function nextTab() {
    const next = (currentIdx + 1) % tabs.length;
    activateTab(next);
  }

  function startInterval() {
    if (interval) clearInterval(interval);
    interval = setInterval(nextTab, TAB_DURATION);
  }

  tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => {
      activateTab(idx);
      startInterval();
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activateTab(0);
          startInterval();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.3 },
  );
  observer.observe(block);
}

export default function decorate(block) {
  const rows = [...block.children].filter((row) => row.textContent.trim() || row.querySelector('picture'));

  const tabBar = document.createElement('div');
  tabBar.className = 'tabs-bar';

  const panelContainer = document.createElement('div');
  panelContainer.className = 'tabs-panels';

  rows.forEach((row, idx) => {
    const cols = [...row.children];
    const imgCol = cols[0];
    const contentCol = cols[1];
    const img = imgCol?.querySelector('img');

    const tab = document.createElement('button');
    tab.className = 'tabs-tab';
    if (idx === 0) tab.classList.add('tabs-tab-active');

    if (img) {
      const tabImg = img.cloneNode(true);
      tabImg.className = 'tabs-tab-img';
      tab.append(tabImg);
    } else {
      tab.textContent = contentCol?.querySelector('h3')?.textContent || `Tab ${idx + 1}`;
    }

    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    if (idx === 0) panel.classList.add('tabs-panel-active');
    moveInstrumentation(row, panel);

    const panelInner = document.createElement('div');
    panelInner.className = 'tabs-panel-inner';

    const mainContent = document.createElement('div');
    mainContent.className = 'tabs-panel-main';

    const statsContent = document.createElement('div');
    statsContent.className = 'tabs-panel-stats';

    if (contentCol) {
      moveInstrumentation(contentCol, mainContent);
      const children = [...contentCol.children];
      let statsMode = false;

      children.forEach((el) => {
        const text = el.textContent.trim();
        const strong = el.querySelector('strong');
        if (strong && !el.querySelector('a') && !el.querySelector('h3')) {
          const val = strong.textContent.trim();
          const rest = text.replace(val, '').trim();
          if (rest && (val.includes('$') || val.includes('+') || /^\d/.test(val) || val.length < 20)) {
            statsMode = true;
            const stat = document.createElement('div');
            stat.className = 'tabs-stat';
            const statVal = document.createElement('div');
            statVal.className = 'tabs-stat-val';
            statVal.textContent = val;
            const statLabel = document.createElement('div');
            statLabel.className = 'tabs-stat-label';
            statLabel.textContent = rest;
            stat.append(statVal, statLabel);
            statsContent.append(stat);
            return;
          }
        }
        if (!statsMode) {
          mainContent.append(el);
        }
      });
    }

    panelInner.append(mainContent);
    if (statsContent.children.length > 0) panelInner.append(statsContent);
    panel.append(panelInner);

    tabBar.append(tab);
    panelContainer.append(panel);
  });

  block.textContent = '';
  block.append(tabBar, panelContainer);
  startAutoRotation(block);
}

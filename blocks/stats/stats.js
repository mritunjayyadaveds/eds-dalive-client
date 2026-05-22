import { moveInstrumentation } from '../../scripts/scripts.js';

function parseStatValue(text) {
  const prefix = text.match(/^[^0-9]*/)?.[0] || '';
  const suffix = text.match(/[^0-9]*$/)?.[0] || '';
  const numStr = text.replace(prefix, '').replace(suffix, '').replace(/,/g, '');
  const num = parseFloat(numStr) || 0;
  const hasDecimal = numStr.includes('.');
  return {
    prefix, suffix, num, hasDecimal,
  };
}

function formatNumber(num, hasDecimal) {
  if (hasDecimal) return num.toFixed(1);
  return Math.round(num).toLocaleString('en-US');
}

function animateValue(el, finalText) {
  const {
    prefix, suffix, num, hasDecimal,
  } = parseStatValue(finalText);
  if (num === 0) {
    el.textContent = finalText;
    return;
  }

  const duration = 1800;
  const steps = 40;
  const stepTime = duration / steps;
  let current = 0;
  let step = 0;

  const interval = setInterval(() => {
    step += 1;
    const progress = step / steps;
    const eased = 1 - (1 - progress) ** 3;
    current = num * eased;
    el.textContent = `${prefix}${formatNumber(current, hasDecimal)}${suffix}`;
    if (step >= steps) {
      clearInterval(interval);
      el.textContent = finalText;
    }
  }, stepTime);
}

export default function decorate(block) {
  const items = [...block.children].filter((row) => row.textContent.trim());

  const grid = document.createElement('div');
  grid.className = 'stats-grid';

  const animations = [];

  items.forEach((row) => {
    const cols = [...row.children];
    const value = cols[0]?.textContent?.trim() || '';
    const label = cols[1]?.textContent?.trim() || '';

    const stat = document.createElement('div');
    stat.className = 'stats-item';
    moveInstrumentation(row, stat);

    const valEl = document.createElement('div');
    valEl.className = 'stats-value';
    valEl.textContent = value;
    if (cols[0]) moveInstrumentation(cols[0], valEl);

    const labelEl = document.createElement('div');
    labelEl.className = 'stats-label';
    labelEl.textContent = label;
    if (cols[1]) moveInstrumentation(cols[1], labelEl);

    stat.append(valEl, labelEl);
    grid.append(stat);

    animations.push({ el: valEl, finalText: value });
  });

  block.textContent = '';
  block.append(grid);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animations.forEach(({ el, finalText }, i) => {
            setTimeout(() => animateValue(el, finalText), i * 150);
          });
          observer.disconnect();
        }
      });
    },
    { threshold: 0.3 },
  );
  observer.observe(block);
}

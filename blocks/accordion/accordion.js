import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const items = [...block.children].filter((row) => row.textContent.trim());

  const grid = document.createElement('div');
  grid.className = 'accordion-grid';

  items.forEach((row) => {
    const cols = [...row.children];
    const title = cols[0]?.textContent?.trim() || '';
    const body = cols[1]?.textContent?.trim() || '';

    const pillar = document.createElement('div');
    pillar.className = 'accordion-pillar';
    moveInstrumentation(row, pillar);

    const head = document.createElement('div');
    head.className = 'accordion-pillar-head';
    head.textContent = title;
    if (cols[0]) moveInstrumentation(cols[0], head);

    const reveal = document.createElement('div');
    reveal.className = 'accordion-pillar-reveal';
    const bodyP = document.createElement('p');
    bodyP.className = 'accordion-pillar-body';
    bodyP.textContent = body;
    if (cols[1]) moveInstrumentation(cols[1], bodyP);
    reveal.append(bodyP);

    pillar.append(head, reveal);
    grid.append(pillar);
  });

  block.textContent = '';
  block.append(grid);
}

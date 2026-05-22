import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function decorateColumns(nav) {
  const list = nav.querySelector('ul');
  if (!list) return null;

  const grid = document.createElement('div');
  grid.className = 'footer-grid';

  list.querySelectorAll(':scope > li').forEach((li) => {
    const col = document.createElement('div');
    col.className = 'footer-col';

    const heading = li.querySelector('strong');
    if (heading) {
      const headEl = document.createElement('h3');
      headEl.className = 'footer-col-heading';
      headEl.textContent = heading.textContent;
      col.append(headEl);
    }

    const subList = li.querySelector(':scope > ul');
    if (subList) {
      const linksContainer = document.createElement('ul');
      linksContainer.className = 'footer-col-links';
      subList.querySelectorAll('li').forEach((subLi) => {
        const link = subLi.querySelector('a');
        if (link) {
          const item = document.createElement('li');
          item.append(link);
          linksContainer.append(item);
        }
      });
      col.append(linksContainer);
    }

    grid.append(col);
  });

  return grid;
}

function decorateLegalBar(section) {
  const legal = document.createElement('div');
  legal.className = 'footer-legal';

  const paragraphs = section.querySelectorAll('p');
  if (paragraphs.length >= 1) {
    const linksBar = document.createElement('div');
    linksBar.className = 'footer-legal-links';
    const links = paragraphs[0].querySelectorAll('a');
    links.forEach((link) => {
      link.className = 'footer-legal-link';
      linksBar.append(link);
    });
    legal.append(linksBar);
  }

  if (paragraphs.length >= 2) {
    const copyright = document.createElement('div');
    copyright.className = 'footer-copyright';
    copyright.textContent = paragraphs[1].textContent;
    legal.append(copyright);
  }

  return legal;
}

export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  const sections = fragment.querySelectorAll(':scope .section');
  const navSection = sections[0];
  const legalSection = sections[1];

  if (navSection) {
    const grid = decorateColumns(navSection);
    if (grid) footer.append(grid);
  }

  if (legalSection) {
    const legal = decorateLegalBar(legalSection);
    footer.append(legal);
  }

  block.append(footer);
}

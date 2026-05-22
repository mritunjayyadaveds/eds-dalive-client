import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const DESKTOP_MQ = window.matchMedia('(min-width: 900px)');

function buildChevronSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '10');
  svg.setAttribute('height', '6');
  svg.setAttribute('viewBox', '0 0 10 6');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M1 1l4 4 4-4');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.8');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  return svg;
}

function closeAllDropdowns(navSections) {
  navSections.querySelectorAll('.nav-drop').forEach((drop) => {
    drop.setAttribute('aria-expanded', 'false');
    const trigger = drop.querySelector('.nav-drop-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

function toggleMenu(nav, forceState) {
  const expanded = forceState !== undefined
    ? forceState
    : nav.getAttribute('aria-expanded') !== 'true';
  const hamburger = nav.querySelector('.nav-hamburger');
  nav.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  hamburger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  hamburger.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  document.body.style.overflowY = expanded ? 'hidden' : '';

  if (!expanded) {
    const navSections = nav.querySelector('.nav-sections');
    if (navSections) closeAllDropdowns(navSections);
  }
}

function handleDropdownClick(e, li, navSections) {
  e.preventDefault();
  e.stopPropagation();
  const isExpanded = li.getAttribute('aria-expanded') === 'true';
  if (DESKTOP_MQ.matches) closeAllDropdowns(navSections);
  li.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
  const trigger = li.querySelector('.nav-drop-trigger');
  if (trigger) trigger.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
}

function handleDropdownKeyboard(e, li, navSections) {
  if (e.code === 'Enter' || e.code === 'Space') {
    e.preventDefault();
    handleDropdownClick(e, li, navSections);
  }
  if (e.code === 'Escape') {
    li.setAttribute('aria-expanded', 'false');
    const trigger = li.querySelector('.nav-drop-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  }
}

function decorateDropdown(li) {
  li.classList.add('nav-drop');
  li.setAttribute('aria-expanded', 'false');
  const trigger = li.querySelector(':scope > a');
  if (trigger) {
    trigger.classList.add('nav-drop-trigger');
    trigger.append(buildChevronSVG());
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
  }
  const subList = li.querySelector(':scope > ul');
  if (subList) {
    subList.classList.add('nav-dropdown');
    subList.setAttribute('role', 'menu');
  }
}

function setupStickyHeader(wrapper) {
  const progressBar = document.createElement('div');
  progressBar.className = 'nav-progress-bar';
  wrapper.append(progressBar);

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        wrapper.classList.toggle('nav-scrolled', window.scrollY > 10);
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
        progressBar.style.width = `${progress}%`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  const sections = [...fragment.querySelectorAll(':scope .section')];
  sections.forEach((section) => nav.append(section));

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  /* Brand */
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a');
    if (brandLink) {
      brandLink.className = 'nav-brand-link';
      brandLink.setAttribute('aria-label', 'SEI Home');
      const container = brandLink.closest('.button-container');
      if (container) container.className = '';
      if (!brandLink.querySelector('img')) {
        const logo = document.createElement('img');
        logo.src = '/media/sei-logo.svg';
        logo.alt = 'SEI';
        logo.className = 'nav-logo-img';
        brandLink.textContent = '';
        brandLink.append(logo);
      }
    }
  }

  /* Sections (nav links) */
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((li) => {
      if (li.querySelector('ul')) {
        decorateDropdown(li);
        const trigger = li.querySelector('.nav-drop-trigger');
        if (trigger) {
          trigger.addEventListener('click', (e) => handleDropdownClick(e, li, navSections));
          trigger.addEventListener('keydown', (e) => handleDropdownKeyboard(e, li, navSections));
        }
      }
    });
  }

  /* Tools (CTA area) */
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const links = navTools.querySelectorAll('a');
    links.forEach((link) => {
      link.className = '';
      const parent = link.closest('.button-container');
      if (parent) parent.className = '';
    });
    const allLinks = [...links];
    if (allLinks.length >= 1) allLinks[0].classList.add('nav-login');
    if (allLinks.length >= 2) allLinks[1].classList.add('nav-contact');
  }

  /* Hamburger */
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('type', 'button');
  hamburger.setAttribute('aria-controls', 'nav');
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span class="hamburger-line"></span>'
    + '<span class="hamburger-line"></span>'
    + '<span class="hamburger-line"></span>';
  hamburger.addEventListener('click', () => toggleMenu(nav));
  nav.append(hamburger);

  /* Event listeners */
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    if (DESKTOP_MQ.matches) {
      if (navSections) closeAllDropdowns(navSections);
    } else if (nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
    }
  });

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && DESKTOP_MQ.matches && navSections) {
      closeAllDropdowns(navSections);
    }
  });

  DESKTOP_MQ.addEventListener('change', () => {
    if (DESKTOP_MQ.matches && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, false);
    }
    if (navSections) closeAllDropdowns(navSections);
  });

  /* Assemble */
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
  setupStickyHeader(navWrapper);
}

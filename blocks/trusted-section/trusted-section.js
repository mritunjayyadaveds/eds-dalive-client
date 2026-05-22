function setupRevealObserver(block) {
  const pillars = block.querySelectorAll('.trusted-pillar');
  if (!pillars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('sei-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

  pillars.forEach((pillar, index) => {
    pillar.style.transitionDelay = `${index * 0.12}s`;
    observer.observe(pillar);
  });

  const sectionHeader = block.querySelector('.trusted-header');
  if (sectionHeader) {
    const headerObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          sectionHeader.classList.add('sei-revealed');
          headerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    headerObserver.observe(sectionHeader);
  }
}

export default function decorate(block) {
  const rows = [...block.children];
  block.textContent = '';

  /* First row: eyebrow, headline, description */
  const headerRow = rows[0];
  const headerCells = headerRow ? [...headerRow.children] : [];

  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'trusted-header sei-reveal';

  if (headerCells[0]) {
    const eyebrow = document.createElement('div');
    eyebrow.className = 'trusted-eyebrow';
    eyebrow.textContent = headerCells[0].textContent.trim();
    sectionHeader.append(eyebrow);
  }

  if (headerCells[1]) {
    const headline = document.createElement('h2');
    headline.className = 'trusted-headline';
    headline.textContent = headerCells[1].textContent.trim();
    sectionHeader.append(headline);
  }

  if (headerCells[2]) {
    const desc = document.createElement('p');
    desc.className = 'trusted-description';
    desc.textContent = headerCells[2].textContent.trim();
    sectionHeader.append(desc);
  }

  block.append(sectionHeader);

  /* Remaining rows: pillar cards */
  const grid = document.createElement('div');
  grid.className = 'trusted-grid';

  rows.slice(1).forEach((row) => {
    const cells = [...row.children];
    const pillar = document.createElement('div');
    pillar.className = 'trusted-pillar sei-reveal';

    const pillarHead = document.createElement('div');
    pillarHead.className = 'trusted-pillar-head';
    pillarHead.textContent = cells[0] ? cells[0].textContent.trim() : '';

    const pillarBody = document.createElement('div');
    pillarBody.className = 'trusted-pillar-body';

    if (cells[1]) {
      const picture = cells[1].querySelector('picture');
      if (picture) {
        const iconWrap = document.createElement('div');
        iconWrap.className = 'trusted-pillar-icon';
        iconWrap.append(picture);
        pillar.append(iconWrap);
      }
    }

    if (cells[2]) {
      pillarBody.innerHTML = `<p>${cells[2].textContent.trim()}</p>`;
    } else if (cells[1] && !cells[1].querySelector('picture')) {
      pillarBody.innerHTML = `<p>${cells[1].textContent.trim()}</p>`;
    }

    pillar.append(pillarHead);
    pillar.append(pillarBody);
    grid.append(pillar);
  });

  block.append(grid);
  setupRevealObserver(block);
}

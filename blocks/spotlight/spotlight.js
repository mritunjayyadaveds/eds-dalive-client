import { moveInstrumentation } from '../../scripts/scripts.js';

function getVideoId(url) {
  if (!url) return '';
  if (url.includes('youtu.be/')) {
    const [id] = url.split('youtu.be/')[1].split(/[?&]/);
    return id;
  }
  if (url.includes('youtube.com/watch')) {
    try {
      return new URL(url).searchParams.get('v') || '';
    } catch (e) {
      return '';
    }
  }
  if (url.includes('youtube.com/embed/')) {
    const [id] = url.split('youtube.com/embed/')[1].split(/[?&]/);
    return id;
  }
  return '';
}

function extractVideoUrl(row) {
  // Check for YouTube link as <a> tag
  const ytLink = row.querySelector('a[href*="youtube"], a[href*="youtu.be"]');
  if (ytLink) return ytLink.href;

  // Check text content for YouTube URL (xwalk renders field as text)
  const cols = [...row.children];
  const textCol = cols.find((col) => {
    const text = col.textContent.trim();
    return text.includes('youtube.com') || text.includes('youtu.be');
  });
  if (textCol) return textCol.textContent.trim();

  return '';
}

function buildPlayButton() {
  const btn = document.createElement('button');
  btn.className = 'spotlight-card-play';
  btn.setAttribute('aria-label', 'Play video');
  btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true"><polygon points="5,3 19,12 5,21"></polygon></svg>';
  return btn;
}

function buildVideoModal() {
  const overlay = document.createElement('div');
  overlay.className = 'spotlight-video-modal';
  overlay.innerHTML = `
    <div class="spotlight-video-modal-content">
      <button class="spotlight-video-modal-close" aria-label="Close video">&times;</button>
      <div class="spotlight-video-modal-player"></div>
    </div>
  `;

  overlay.querySelector('.spotlight-video-modal-close').addEventListener('click', () => {
    overlay.classList.remove('spotlight-video-modal-active');
    overlay.querySelector('.spotlight-video-modal-player').innerHTML = '';
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('spotlight-video-modal-active');
      overlay.querySelector('.spotlight-video-modal-player').innerHTML = '';
    }
  });

  return overlay;
}

function openVideoModal(modal, videoId) {
  const player = modal.querySelector('.spotlight-video-modal-player');
  player.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title="YouTube video"></iframe>`;
  modal.classList.add('spotlight-video-modal-active');
}

function initCarousel(track) {
  let isDown = false;
  let startX;
  let scrollLeft;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    track.classList.add('spotlight-grabbing');
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  track.addEventListener('mouseleave', () => {
    isDown = false;
    track.classList.remove('spotlight-grabbing');
  });

  track.addEventListener('mouseup', () => {
    isDown = false;
    track.classList.remove('spotlight-grabbing');
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.5;
    track.scrollLeft = scrollLeft - walk;
  });
}

function initReveal(block) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          block.classList.add('sei-revealed');
          observer.disconnect();
        }
      });
    },
    { threshold: 0.1 },
  );
  observer.observe(block);
  setTimeout(() => {
    if (!block.classList.contains('sei-revealed')) {
      block.classList.add('sei-revealed');
    }
  }, 300);
}

export default function decorate(block) {
  const rows = [...block.children];

  block.textContent = '';
  block.classList.add('sei-reveal');

  let eyebrowRow = null;
  let headlineEl = null;
  let descRow = null;
  const cardData = [];

  rows.forEach((row) => {
    const cols = [...row.children];
    const picture = row.querySelector('picture');
    const h2 = row.querySelector('h2');
    const h1 = row.querySelector('h1');

    if (picture) {
      const videoUrl = extractVideoUrl(row);
      let label = '';
      cols.forEach((col) => {
        const text = col.textContent.trim();
        if (text && !text.includes('youtube.com') && !text.includes('youtu.be') && !col.querySelector('picture')) {
          label = text;
        }
      });
      cardData.push({
        picture, label, row, videoUrl,
      });
    } else if (h2 || h1) {
      headlineEl = h2 || h1;
    } else {
      const text = cols[1]?.textContent?.trim() || cols[0]?.textContent?.trim();
      if (!text) return;
      if (text.includes('youtube.com') || text.includes('youtu.be')) return;
      if (text.includes('undefined') || row.querySelector('a[href*="undefined"]')) return;
      if (!eyebrowRow && !headlineEl && text.length < 60) {
        eyebrowRow = row;
      } else if (!descRow) {
        descRow = row;
      }
    }
  });

  const eyebrow = document.createElement('div');
  eyebrow.className = 'spotlight-eyebrow';
  if (eyebrowRow) {
    const ebCol = eyebrowRow.children[1] || eyebrowRow.children[0];
    eyebrow.textContent = ebCol?.textContent?.trim() || '';
    moveInstrumentation(eyebrowRow, eyebrow);
  }
  block.append(eyebrow);

  if (headlineEl) {
    headlineEl.className = 'spotlight-headline';
    block.append(headlineEl);
  }

  if (descRow) {
    const desc = document.createElement('p');
    desc.className = 'spotlight-body';
    const descCol = descRow.children[1] || descRow.children[0];
    desc.textContent = descCol?.textContent?.trim() || '';
    moveInstrumentation(descRow, desc);
    block.append(desc);
  }

  if (cardData.length > 0) {
    const modal = buildVideoModal();
    block.append(modal);

    const outer = document.createElement('div');
    outer.className = 'spotlight-carousel-outer';
    const track = document.createElement('div');
    track.className = 'spotlight-carousel-track';

    cardData.forEach((card, i) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'spotlight-card';
      if (i === 0) cardEl.classList.add('spotlight-card--active');
      if (card.row) moveInstrumentation(card.row, cardEl);

      const img = card.picture.querySelector('img');
      if (img) {
        img.className = 'spotlight-card-img';
        img.setAttribute('loading', 'lazy');
      }
      cardEl.append(card.picture);

      const overlay = document.createElement('div');
      overlay.className = 'spotlight-card-overlay';
      cardEl.append(overlay);

      const playBtn = buildPlayButton();
      cardEl.append(playBtn);

      const videoId = getVideoId(card.videoUrl);
      if (videoId) {
        cardEl.dataset.videoId = videoId;
        cardEl.classList.add('spotlight-card-has-video');
      }

      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = cardEl.dataset.videoId;
        if (id) openVideoModal(modal, id);
      });

      cardEl.addEventListener('click', () => {
        const id = cardEl.dataset.videoId;
        if (id) openVideoModal(modal, id);
      });

      if (card.label) {
        const label = document.createElement('span');
        label.className = 'spotlight-card-label';
        label.textContent = card.label;
        cardEl.append(label);
      }

      track.append(cardEl);
    });

    outer.append(track);
    block.append(outer);
    initCarousel(track);
  }

  initReveal(block);
}

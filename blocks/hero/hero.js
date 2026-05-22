function animateHero(block) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          block.classList.add('hero-visible');
          observer.disconnect();
        }
      });
    },
    { threshold: 0.15 },
  );
  observer.observe(block);
}

function wrapHeadlineWords(h1) {
  if (!h1) return;
  const text = h1.textContent.trim();
  const words = text.split(/\s+/);
  h1.textContent = '';
  words.forEach((word, i) => {
    const outer = document.createElement('span');
    outer.className = 'hero-word-wrap';
    const inner = document.createElement('span');
    inner.className = 'hero-word';
    inner.textContent = word;
    inner.style.animationDelay = `${280 + i * 68}ms`;
    outer.append(inner);
    h1.append(outer);
    if (i < words.length - 1) h1.append(' ');
  });
}

function buildGridOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'hero-grid-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  return overlay;
}

function resolveVideoUrl(src) {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  if (src.includes('/content/dam/')) {
    const filename = src.split('/').pop();
    return `/media/${filename}`;
  }
  return src;
}

function findVideoSource(block) {
  const mp4Link = block.querySelector('a[href$=".mp4"]');
  if (mp4Link) return resolveVideoUrl(mp4Link.getAttribute('href'));

  const linkMatch = [...block.querySelectorAll('a')].find(
    (link) => link.href && link.href.includes('.mp4'),
  );
  if (linkMatch) return resolveVideoUrl(linkMatch.getAttribute('href'));

  const existingVideo = block.querySelector('video');
  if (existingVideo) return existingVideo.src || existingVideo.querySelector('source')?.src;

  const rows = [...block.children];
  const textMatch = rows.find((row) => {
    const text = row.textContent.trim();
    return text.includes('.mp4') && !row.querySelector('h1, h2, h3');
  });
  if (textMatch) {
    const text = textMatch.textContent.trim();
    const match = text.match(/(\/[^\s]+\.mp4)/);
    if (match) return resolveVideoUrl(match[1]);
    if (text.startsWith('http')) return text;
    return resolveVideoUrl(text);
  }

  return null;
}

export default function decorate(block) {
  const rows = [...block.children];
  const videoSrc = findVideoSource(block);
  const hasImage = block.querySelector('picture');

  let picture = null;
  let video = null;

  let contentRow = null;

  rows.forEach((row) => {
    if (row.querySelector('h1') || row.querySelector('h2')) {
      contentRow = row;
    }
  });

  if (!contentRow) contentRow = rows[rows.length - 1] || rows[0];

  if (videoSrc) {
    video = document.createElement('video');
    video.className = 'hero-bg-video';
    video.src = videoSrc;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
  } else if (hasImage) {
    picture = block.querySelector('picture');
  }

  const eyebrow = contentRow?.querySelector('p:first-child');
  const h1 = contentRow?.querySelector('h1') || block.querySelector('h1');
  const allContent = [...(contentRow?.querySelectorAll('p, h1, h2, h3') || [])];

  block.textContent = '';

  if (video || picture) {
    const mediaWrapper = document.createElement('div');
    mediaWrapper.className = 'hero-media';
    mediaWrapper.setAttribute('aria-hidden', 'true');
    mediaWrapper.append(video || picture);
    block.append(mediaWrapper);
  }

  block.append(buildGridOverlay());

  const content = document.createElement('div');
  content.className = 'hero-content';

  if (eyebrow && eyebrow !== h1 && !eyebrow.querySelector('a')) {
    const eyebrowEl = document.createElement('div');
    eyebrowEl.className = 'hero-eyebrow hero-fade-up';
    eyebrowEl.style.animationDelay = '80ms';
    eyebrowEl.textContent = eyebrow.textContent;
    content.append(eyebrowEl);
  }

  if (h1) {
    h1.className = 'hero-headline';
    wrapHeadlineWords(h1);
    content.append(h1);
  }

  const ctaItems = allContent.filter(
    (el) => el !== eyebrow && el !== h1 && el.querySelector('a'),
  );
  const descItems = allContent.filter(
    (el) => el !== eyebrow && el !== h1 && !el.querySelector('a'),
  );
  descItems.forEach((desc, i) => {
    desc.className = 'hero-description hero-fade-up';
    desc.style.animationDelay = `${836 + i * 100}ms`;
    content.append(desc);
  });

  if (ctaItems.length > 0) {
    const ctaContainer = document.createElement('div');
    ctaContainer.className = 'hero-cta-group hero-fade-up';
    ctaContainer.style.animationDelay = '976ms';
    ctaItems.forEach((item) => {
      const link = item.querySelector('a');
      if (link) {
        link.className = 'hero-cta hero-cta-primary';
        ctaContainer.append(link);
      }
    });
    content.append(ctaContainer);
  }

  block.append(content);
  animateHero(block);
}

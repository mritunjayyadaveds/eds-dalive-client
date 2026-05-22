const getDefaultEmbed = (url) => `<iframe src="${url.href}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen allow="encrypted-media" title="Content from ${url.hostname}" loading="lazy"></iframe>`;

const getYouTubeEmbed = (url) => {
  const vid = new URLSearchParams(url.search).get('v') || url.pathname.split('/').pop();
  return `<iframe src="https://www.youtube.com/embed/${vid}?rel=0" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title="YouTube video" loading="lazy"></iframe>`;
};

const getVimeoEmbed = (url) => {
  const vid = url.pathname.split('/').pop();
  return `<iframe src="https://player.vimeo.com/video/${vid}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen allow="autoplay; fullscreen; picture-in-picture" title="Vimeo video" loading="lazy"></iframe>`;
};

const EMBEDS = {
  youtube: getYouTubeEmbed,
  youtu: getYouTubeEmbed,
  vimeo: getVimeoEmbed,
};

function getEmbed(url) {
  const hostname = url.hostname.replace('www.', '');
  const key = Object.keys(EMBEDS).find((k) => hostname.includes(k));
  return key ? EMBEDS[key](url) : getDefaultEmbed(url);
}

export default function decorate(block) {
  const link = block.querySelector('a')?.href;
  if (!link) return;

  const url = new URL(link);
  block.innerHTML = `<div class="embed-container">${getEmbed(url)}</div>`;
}

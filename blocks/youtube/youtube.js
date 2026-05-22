function getVideoId(url) {
  if (!url) return '';
  if (url.includes('youtu.be/')) {
    const [id] = url.split('youtu.be/')[1].split(/[?&]/);
    return id;
  }
  if (url.includes('youtube.com/watch')) {
    return new URL(url).searchParams.get('v') || '';
  }
  if (url.includes('youtube.com/embed/')) {
    const [id] = url.split('youtube.com/embed/')[1].split(/[?&]/);
    return id;
  }
  return '';
}

export default function decorate(block) {
  const link = block.querySelector('a');
  const textContent = block.textContent.trim();

  const url = link ? link.href : textContent;
  const videoId = getVideoId(url);

  if (!videoId) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'youtube-player';

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
  iframe.setAttribute('title', 'YouTube video');
  iframe.loading = 'lazy';

  wrapper.append(iframe);
  block.textContent = '';
  block.append(wrapper);
}

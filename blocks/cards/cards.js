import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });

    const imageDiv = li.querySelector('.cards-card-image');
    const bodyDiv = li.querySelector('.cards-card-body');

    if (imageDiv && bodyDiv) {
      const paragraphs = bodyDiv.querySelectorAll(':scope > p');
      // p[0] = badge (Podcast/Article), p[1] = name, p[2] = role, p[3] = category, last = excerpt
      if (paragraphs.length >= 3) {
        const badge = paragraphs[0];
        const name = paragraphs[1];
        const role = paragraphs[2];

        badge.classList.add('cards-badge');
        name.classList.add('cards-person-name');
        role.classList.add('cards-person-role');

        imageDiv.append(badge);
        imageDiv.append(name);
        imageDiv.append(role);
      }

      const remainingPs = bodyDiv.querySelectorAll(':scope > p');
      if (remainingPs.length >= 1) remainingPs[0].classList.add('cards-category');
      if (remainingPs.length >= 2) remainingPs[remainingPs.length - 1].classList.add('cards-excerpt');
    }

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);
}

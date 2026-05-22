import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // Check for background image (authored via Universal Editor)
  const bgImage = block.querySelector('picture img, img[src*="/content/dam"]');
  if (bgImage) {
    const section = block.closest('.section');
    if (section) {
      section.style.backgroundImage = `url('${bgImage.src}')`;
      section.style.backgroundSize = 'cover';
      section.style.backgroundPosition = 'center';
      section.style.backgroundRepeat = 'no-repeat';
    }
    bgImage.closest('picture')?.remove();
    bgImage.remove();
  }

  const row = block.children[0];
  const cols = [...(row?.children || [])];
  const label = cols[0]?.textContent?.trim() || 'Email';
  const btnText = cols[1]?.textContent?.trim() || 'Subscribe';

  const form = document.createElement('div');
  form.className = 'subscribe-form';
  if (row) moveInstrumentation(row, form);

  const labelEl = document.createElement('label');
  labelEl.className = 'subscribe-label';
  labelEl.textContent = label;
  labelEl.setAttribute('for', 'subscribe-email');
  if (cols[0]) moveInstrumentation(cols[0], labelEl);

  const input = document.createElement('input');
  input.className = 'subscribe-input';
  input.type = 'email';
  input.id = 'subscribe-email';
  input.placeholder = 'yourname@company.com';

  const btn = document.createElement('button');
  btn.className = 'subscribe-btn';
  btn.innerHTML = `${btnText} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>`;
  if (cols[1]) moveInstrumentation(cols[1], btn);

  const legal = document.createElement('p');
  legal.className = 'subscribe-legal';
  legal.textContent = 'By subscribing, you agree to receive marketing emails from SEI. Unsubscribe at any time.';

  form.append(labelEl, input, btn, legal);
  block.textContent = '';
  block.append(form);
}

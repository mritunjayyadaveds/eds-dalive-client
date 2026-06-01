import {
  getUserRole,
  getUserProfile,
  submitPublishRequest,
} from './workflow-utils.js';

function createModal(title, content, actions) {
  const overlay = document.createElement('div');
  overlay.className = 'workflow-modal-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';

  const modal = document.createElement('div');
  modal.className = 'workflow-modal';
  modal.style.cssText = 'background:#fff;border-radius:8px;padding:24px;max-width:480px;width:90%;box-shadow:0 4px 24px rgba(0,0,0,0.2);font-family:Adobe Clean,sans-serif;';

  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.style.cssText = 'margin:0 0 16px;font-size:18px;color:#1a1a1a;';

  const contentEl = document.createElement('div');
  contentEl.style.cssText = 'margin-bottom:20px;';
  if (typeof content === 'string') {
    contentEl.innerHTML = content;
  } else {
    contentEl.appendChild(content);
  }

  const actionsEl = document.createElement('div');
  actionsEl.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;';
  actions.forEach(({ label, primary, onClick }) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = `padding:8px 16px;border-radius:4px;border:1px solid ${primary ? '#1473e6' : '#ccc'};background:${primary ? '#1473e6' : '#fff'};color:${primary ? '#fff' : '#333'};cursor:pointer;font-size:14px;`;
    btn.addEventListener('click', () => {
      overlay.remove();
      if (onClick) onClick();
    });
    actionsEl.appendChild(btn);
  });

  modal.append(titleEl, contentEl, actionsEl);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  return overlay;
}

async function requestPublishAction() {
  const role = await getUserRole();

  if (role === 'approver') {
    createModal(
      'Direct Publish Available',
      '<p style="color:#555;font-size:14px;">You have approver permissions. You can publish directly using the standard Publish button.</p>',
      [{ label: 'OK', primary: true }],
    );
    return;
  }

  if (role !== 'author') {
    createModal(
      'Access Denied',
      '<p style="color:#d32f2f;font-size:14px;">You do not have permission to request publishing. Please contact your administrator.</p>',
      [{ label: 'Close', primary: true }],
    );
    return;
  }

  const profile = await getUserProfile();
  const authorEmail = profile?.email || 'unknown';
  const currentPath = new URL(window.location.href).pathname
    .replace('/edit/', '/')
    .replace(`/${window.location.hostname.split('--')[2]}`, '')
    || window.location.pathname;

  const form = document.createElement('div');
  form.innerHTML = `
    <p style="color:#555;font-size:14px;margin:0 0 12px;">
      You are requesting to publish:<br>
      <strong style="color:#1a1a1a;">${currentPath}</strong>
    </p>
    <label style="display:block;font-size:13px;color:#666;margin-bottom:4px;">Comment (optional):</label>
    <textarea id="workflow-comment" style="width:100%;height:60px;border:1px solid #ddd;border-radius:4px;padding:8px;font-size:13px;resize:vertical;" placeholder="Describe what changed..."></textarea>
  `;

  createModal(
    'Request Publish',
    form,
    [
      { label: 'Cancel' },
      {
        label: 'Submit Request',
        primary: true,
        onClick: async () => {
          const comment = document.getElementById('workflow-comment')?.value || '';
          try {
            await submitPublishRequest({
              path: currentPath,
              author: authorEmail,
              comment,
            });
            createModal(
              'Request Submitted',
              '<p style="color:#2e7d32;font-size:14px;">Your publish request has been submitted successfully. An approver will review it shortly.</p>',
              [{ label: 'OK', primary: true }],
            );
          } catch (err) {
            createModal(
              'Error',
              `<p style="color:#d32f2f;font-size:14px;">Failed to submit request: ${err.message}</p>`,
              [{ label: 'Close', primary: true }],
            );
          }
        },
      },
    ],
  );
}

export default async function decorate(container, _data, sk) {
  const btn = document.createElement('button');
  btn.textContent = 'Request Publish';
  btn.title = 'Submit a publish request for approval';
  btn.style.cssText = 'background:#1473e6;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:13px;font-weight:500;';
  btn.addEventListener('click', requestPublishAction);
  container.appendChild(btn);
}

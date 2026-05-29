const OWNER = 'mritunjayyadaveds';
const REPO = 'eds-dalive-client';
const QUEUE_SHEET_PATH = 'publish-queue';

async function daFetch(url, options = {}) {
  const resp = await fetch(url, { ...options, credentials: 'include' });
  return resp;
}

export async function fetchQueue() {
  const resp = await fetch(
    `https://content.da.live/${OWNER}/${REPO}/${QUEUE_SHEET_PATH}.json`,
  );
  if (!resp.ok) return [];
  const json = await resp.json();
  return json.data || [];
}

async function saveQueue(data) {
  const blob = new Blob(
    [JSON.stringify({ data })],
    { type: 'application/json' },
  );

  const formData = new FormData();
  formData.append('data', blob, `${QUEUE_SHEET_PATH}.json`);

  const resp = await daFetch(
    `https://admin.da.live/source/${OWNER}/${REPO}/${QUEUE_SHEET_PATH}.json`,
    { method: 'PUT', body: formData },
  );
  return resp.ok;
}

export async function addToQueue(entry) {
  const queue = await fetchQueue();
  queue.push(entry);
  return saveQueue(queue);
}

export async function approveRequest(queue, index) {
  queue[index].status = 'approved';
  queue[index].reviewedBy = 'admin';
  queue[index].reviewedAt = new Date().toISOString();
  return saveQueue(queue);
}

export async function rejectRequest(queue, index) {
  queue[index].status = 'rejected';
  queue[index].reviewedBy = 'admin';
  queue[index].reviewedAt = new Date().toISOString();
  return saveQueue(queue);
}

function renderDashboard(container, queue) {
  const pending = queue.filter((r) => r.status === 'pending');
  const history = queue.filter((r) => r.status !== 'pending');

  container.innerHTML = `
    <style>
      .approval-dashboard { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; }
      .approval-dashboard h1 { font-size: 24px; margin: 0 0 8px; }
      .approval-dashboard .subtitle { color: #6b7280; margin: 0 0 24px; font-size: 14px; }
      .approval-dashboard h2 { font-size: 18px; margin: 24px 0 12px; }
      .approval-table { width: 100%; border-collapse: collapse; font-size: 14px; }
      .approval-table th, .approval-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
      .approval-table th { font-weight: 600; background: #f9fafb; }
      .approval-btn { padding: 6px 14px; font-size: 13px; font-weight: 600; border: none; border-radius: 4px; cursor: pointer; }
      .approval-btn.approve { background: #059669; color: #fff; }
      .approval-btn.approve:hover { background: #047857; }
      .approval-btn.reject { background: #dc2626; color: #fff; margin-left: 6px; }
      .approval-btn.reject:hover { background: #b91c1c; }
      .status-badge { padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; }
      .status-badge.approved { background: #d1fae5; color: #065f46; }
      .status-badge.rejected { background: #fee2e2; color: #991b1b; }
      .status-badge.pending { background: #fef3c7; color: #92400e; }
      .empty-state { color: #6b7280; font-style: italic; padding: 20px 0; }
      .refresh-btn { padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
      .refresh-btn:hover { background: #1d4ed8; }
      .login-notice { background: #fef3c7; border: 1px solid #fcd34d; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; }
      .login-notice a { color: #2563eb; }
    </style>
    <div class="approval-dashboard">
      <h1>Publish Approval Dashboard</h1>
      <p class="subtitle">Review and approve content publish requests</p>
      <div class="login-notice">
        You must be logged into <a href="https://da.live" target="_blank">DA Live</a> for approve/reject to work.
      </div>
      <button class="refresh-btn" id="refresh-queue">Refresh Queue</button>

      <h2>Pending Requests (${pending.length})</h2>
      ${pending.length === 0 ? '<p class="empty-state">No pending requests.</p>' : `
      <table class="approval-table">
        <thead><tr><th>Page</th><th>Requested By</th><th>Date</th><th>Reason</th><th>Actions</th></tr></thead>
        <tbody>
          ${pending.map((r, i) => `
          <tr>
            <td><a href="https://da.live/edit#/${OWNER}/${REPO}${r.page}" target="_blank">${r.page}</a></td>
            <td>${r.requestedBy}</td>
            <td>${r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : ''}</td>
            <td>${r.reason || ''}</td>
            <td>
              <button class="approval-btn approve" data-index="${i}" data-action="approve">Approve</button>
              <button class="approval-btn reject" data-index="${i}" data-action="reject">Reject</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`}

      <h2>History</h2>
      ${history.length === 0 ? '<p class="empty-state">No history yet.</p>' : `
      <table class="approval-table">
        <thead><tr><th>Page</th><th>Requested By</th><th>Status</th><th>Reviewed At</th></tr></thead>
        <tbody>
          ${history.slice(0, 20).map((r) => `
          <tr>
            <td>${r.page}</td>
            <td>${r.requestedBy}</td>
            <td><span class="status-badge ${r.status}">${r.status}</span></td>
            <td>${r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>`}
    </div>
  `;

  container.querySelector('#refresh-queue').addEventListener('click', async () => {
    const freshQueue = await fetchQueue();
    renderDashboard(container, freshQueue);
  });

  container.querySelectorAll('.approval-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      const action = e.target.dataset.action;
      const fullIndex = queue.indexOf(pending[idx]);

      e.target.disabled = true;
      e.target.textContent = '...';

      let success;
      if (action === 'approve') {
        success = await approveRequest(queue, fullIndex);
      } else {
        success = await rejectRequest(queue, fullIndex);
      }

      if (success) {
        renderDashboard(container, queue);
      } else {
        e.target.disabled = false;
        e.target.textContent = action === 'approve' ? 'Approve' : 'Reject';
        // eslint-disable-next-line no-alert
        alert('Action failed. Make sure you are logged into da.live');
      }
    });
  });
}

export async function renderRequestForm(container, pagePath, userEmail) {
  container.innerHTML = `
    <style>
      .request-form { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 24px; }
      .request-form h3 { margin: 0 0 16px; font-size: 20px; }
      .request-form label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; }
      .request-form textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; min-height: 80px; resize: vertical; box-sizing: border-box; }
      .request-form .submit-btn { margin-top: 12px; padding: 10px 20px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
      .request-form .submit-btn:hover { background: #1d4ed8; }
      .request-form .submit-btn:disabled { background: #9ca3af; cursor: not-allowed; }
      .request-form .success { color: #059669; font-weight: 600; margin-top: 12px; }
      .request-form .error { color: #dc2626; font-weight: 600; margin-top: 12px; }
      .request-form .login-notice { background: #fef3c7; border: 1px solid #fcd34d; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; }
      .request-form .login-notice a { color: #2563eb; }
    </style>
    <div class="request-form">
      <h3>Request Publish: ${pagePath}</h3>
      <div class="login-notice">
        You must be logged into <a href="https://da.live" target="_blank">DA Live</a> for this to work.
      </div>
      <label for="publish-reason">Reason for publishing:</label>
      <textarea id="publish-reason" placeholder="Describe your changes (min 10 characters)..."></textarea>
      <button class="submit-btn" id="submit-request">Submit Request</button>
      <div id="request-status"></div>
    </div>
  `;

  container.querySelector('#submit-request').addEventListener('click', async () => {
    const reason = container.querySelector('#publish-reason').value.trim();
    const statusEl = container.querySelector('#request-status');
    const btn = container.querySelector('#submit-request');

    if (reason.length < 10) {
      statusEl.className = 'error';
      statusEl.textContent = 'Reason must be at least 10 characters.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const entry = {
      page: pagePath,
      requestedBy: userEmail || 'unknown',
      requestedAt: new Date().toISOString(),
      reason,
      status: 'pending',
      reviewedBy: '',
      reviewedAt: '',
    };

    const success = await addToQueue(entry);
    if (success) {
      statusEl.className = 'success';
      statusEl.textContent = 'Publish request submitted! An admin will review it.';
      btn.textContent = 'Submitted';
    } else {
      statusEl.className = 'error';
      statusEl.textContent = 'Failed to submit. Make sure you are logged into da.live';
      btn.disabled = false;
      btn.textContent = 'Submit Request';
    }
  });
}

export async function initDashboard(container) {
  const queue = await fetchQueue();
  renderDashboard(container, queue);
}

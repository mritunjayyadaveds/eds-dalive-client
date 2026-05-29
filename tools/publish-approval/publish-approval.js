const OWNER = 'mritunjayyadaveds';
const REPO = 'eds-dalive-client';
const QUEUE_PATH = 'publish-queue';
const DA_ADMIN = 'https://admin.da.live';
const DA_CONTENT = `https://content.da.live/${OWNER}/${REPO}`;

let authToken = null;

async function login() {
  if (authToken) return authToken;

  const stored = localStorage.getItem('da-publish-token');
  if (stored) {
    authToken = stored;
    const test = await fetch(`${DA_ADMIN}/list/${OWNER}/${REPO}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (test.ok) return authToken;
    localStorage.removeItem('da-publish-token');
    authToken = null;
  }

  return null;
}

async function startLogin() {
  const loginWindow = window.open(
    'https://da.live',
    'da-login',
    'width=600,height=700',
  );

  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      try {
        if (loginWindow.closed) {
          clearInterval(interval);
          const token = localStorage.getItem('da-publish-token');
          authToken = token;
          resolve(token);
        }
      } catch (e) {
        // cross-origin, ignore
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      resolve(null);
    }, 120000);
  });
}

function getTokenFromUrl() {
  const hash = window.location.hash;
  if (hash && hash.includes('token=')) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('token');
    if (token) {
      localStorage.setItem('da-publish-token', token);
      authToken = token;
      window.location.hash = '';
      return token;
    }
  }
  return null;
}

async function initAuth() {
  getTokenFromUrl();
  if (authToken) return authToken;
  return login();
}

async function daFetchAuth(url, options = {}) {
  const headers = { ...options.headers || {} };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return fetch(url, { ...options, headers, credentials: 'include' });
}

export async function fetchQueue() {
  const resp = await fetch(`${DA_CONTENT}/${QUEUE_PATH}.json`);
  if (!resp.ok) return [];
  const json = await resp.json();
  return json.data || [];
}

async function saveQueue(data) {
  const body = JSON.stringify({ data });

  const resp = await daFetchAuth(
    `${DA_ADMIN}/source/${OWNER}/${REPO}/${QUEUE_PATH}.json`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    },
  );

  return resp.ok;
}

export async function addToQueue(entry) {
  const queue = await fetchQueue();
  queue.push(entry);
  return saveQueue(queue);
}

function renderLoginButton(container, onLogin) {
  container.innerHTML = `
    <style>
      .login-box { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 60px auto; text-align: center; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; }
      .login-box h2 { margin: 0 0 12px; font-size: 20px; }
      .login-box p { color: #6b7280; font-size: 14px; margin: 0 0 24px; }
      .login-box .btn { padding: 12px 24px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
      .login-box .btn:hover { background: #1d4ed8; }
      .login-box input { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; margin-bottom: 12px; }
      .login-box label { display: block; text-align: left; font-size: 13px; font-weight: 500; margin-bottom: 4px; }
      .login-box .help { font-size: 12px; color: #9ca3af; margin-top: 16px; }
    </style>
    <div class="login-box">
      <h2>DA Live Authentication</h2>
      <p>Enter your DA Live auth token to continue.</p>
      <label for="token-input">Auth Token:</label>
      <input type="password" id="token-input" placeholder="Paste your DA Live token here...">
      <button class="btn" id="login-btn">Connect</button>
      <p class="help">
        To get your token: Open <a href="https://da.live" target="_blank">da.live</a> →
        Open DevTools (F12) → Application → Cookies → Copy the value of the "auth_token" cookie.
      </p>
    </div>
  `;

  container.querySelector('#login-btn').addEventListener('click', () => {
    const token = container.querySelector('#token-input').value.trim();
    if (token) {
      localStorage.setItem('da-publish-token', token);
      authToken = token;
      onLogin();
    }
  });
}

function renderDashboard(container, queue) {
  const pending = queue.filter((r) => r.status === 'pending');
  const history = queue.filter((r) => r.status !== 'pending');

  container.innerHTML = `
    <style>
      .ad { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 24px; }
      .ad h1 { font-size: 24px; margin: 0 0 8px; }
      .ad .subtitle { color: #6b7280; margin: 0 0 24px; font-size: 14px; }
      .ad h2 { font-size: 18px; margin: 24px 0 12px; }
      .ad table { width: 100%; border-collapse: collapse; font-size: 14px; }
      .ad th, .ad td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
      .ad th { font-weight: 600; background: #f9fafb; }
      .ad .btn { padding: 6px 14px; font-size: 13px; font-weight: 600; border: none; border-radius: 4px; cursor: pointer; }
      .ad .btn-approve { background: #059669; color: #fff; }
      .ad .btn-approve:hover { background: #047857; }
      .ad .btn-reject { background: #dc2626; color: #fff; margin-left: 6px; }
      .ad .btn-reject:hover { background: #b91c1c; }
      .ad .badge { padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; }
      .ad .badge-approved { background: #d1fae5; color: #065f46; }
      .ad .badge-rejected { background: #fee2e2; color: #991b1b; }
      .ad .empty { color: #6b7280; font-style: italic; padding: 20px 0; }
      .ad .toolbar { display: flex; gap: 8px; margin-bottom: 16px; }
      .ad .refresh { padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
      .ad .refresh:hover { background: #1d4ed8; }
      .ad .logout { padding: 8px 16px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 13px; }
    </style>
    <div class="ad">
      <h1>Publish Approval Dashboard</h1>
      <p class="subtitle">Review and approve content publish requests</p>
      <div class="toolbar">
        <button class="refresh" id="refresh-queue">Refresh Queue</button>
        <button class="logout" id="logout-btn">Logout</button>
      </div>

      <h2>Pending Requests (${pending.length})</h2>
      ${pending.length === 0 ? '<p class="empty">No pending requests.</p>' : `
      <table>
        <thead><tr><th>Page</th><th>Requested By</th><th>Date</th><th>Reason</th><th>Actions</th></tr></thead>
        <tbody>
          ${pending.map((r, i) => `
          <tr>
            <td><a href="https://da.live/edit#/${OWNER}/${REPO}${r.page}" target="_blank">${r.page}</a></td>
            <td>${r.requestedBy || ''}</td>
            <td>${r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : ''}</td>
            <td>${r.reason || ''}</td>
            <td>
              <button class="btn btn-approve" data-idx="${i}">Approve</button>
              <button class="btn btn-reject" data-idx="${i}">Reject</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`}

      <h2>History</h2>
      ${history.length === 0 ? '<p class="empty">No history yet.</p>' : `
      <table>
        <thead><tr><th>Page</th><th>Requested By</th><th>Status</th><th>Reviewed At</th></tr></thead>
        <tbody>
          ${history.slice(0, 20).map((r) => `
          <tr>
            <td>${r.page}</td>
            <td>${r.requestedBy || ''}</td>
            <td><span class="badge badge-${r.status}">${r.status}</span></td>
            <td>${r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>`}
    </div>
  `;

  container.querySelector('#refresh-queue').addEventListener('click', async () => {
    container.innerHTML = '<p style="padding:40px;text-align:center;color:#6b7280;">Loading...</p>';
    const freshQueue = await fetchQueue();
    renderDashboard(container, freshQueue);
  });

  container.querySelector('#logout-btn').addEventListener('click', () => {
    localStorage.removeItem('da-publish-token');
    authToken = null;
    window.location.reload();
  });

  container.querySelectorAll('.btn-approve').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const idx = parseInt(e.target.dataset.idx, 10);
      const fullIdx = queue.indexOf(pending[idx]);
      e.target.disabled = true;
      e.target.textContent = '...';
      queue[fullIdx].status = 'approved';
      queue[fullIdx].reviewedBy = 'admin';
      queue[fullIdx].reviewedAt = new Date().toISOString();
      const ok = await saveQueue(queue);
      if (ok) {
        renderDashboard(container, queue);
      } else {
        e.target.disabled = false;
        e.target.textContent = 'Approve';
        // eslint-disable-next-line no-alert
        alert('Failed. Token may be expired — try logging out and re-entering.');
      }
    });
  });

  container.querySelectorAll('.btn-reject').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const idx = parseInt(e.target.dataset.idx, 10);
      const fullIdx = queue.indexOf(pending[idx]);
      e.target.disabled = true;
      e.target.textContent = '...';
      queue[fullIdx].status = 'rejected';
      queue[fullIdx].reviewedBy = 'admin';
      queue[fullIdx].reviewedAt = new Date().toISOString();
      const ok = await saveQueue(queue);
      if (ok) {
        renderDashboard(container, queue);
      } else {
        e.target.disabled = false;
        e.target.textContent = 'Reject';
        // eslint-disable-next-line no-alert
        alert('Failed. Token may be expired — try logging out and re-entering.');
      }
    });
  });
}

export async function renderRequestForm(container, pagePath, userEmail) {
  const token = await initAuth();
  if (!token) {
    renderLoginButton(container, () => renderRequestForm(container, pagePath, userEmail));
    return;
  }

  container.innerHTML = `
    <style>
      .rf { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 24px; }
      .rf h3 { margin: 0 0 16px; font-size: 20px; }
      .rf label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; }
      .rf textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; min-height: 80px; resize: vertical; box-sizing: border-box; }
      .rf .btn { margin-top: 12px; padding: 10px 20px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
      .rf .btn:hover { background: #1d4ed8; }
      .rf .btn:disabled { background: #9ca3af; cursor: not-allowed; }
      .rf .success { color: #059669; font-weight: 600; margin-top: 12px; }
      .rf .error { color: #dc2626; font-weight: 600; margin-top: 12px; }
      .rf .connected { background: #d1fae5; color: #065f46; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; }
    </style>
    <div class="rf">
      <h3>Request Publish: ${pagePath}</h3>
      <div class="connected">Connected to DA Live</div>
      <label for="publish-reason">Reason for publishing:</label>
      <textarea id="publish-reason" placeholder="Describe your changes (min 10 characters)..."></textarea>
      <button class="btn" id="submit-request">Submit Request</button>
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
      statusEl.textContent = 'Failed. Token may be expired — reload the page and try again.';
      btn.disabled = false;
      btn.textContent = 'Submit Request';
    }
  });
}

export async function initDashboard(container) {
  const token = await initAuth();
  if (!token) {
    renderLoginButton(container, () => initDashboard(container));
    return;
  }
  const queue = await fetchQueue();
  renderDashboard(container, queue);
}

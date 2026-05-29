const OWNER = 'mritunjayyadaveds';
const REPO = 'eds-dalive-client';
const QUEUE_SHEET_URL = `https://da.live/sheet#/${OWNER}/${REPO}/publish-queue`;
const QUEUE_JSON_URL = `https://content.da.live/${OWNER}/${REPO}/publish-queue.json`;

export async function fetchQueue() {
  const resp = await fetch(QUEUE_JSON_URL);
  if (!resp.ok) return [];
  const json = await resp.json();
  return json.data || [];
}

function renderDashboard(container, queue) {
  const pending = queue.filter((r) => r.status === 'pending');
  const approved = queue.filter((r) => r.status === 'approved');
  const rejected = queue.filter((r) => r.status === 'rejected');

  container.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; }
      .ad { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 960px; margin: 0 auto; padding: 32px 24px; }
      .ad h1 { font-size: 24px; margin: 0 0 4px; }
      .ad .subtitle { color: #6b7280; margin: 0 0 24px; font-size: 14px; }
      .ad h2 { font-size: 16px; margin: 20px 0 10px; color: #374151; }
      .ad table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
      .ad th, .ad td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
      .ad th { font-weight: 600; background: #f9fafb; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
      .ad .badge { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; display: inline-block; }
      .ad .badge-pending { background: #fef3c7; color: #92400e; }
      .ad .badge-approved { background: #d1fae5; color: #065f46; }
      .ad .badge-rejected { background: #fee2e2; color: #991b1b; }
      .ad .empty { color: #9ca3af; font-style: italic; padding: 16px 0; font-size: 14px; }
      .ad .toolbar { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
      .ad .btn { padding: 10px 18px; font-size: 13px; font-weight: 600; border: none; border-radius: 6px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
      .ad .btn-primary { background: #2563eb; color: #fff; }
      .ad .btn-primary:hover { background: #1d4ed8; }
      .ad .btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
      .ad .btn-secondary:hover { background: #e5e7eb; }
      .ad .stats { display: flex; gap: 16px; margin-bottom: 24px; }
      .ad .stat { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 20px; flex: 1; text-align: center; }
      .ad .stat-num { font-size: 28px; font-weight: 700; }
      .ad .stat-num.pending { color: #d97706; }
      .ad .stat-num.approved { color: #059669; }
      .ad .stat-num.rejected { color: #dc2626; }
      .ad .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
      .ad .info { background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #1e40af; margin-bottom: 20px; }
      .ad .info a { color: #1d4ed8; font-weight: 600; }
    </style>
    <div class="ad">
      <h1>Publish Approval Dashboard</h1>
      <p class="subtitle">Manage content publish requests for eds-dalive-client</p>

      <div class="info">
        To <strong>approve</strong> or <strong>reject</strong> a request, open the
        <a href="${QUEUE_SHEET_URL}" target="_blank">publish-queue sheet</a>
        and change the <code>status</code> column from "pending" to "approved" or "rejected".
      </div>

      <div class="toolbar">
        <button class="btn btn-primary" id="refresh-queue">Refresh</button>
        <a class="btn btn-secondary" href="${QUEUE_SHEET_URL}" target="_blank">Open Queue Sheet</a>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-num pending">${pending.length}</div>
          <div class="stat-label">Pending</div>
        </div>
        <div class="stat">
          <div class="stat-num approved">${approved.length}</div>
          <div class="stat-label">Approved</div>
        </div>
        <div class="stat">
          <div class="stat-num rejected">${rejected.length}</div>
          <div class="stat-label">Rejected</div>
        </div>
      </div>

      <h2>Pending Requests</h2>
      ${pending.length === 0 ? '<p class="empty">No pending requests.</p>' : `
      <table>
        <thead><tr><th>Page</th><th>Requested By</th><th>Date</th><th>Reason</th><th>Status</th></tr></thead>
        <tbody>
          ${pending.map((r) => `
          <tr>
            <td><a href="https://da.live/edit#/${OWNER}/${REPO}${r.page}" target="_blank">${r.page}</a></td>
            <td>${r.requestedBy || ''}</td>
            <td>${r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : ''}</td>
            <td>${r.reason || ''}</td>
            <td><span class="badge badge-pending">pending</span></td>
          </tr>`).join('')}
        </tbody>
      </table>`}

      <h2>Recent History</h2>
      ${[...approved, ...rejected].length === 0 ? '<p class="empty">No history yet.</p>' : `
      <table>
        <thead><tr><th>Page</th><th>Requested By</th><th>Status</th><th>Reviewed At</th></tr></thead>
        <tbody>
          ${[...approved, ...rejected].slice(0, 15).map((r) => `
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
    container.innerHTML = '<p style="padding:40px;text-align:center;color:#6b7280;font-family:sans-serif;">Loading...</p>';
    const freshQueue = await fetchQueue();
    renderDashboard(container, freshQueue);
  });
}

export async function renderRequestForm(container, pagePath, userEmail) {
  container.innerHTML = `
    <style>
      * { box-sizing: border-box; }
      .rf { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; padding: 32px 24px; }
      .rf h3 { margin: 0 0 8px; font-size: 22px; }
      .rf .page-path { color: #6b7280; font-size: 14px; margin: 0 0 24px; font-family: monospace; background: #f3f4f6; padding: 6px 10px; border-radius: 4px; display: inline-block; }
      .rf .info { background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #1e40af; margin-bottom: 20px; }
      .rf .info a { color: #1d4ed8; font-weight: 600; }
      .rf label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 6px; }
      .rf textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; min-height: 80px; resize: vertical; }
      .rf .fields { margin-bottom: 16px; }
      .rf .field { margin-bottom: 12px; }
      .rf input { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
      .rf .btn { padding: 12px 24px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
      .rf .btn:hover { background: #1d4ed8; }
      .rf .copy-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-top: 16px; }
      .rf .copy-box p { margin: 0 0 8px; font-size: 13px; color: #6b7280; }
      .rf .copy-box code { font-size: 12px; word-break: break-all; background: #fff; padding: 8px; display: block; border: 1px solid #e5e7eb; border-radius: 4px; }
    </style>
    <div class="rf">
      <h3>Request Publish</h3>
      <div class="page-path">${pagePath}</div>

      <div class="info">
        To submit a request, open the
        <a href="${QUEUE_SHEET_URL}" target="_blank">publish-queue sheet</a>
        and add a new row with your request details.
      </div>

      <p style="font-size:14px;color:#374151;margin:0 0 16px;">Copy these values and paste into the sheet:</p>

      <div class="copy-box">
        <p><strong>page:</strong></p>
        <code id="val-page">${pagePath}</code>
        <p style="margin-top:8px;"><strong>requestedBy:</strong></p>
        <code id="val-by">${userEmail}</code>
        <p style="margin-top:8px;"><strong>requestedAt:</strong></p>
        <code id="val-date">${new Date().toISOString()}</code>
        <p style="margin-top:8px;"><strong>status:</strong></p>
        <code>pending</code>
      </div>

      <div style="margin-top:20px;">
        <a class="btn" href="${QUEUE_SHEET_URL}" target="_blank">Open Queue Sheet to Submit</a>
      </div>
    </div>
  `;
}

export async function initDashboard(container) {
  const queue = await fetchQueue();
  renderDashboard(container, queue);
}

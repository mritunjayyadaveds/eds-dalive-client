import {
  getUserRole,
  getUserProfile,
  fetchApprovalRequests,
  updateRequestStatus,
  publishPage,
} from './workflow-utils.js';

function createDashboardModal(requests, approverEmail) {
  const overlay = document.createElement('div');
  overlay.className = 'workflow-dashboard-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';

  const modal = document.createElement('div');
  modal.className = 'workflow-dashboard';
  modal.style.cssText = 'background:#fff;border-radius:8px;padding:24px;max-width:720px;width:95%;max-height:80vh;overflow-y:auto;box-shadow:0 4px 24px rgba(0,0,0,0.2);font-family:Adobe Clean,sans-serif;';

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;';
  header.innerHTML = `
    <h3 style="margin:0;font-size:18px;color:#1a1a1a;">Approval Dashboard</h3>
    <button id="workflow-close-dash" style="background:none;border:none;font-size:20px;cursor:pointer;color:#666;">&times;</button>
  `;

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const historyRequests = requests.filter((r) => r.status !== 'pending');

  const content = document.createElement('div');

  if (pendingRequests.length === 0) {
    content.innerHTML = '<p style="color:#666;font-size:14px;text-align:center;padding:20px;">No pending publish requests.</p>';
  } else {
    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';
    table.innerHTML = `
      <thead>
        <tr style="background:#f5f5f5;text-align:left;">
          <th style="padding:10px;border-bottom:2px solid #e0e0e0;">Page</th>
          <th style="padding:10px;border-bottom:2px solid #e0e0e0;">Author</th>
          <th style="padding:10px;border-bottom:2px solid #e0e0e0;">Comment</th>
          <th style="padding:10px;border-bottom:2px solid #e0e0e0;">Requested</th>
          <th style="padding:10px;border-bottom:2px solid #e0e0e0;">Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    pendingRequests.forEach((req, idx) => {
      const row = document.createElement('tr');
      row.style.cssText = 'border-bottom:1px solid #eee;';
      const requestDate = req.requestedAt
        ? new Date(req.requestedAt).toLocaleDateString()
        : 'N/A';

      row.innerHTML = `
        <td style="padding:10px;"><a href="${req.path}" style="color:#1473e6;text-decoration:none;">${req.path}</a></td>
        <td style="padding:10px;">${req.author || 'Unknown'}</td>
        <td style="padding:10px;color:#666;max-width:150px;overflow:hidden;text-overflow:ellipsis;">${req.comment || '-'}</td>
        <td style="padding:10px;">${requestDate}</td>
        <td style="padding:10px;">
          <button class="workflow-approve-btn" data-index="${idx}" data-path="${req.path}" style="background:#2e7d32;color:#fff;border:none;border-radius:3px;padding:5px 10px;cursor:pointer;font-size:12px;margin-right:6px;">Approve & Publish</button>
          <button class="workflow-reject-btn" data-index="${idx}" data-path="${req.path}" style="background:#d32f2f;color:#fff;border:none;border-radius:3px;padding:5px 10px;cursor:pointer;font-size:12px;">Reject</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    content.appendChild(table);
  }

  if (historyRequests.length > 0) {
    const historySection = document.createElement('div');
    historySection.style.cssText = 'margin-top:24px;padding-top:16px;border-top:1px solid #e0e0e0;';
    historySection.innerHTML = `<h4 style="margin:0 0 12px;font-size:14px;color:#666;">Recent History</h4>`;

    const historyList = document.createElement('div');
    historyRequests.slice(-5).reverse().forEach((req) => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:12px;';
      const statusColor = req.status === 'approved' ? '#2e7d32' : '#d32f2f';
      item.innerHTML = `
        <span style="color:#333;">${req.path}</span>
        <span style="color:${statusColor};font-weight:500;">${req.status}</span>
      `;
      historyList.appendChild(item);
    });
    historySection.appendChild(historyList);
    content.appendChild(historySection);
  }

  modal.append(header, content);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.querySelector('#workflow-close-dash').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelectorAll('.workflow-approve-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const path = e.target.dataset.path;
      const rowIdx = parseInt(e.target.dataset.index, 10) + 2;
      e.target.textContent = 'Publishing...';
      e.target.disabled = true;

      try {
        await publishPage(path);
        await updateRequestStatus({
          rowIndex: rowIdx,
          status: 'approved',
          approver: approverEmail,
        });
        overlay.remove();
        showNotification('Page published and request approved!', 'success');
      } catch (err) {
        e.target.textContent = 'Failed';
        showNotification(`Error: ${err.message}`, 'error');
      }
    });
  });

  overlay.querySelectorAll('.workflow-reject-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const rowIdx = parseInt(e.target.dataset.index, 10) + 2;
      e.target.textContent = 'Rejecting...';
      e.target.disabled = true;

      try {
        await updateRequestStatus({
          rowIndex: rowIdx,
          status: 'rejected',
          approver: approverEmail,
        });
        overlay.remove();
        showNotification('Request rejected.', 'info');
      } catch (err) {
        e.target.textContent = 'Failed';
        showNotification(`Error: ${err.message}`, 'error');
      }
    });
  });
}

function showNotification(message, type) {
  const colors = { success: '#2e7d32', error: '#d32f2f', info: '#1473e6' };
  const notif = document.createElement('div');
  notif.style.cssText = `position:fixed;top:20px;right:20px;background:${colors[type] || '#333'};color:#fff;padding:12px 20px;border-radius:6px;font-size:14px;z-index:10001;font-family:Adobe Clean,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,0.2);`;
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 4000);
}

async function openDashboard() {
  const role = await getUserRole();

  if (role !== 'approver') {
    showNotification('Only approvers can access the dashboard.', 'error');
    return;
  }

  const profile = await getUserProfile();
  const approverEmail = profile?.email || 'approver';
  const requests = await fetchApprovalRequests();
  createDashboardModal(requests, approverEmail);
}

export default async function decorate(container, _data, sk) {
  const role = await getUserRole();

  const btn = document.createElement('button');
  btn.textContent = 'Approvals';
  btn.title = 'View and manage publish approval requests';
  btn.style.cssText = 'background:#6b21a8;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-size:13px;font-weight:500;';
  btn.addEventListener('click', openDashboard);

  if (role !== 'approver') {
    btn.style.display = 'none';
  }

  const badge = document.createElement('span');
  badge.className = 'workflow-badge';
  badge.style.cssText = 'display:none;position:absolute;top:-4px;right:-4px;background:#d32f2f;color:#fff;border-radius:50%;width:16px;height:16px;font-size:10px;line-height:16px;text-align:center;';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;display:inline-block;';
  wrapper.append(btn, badge);
  container.appendChild(wrapper);

  if (role === 'approver') {
    const requests = await fetchApprovalRequests();
    const pending = requests.filter((r) => r.status === 'pending');
    if (pending.length > 0) {
      badge.textContent = pending.length > 9 ? '9+' : pending.length;
      badge.style.display = 'block';
    }
  }
}

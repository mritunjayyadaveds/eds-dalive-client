const DALIVE_ORIGIN = 'https://admin.da.live';
const ORG = 'mritunjayyadaveds';
const REPO = 'eds-dalive-client';
const APPROVAL_SHEET_PATH = '/approval-requests';

async function getDAToken() {
  const { token } = await window.aem?.getToken?.() || {};
  if (token) return token;
  const imsToken = window?.adobeIMS?.getAccessToken?.()?.token;
  return imsToken || null;
}

async function getUserProfile() {
  const token = await getDAToken();
  if (!token) return null;
  try {
    const resp = await fetch(`${DALIVE_ORIGIN}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resp.ok) return resp.json();
  } catch (e) { /* silent */ }
  return null;
}

const ROLE_MAP = {
  'jatin.patel2@ibm.com': 'author',
  'mritunjay.yadav@ibm.com': 'approver',
};

async function getUserRole() {
  const profile = await getUserProfile();
  if (!profile || !profile.email) return 'anonymous';
  const email = profile.email.toLowerCase();
  return ROLE_MAP[email] || 'viewer';
}

async function fetchApprovalRequests() {
  const token = await getDAToken();
  try {
    const resp = await fetch(
      `https://main--${REPO}--${ORG}.aem.live${APPROVAL_SHEET_PATH}.json`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    );
    if (resp.ok) {
      const json = await resp.json();
      return json.data || [];
    }
  } catch (e) { /* silent */ }
  return [];
}

async function submitPublishRequest({ path, author, comment }) {
  const token = await getDAToken();
  if (!token) throw new Error('Not authenticated');

  const existing = await fetchApprovalRequests();
  const nextRow = existing.length + 2;

  const now = new Date().toISOString();
  const rowData = {
    path,
    author,
    status: 'pending',
    requestedAt: now,
    comment: comment || '',
    approvedBy: '',
    approvedAt: '',
  };

  const body = new FormData();
  body.append('data', JSON.stringify(rowData));

  const resp = await fetch(
    `${DALIVE_ORIGIN}/source/${ORG}/${REPO}${APPROVAL_SHEET_PATH}.json`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    },
  );

  if (!resp.ok) throw new Error(`Failed to submit request: ${resp.status}`);
  return { success: true, row: nextRow };
}

async function updateRequestStatus({ rowIndex, status, approver }) {
  const token = await getDAToken();
  if (!token) throw new Error('Not authenticated');

  const now = new Date().toISOString();
  const updateData = {
    status,
    approvedBy: approver,
    approvedAt: now,
  };

  const body = new FormData();
  body.append('data', JSON.stringify(updateData));
  body.append('row', rowIndex.toString());

  const resp = await fetch(
    `${DALIVE_ORIGIN}/source/${ORG}/${REPO}${APPROVAL_SHEET_PATH}.json`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    },
  );

  if (!resp.ok) throw new Error(`Failed to update request: ${resp.status}`);
  return { success: true };
}

async function publishPage(path) {
  const token = await getDAToken();
  if (!token) throw new Error('Not authenticated');

  const resp = await fetch(
    `${DALIVE_ORIGIN}/preview/${ORG}/${REPO}${path}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!resp.ok) throw new Error(`Failed to publish: ${resp.status}`);

  const liveResp = await fetch(
    `${DALIVE_ORIGIN}/live/${ORG}/${REPO}${path}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!liveResp.ok) throw new Error(`Failed to go live: ${liveResp.status}`);
  return { success: true };
}

export {
  getDAToken,
  getUserProfile,
  getUserRole,
  fetchApprovalRequests,
  submitPublishRequest,
  updateRequestStatus,
  publishPage,
  ORG,
  REPO,
  APPROVAL_SHEET_PATH,
};

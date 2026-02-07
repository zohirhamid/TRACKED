const API_BASE = '/api/v1';
 
let accessToken = localStorage.getItem('access_token');
let refreshToken = localStorage.getItem('refresh_token');
 
export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}
 
export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}
 
export function isAuthenticated() {
  return !!accessToken;
}
 
async function refreshAccessToken() {
  const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });
 
  if (!res.ok) {
    clearTokens();
    throw new Error('Session expired');
  }
 
  const data = await res.json();
  accessToken = data.access;
  localStorage.setItem('access_token', data.access);
  return data.access;
}
 
async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
 
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
 
  let res = await fetch(url, { ...options, headers });
 
  // If 401, try refreshing the token once
  if (res.status === 401 && refreshToken) {
    try {
      await refreshAccessToken();
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(url, { ...options, headers });
    } catch {
      throw new Error('Session expired');
    }
  }
 
  return res;
}
 
// Auth
export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
 
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Login failed');
  }
 
  const data = await res.json();
  setTokens(data.access, data.refresh);
  return data;
}
 
// Tracker API
export async function fetchMonthData(year, month) {
  const res = await apiFetch(`${API_BASE}/tracker/month/${year}/${month}/`);
  if (!res.ok) throw new Error('Failed to fetch month data');
  return res.json();
}
 
export async function createTracker(trackerData) {
  const res = await apiFetch(`${API_BASE}/tracker/trackers/create/`, {
    method: 'POST',
    body: JSON.stringify(trackerData),
  });
  if (!res.ok) throw new Error('Failed to create tracker');
  return res.json();
}
 
export async function updateTracker(id, trackerData) {
  const res = await apiFetch(`${API_BASE}/tracker/trackers/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(trackerData),
  });
  if (!res.ok) throw new Error('Failed to update tracker');
  return res.json();
}
 
export async function deleteTracker(id) {
  const res = await apiFetch(`${API_BASE}/tracker/trackers/${id}/delete/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete tracker');
}
 
export async function saveEntry(trackerId, date, valueData) {
  const res = await apiFetch(`${API_BASE}/tracker/entries/`, {
    method: 'POST',
    body: JSON.stringify({ tracker_id: trackerId, date, ...valueData }),
  });
  if (!res.ok) throw new Error('Failed to save entry');
  return res.json();
}
 
export async function deleteEntry(trackerId, date) {
  const res = await apiFetch(`${API_BASE}/tracker/entries/`, {
    method: 'POST',
    body: JSON.stringify({ tracker_id: trackerId, date, delete_entry: true }),
  });
  if (!res.ok) throw new Error('Failed to delete entry');
  return res.json();
}
 
// Insights API
export async function fetchLatestInsight(reportType) {
  const res = await apiFetch(`${API_BASE}/insights/latest/${reportType}/`);
  if (!res.ok) throw new Error('Failed to fetch insight');
  return res.json();
}
 
export async function generateInsight(reportType) {
  const res = await apiFetch(`${API_BASE}/insights/generate/${reportType}/`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to generate insight');
  return res.json();
}
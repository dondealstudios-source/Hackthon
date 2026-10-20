let organizerToken: string | null = null;

async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (/^\/api\/admin(?:\/|$)/.test(path) && organizerToken) headers.set('Authorization', `Bearer ${organizerToken}`);
  const response = await fetch(path, { ...options, headers, credentials: 'omit', cache: 'no-store' });
  if (response.status === 401 && path.startsWith('/api/admin/')) organizerToken = null;
  return response;
}

export async function api(path: string, data?: unknown, method = 'POST') {
  try {
    const response = await request(path, data === undefined ? undefined : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
    if (path === '/api/admin/login') organizerToken = typeof result.sessionToken === 'string' ? result.sessionToken : null;
    return result;
  } finally { if (path === '/api/admin/logout') organizerToken = null; }
}

export async function downloadAdminExport(kind: string) {
  if (!['waitlist', 'registrations', 'questions'].includes(kind)) throw new Error('Invalid export type.');
  const response = await request(`/api/admin/export?kind=${encodeURIComponent(kind)}`);
  if (!response.ok) { const result = await response.json(); throw new Error(result.error || 'Export unavailable.'); }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a'); link.href = url; link.download = `buildfeast-${kind}.csv`; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

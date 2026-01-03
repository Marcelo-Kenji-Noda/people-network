const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? (undefined as T) : await res.json();
}

export async function getPeople() {
  return request<any[]>('/api/people');
}

export async function createPerson(body: { name: string; context: string | null; source: 'manual' | 'contacts' }) {
  return request<any>('/api/people', { method: 'POST', body: JSON.stringify(body) });
}

export async function updatePerson(id: string, body: { name?: string; context?: string | null; source?: 'manual' | 'contacts' }) {
  return request<any>(`/api/people/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deletePerson(id: string) {
  return request<void>(`/api/people/${id}`, { method: 'DELETE' });
}

export async function saveInteraction(date: string, personIds: string[]) {
  return request<any>('/api/interactions', { method: 'POST', body: JSON.stringify({ date, personIds }) });
}

export async function getInteractionPeople(date: string) {
  return request<any[]>(`/api/interactions/${encodeURIComponent(date)}/people`);
}

export async function removeInteractionPerson(date: string, personId: string) {
  return request<void>(`/api/interactions/${encodeURIComponent(date)}/people/${encodeURIComponent(personId)}`,
    { method: 'DELETE' }
  );
}

export async function getStats(params: { filter: 'all' | 'year' | 'month'; period?: string }) {
  const q = new URLSearchParams();
  q.set('filter', params.filter);
  if (params.period) q.set('period', params.period);
  return request<any>(`/api/stats?${q.toString()}`);
}

// Groups API
export async function getGroups() {
  return request<any[]>('/api/groups');
}

export async function createGroup(body: { group_name: string; color?: string }) {
  return request<any>('/api/groups', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateGroup(id: string, body: { group_name?: string; color?: string }) {
  return request<any>(`/api/groups/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function deleteGroup(id: string) {
  return request<void>(`/api/groups/${id}`, { method: 'DELETE' });
}

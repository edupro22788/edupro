'use client';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

export async function api<T = unknown>(
  method: string,
  url: string,
  body?: unknown | FormData,
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(url, { method, headers, body: payload });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return { ok: false, status: res.status, error: data?.error || 'حدث خطأ غير متوقع' };
  }
  return { ok: true, data: data as T };
}

export function apiGet<T>(url: string) {
  return api<T>('GET', url);
}
export function apiPost<T>(url: string, body?: unknown | FormData) {
  return api<T>('POST', url, body);
}
export function apiPatch<T>(url: string, body?: unknown) {
  return api<T>('PATCH', url, body);
}
export function apiDelete<T>(url: string) {
  return api<T>('DELETE', url);
}
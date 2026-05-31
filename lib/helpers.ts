export async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;

    try {
      const data = await res.json();
      message = data?.error || data?.message || message;
    } catch {
      try {
        message = await res.text();
      } catch { }
    }

    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

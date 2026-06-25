// Klien API tipis ke backend NestJS. Base URL dari env (NEXT_PUBLIC_API_URL).
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

const TOKEN_KEY = "crm_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean; // sertakan Bearer token
};

// Upload 1 gambar ke backend (multipart) → balas { url }. Bukan JSON, jadi
// pakai FormData (jangan set Content-Type; browser yang atur boundary).
export async function uploadImage(
  file: File,
  folder?: string,
): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  const token = getToken();
  const q = folder ? `?folder=${encodeURIComponent(folder)}` : "";
  const res = await fetch(`${BASE_URL}/admin/uploads${q}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data?.error?.message ?? data?.message ?? `Upload gagal (${res.status})`;
    throw new ApiError(res.status, Array.isArray(message) ? message[0] : message);
  }
  return data as { url: string };
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Backend membungkus error sebagai { success:false, error } di mana `error`
    // bisa berupa objek { message } (HttpException biasa) atau string langsung
    // (mis. ThrottlerException 429). Tangani keduanya.
    const rawErr = data?.error;
    const message =
      (typeof rawErr === "string" ? rawErr : rawErr?.message) ??
      data?.message ??
      `Request gagal (${res.status})`;
    throw new ApiError(res.status, Array.isArray(message) ? message[0] : message);
  }

  return data as T;
}

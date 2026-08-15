import { API_BASE_URL } from "../config";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `API ${options?.method ?? "GET"} ${path} failed (${res.status}): ${body}`,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  /**
   * POSTs a file as the raw request body, with the file's own MIME type.
   *
   * Not `post` with a JSON wrapper: base64 in JSON inflates the payload by a
   * third and the worker would have to decode it back. Not multipart either —
   * the backend accepts both, and raw bytes are the shape with nothing in
   * between the file and S3. `Content-Type` is set explicitly to override the
   * `application/json` default in `request`, which the worker would otherwise
   * store as the object's type.
   */
  upload: <T>(path: string, file: File) =>
    request<T>(path, {
      method: "POST",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    }),
};

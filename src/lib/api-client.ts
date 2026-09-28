export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function withWorkspace(workspaceId: string, init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set('X-Workspace-Id', workspaceId);
  return { ...init, headers };
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...init, headers });
  
  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {
      errorMsg = response.statusText || errorMsg;
    }
     throw new ApiError(errorMsg, response.status);
  }

  // Handle empty bodies (e.g. 204 No Content or just empty response)
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  
  return JSON.parse(text) as T;
}

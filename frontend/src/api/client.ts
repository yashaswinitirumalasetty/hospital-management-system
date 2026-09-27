const BASE_URL = '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const apiClient = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('hospital_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.error || 'An unexpected error occurred.', response.status, data);
  }

  return data as T;
};

import { appParams } from '../lib/app-params';

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (appParams.token) {
    headers.Authorization = `Bearer ${appParams.token}`;
  }
  return headers;
};

const request = async (path, options = {}) => {
  const response = await fetch(`${appParams.appBaseUrl}${path}`, {
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
};

export const authClient = {
  me: async () => request('/auth/me'),
};
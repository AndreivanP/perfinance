const DEFAULT_API_BASE_URL = 'https://be-patrimonymanagement.onrender.com';

const normalizeUrl = (url: string) => url.replace(/\/+$/, '');

export const API_BASE_URL = normalizeUrl(
  import.meta.env?.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
);

export const buildApiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

import { saveSession, state } from './core.js';

const API_BASE_URL = (
  document.documentElement.dataset.apiBaseUrl || 'http://localhost:3000/api'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest(path, {
  method = 'GET',
  body,
  authenticated = false,
} = {}) {
  const headers = { Accept: 'application/json' };
  const options = { method, headers };
  if (authenticated && state.session?.accessToken) {
    headers.Authorization = `Bearer ${state.session.accessToken}`;
  }

  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (error) {
    throw new Error(`Could not connect to the API at ${API_BASE_URL}. ${error.message}`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError('The API returned an invalid response.', response.status, 'INVALID_RESPONSE');
  }

  if (!response.ok) {
    const apiError = payload?.error || {};
    if (response.status === 401 && authenticated) {
      saveSession(null);
      window.dispatchEvent(new CustomEvent('api:unauthorized'));
    }
    throw new ApiError(
      apiError.message || `The API request failed with status ${response.status}.`,
      response.status,
      apiError.code || 'REQUEST_FAILED',
      apiError.details
    );
  }

  if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'data')) {
    throw new ApiError('The API response is missing its data envelope.', response.status, 'INVALID_RESPONSE');
  }
  return payload.data;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

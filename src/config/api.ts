export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5001';

export const api = (path: string) => `${API_URL}${path}`;
export const ws = (path: string) => `${WS_URL}${path}`;

const isLocalDevelopment = typeof window === 'undefined' ||
	window.location.hostname === 'localhost' ||
	window.location.hostname === '127.0.0.1';

export const API_URL = isLocalDevelopment ? 'http://localhost:8080/api' : '/api';
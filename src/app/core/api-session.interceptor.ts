import { HttpInterceptorFn } from '@angular/common/http';
import { API_URL } from './api';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

export const apiSessionInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(API_URL)) return next(request);

  const csrfToken = readCookie('XSRF-TOKEN');
  const safeMethod = /^(GET|HEAD|OPTIONS|TRACE)$/i.test(request.method);
  const headers = !safeMethod && csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : undefined;

  return next(request.clone({
    withCredentials: true,
    ...(headers ? { setHeaders: headers } : {}),
  }));
};
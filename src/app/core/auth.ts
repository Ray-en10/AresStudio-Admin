import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, tap } from 'rxjs';
import { API_URL } from './api';

interface LoginResponse {
  username: string;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);

  private get store() {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  }

  login(username: string, password: string) {
    return this.http.get<unknown>(`${API_URL}/auth/csrf`).pipe(
      switchMap(() => this.http.post<LoginResponse>(`${API_URL}/auth/login`, { username, password })),
      tap(() => this.store?.setItem('auth', '1')),
    );
  }

  validateSession(): Observable<void> {
    return this.http.get<LoginResponse>(`${API_URL}/auth/session`).pipe(map(() => undefined));
  }

  logout(): Observable<void> {
    this.store?.removeItem('auth');
    return this.http.post<void>(`${API_URL}/auth/logout`, {});
  }

  clearLocalSession(): void {
    this.store?.removeItem('auth');
  }

  isLoggedIn() {
    return Boolean(this.store?.getItem('auth'));
  }
}
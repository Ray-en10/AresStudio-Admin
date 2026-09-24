import { Service } from '@angular/core';

@Service()
export class Auth {
  private get store() {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  }

  login(user: string, pass: string): boolean {
    const ok = user === 'admin' && pass === 'admin';
    if (ok) this.store?.setItem('auth', '1');
    return ok;
  }

  logout() {
    this.store?.removeItem('auth');
  }

  isLoggedIn() {
    return this.store?.getItem('auth') === '1';
  }
}
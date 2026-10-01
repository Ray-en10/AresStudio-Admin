import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../core/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  user = '';
  pass = '';
  errorMessage = '';
  submitting = false;
  showPassword = false;
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private returnUrl = '/dashboard';

  ngOnInit(): void {
    const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (requestedUrl?.startsWith('/') && !requestedUrl.startsWith('//')) {
      this.returnUrl = requestedUrl;
    }
  }

  submit(): void {
    if (!this.user.trim() || !this.pass || this.submitting) return;

    this.errorMessage = '';
    this.submitting = true;
    this.auth.login(this.user.trim(), this.pass).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl),
      error: () => {
        this.errorMessage = 'We could not verify those details. Please try again.';
        this.submitting = false;
      },
    });
  }

  submitFromKeyboard(event: Event): void {
    if ((event as KeyboardEvent).isComposing) return;
    event.preventDefault();
    this.submit();
  }

  clearError(): void {
    this.errorMessage = '';
  }
}
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  user = '';
  pass = '';
  error = false;
  private auth = inject(Auth);
  private router = inject(Router);

  submit() {
    if (this.auth.login(this.user, this.pass)) this.router.navigate(['/dashboard']);
    else this.error = true;
  }
}
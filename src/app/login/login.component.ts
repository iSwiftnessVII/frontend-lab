import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { authService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule, RouterModule]
})
export class LoginComponent implements OnInit, OnDestroy {
  email = '';
  password = '';
  error = '';
  loading = false;
  private returnUrl = '/dashboard';
  constructor(private router: Router, private route: ActivatedRoute) {
    const q = this.route.snapshot.queryParamMap.get('returnUrl');
    if (q) this.returnUrl = q;
  }

  ngOnInit() {
    document.body.classList.add('auth-page');
  }

  ngOnDestroy() {
    document.body.classList.remove('auth-page');
  }

  async onSubmit(e: Event) {
    e.preventDefault();
    try {
      this.loading = true;
      this.error = '';
      const res = await authService.login(this.email, this.password);
      await this.router.navigateByUrl(this.returnUrl);
      this.loading = false;
    } catch (err: any) {
      this.error = err.message || 'Login failed';
    }
  }

  // Placeholder for Google sign-in flow (UI only)
  onGoogleSignIn() {
    // implement OAuth redirect or popup here
    console.log('Google sign-in clicked');
  }
}

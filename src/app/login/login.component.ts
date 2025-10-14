import { Component, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { authService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
  ) {
    const q = this.route.snapshot.queryParamMap.get('returnUrl');
    this.returnUrl = q ? q : this.returnUrl; // Added null check
  }

  ngOnInit(): void {
    this.renderer.addClass(this.document.body, 'auth-page');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(this.document.body, 'auth-page');
  }

  async onSubmit(e: Event) {
    e.preventDefault();
    this.loading = true;
    this.error = '';
    try {
      const res = await authService.login(this.email, this.password);
      await this.router.navigateByUrl(this.returnUrl);
    } catch (err: any) {
      console.error('Login error:', err); // Log error for debugging
      this.error = err?.message || 'Login failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  // Placeholder for Google sign-in flow (UI only)
  onGoogleSignIn() {
    // implement OAuth redirect or popup here
    console.log('Google sign-in clicked');
  }
}

import { Component, signal, inject, OnInit, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SignupRequest, LoginRequest, AuthResponse } from '../../models/user.model';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent implements OnInit {
  private authService = inject(AuthService);

  loginSuccess = output<void>();

  isRegistering = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  authData = { email: '', password: '' };
  registerData = { name: '', phone: '', address: '' };

  ngOnInit(): void {
    this.authService.loadStoredUser();
  }

  toggleMode() {
    this.isRegistering.set(!this.isRegistering());
    this.errorMessage.set('');
    this.authData = { email: '', password: '' };
    this.registerData = { name: '', phone: '', address: '' };
  }

  onSubmit() {
    this.errorMessage.set('');
    this.isLoading.set(true);

    if (this.isRegistering()) {
      this.handleSignup();
    } else {
      this.handleLogin();
    }
  }

  private handleSignup() {
    const signupData: SignupRequest = {
      Nombre: this.registerData.name,
      Telefono: this.registerData.phone,
      Correo: this.authData.email,
      Contrasena: this.authData.password,
      Direccion: this.registerData.address
    };

    this.authService.signup(signupData).subscribe({
      next: (response: AuthResponse) => {
        this.authService.setCurrentUser(response);
        this.isLoading.set(false);
        this.isRegistering.set(false);
        this.authData = { email: '', password: '' };
        this.registerData = { name: '', phone: '', address: '' };
        this.loginSuccess.emit();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Error en el registro. Intenta nuevamente.');
      }
    });
  }

  private handleLogin() {
    const loginData: LoginRequest = {
      Correo: this.authData.email,
      Contrasena: this.authData.password
    };

    this.authService.login(loginData).subscribe({
      next: (response: AuthResponse) => {
        this.authService.setCurrentUser(response);
        this.isLoading.set(false);
        this.authData = { email: '', password: '' };
        this.loginSuccess.emit();
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set('Correo o contraseña incorrectos.');
      }
    });
  }
}
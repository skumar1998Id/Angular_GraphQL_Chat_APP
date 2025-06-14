import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;
  userNotFound: boolean = false;
  
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Clear any existing user to ensure the login screen shows
    this.authService.logout();
  }

  loginUser(): void {
    if (!this.username.trim()) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.userNotFound = false;
    
    // First, try to find the user by name
    this.authService.findUserByName(this.username).subscribe({
      next: (user) => {
        if (user) {
          // User found, log them in
          this.authService.login(user);
          this.isLoading = false;
        } else {
          // User not found
          this.errorMessage = `User "${this.username}" not found.`;
          this.userNotFound = true;
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error finding user', error);
        this.errorMessage = 'An error occurred. Please try again.';
        this.isLoading = false;
      }
    });
  }

  createNewUser(): void {
    if (!this.username.trim()) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.createUser(this.username).subscribe({
      next: () => {
        // User created and logged in by the service
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating user', error);
        this.errorMessage = 'Failed to create user. Please try again.';
        this.isLoading = false;
      }
    });
  }
}












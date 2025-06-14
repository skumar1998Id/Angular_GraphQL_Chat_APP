import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';
import { ChatService } from './chat.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private chatService: ChatService
  ) {
    // We'll no longer auto-initialize from localStorage
    // This will force the user to select a user from the list
  }
  
  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }
  
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
  
  setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.chatService.setCurrentUser(user);
  }
  
  login(user: User): void {
    this.setCurrentUser(user);
    this.router.navigate(['/chat']);
  }
  
  logout(): void {
    // Disconnect from chat
    this.chatService.disconnect();
    
    // Clear user data
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
  
  createUser(name: string): Observable<any> {
    const query = `
      mutation {
        createUser(name: "${name.replace(/"/g, '\\"')}") {
          id
          name
          isOnline
        }
      }
    `;
    
    return this.http.post(`${environment.apiUrl}`, { query }).pipe(
      map((response: any) => {
        if (response.data?.createUser) {
          return response.data.createUser;
        }
        throw new Error('Failed to create user');
      }),
      tap(newUser => {
        this.setCurrentUser(newUser);
      })
    );
  }
  
  findUserByName(name: string): Observable<User | null> {
    const query = `
      query {
        userByName(name: "${name.replace(/"/g, '\\"')}") {
          id
          name
        }
      }
    `;
    
    return this.http.post<any>(`${environment.apiUrl}`, { query }).pipe(
      map(response => {
        if (response.data?.userByName) {
          return response.data.userByName;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error finding user by name', error);
        return of(null);
      })
    );
  }
}




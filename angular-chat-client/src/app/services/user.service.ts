import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  constructor(private http: HttpClient) { }
  
  getContacts(): Observable<User[]> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) {
      return of([]);
    }
    
    const query = `
      query {
        contacts(userId: ${currentUser.id}) {
          id
          name
          isOnline
        }
      }
    `;
    
    return this.http.post<any>(`${environment.apiUrl}`, { query }).pipe(
      map(response => {
        if (response.data?.contacts) {
          return response.data.contacts;
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching contacts', error);
        return of([]);
      })
    );
  }
}
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UserStatus {
  userId: number;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
  customMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserStatusService {
  private userStatusMap = new Map<number, UserStatus>();
  private userStatusSubject = new BehaviorSubject<Map<number, UserStatus>>(new Map());
  
  constructor() {
    // Initialize with some default statuses
    this.initializeDefaultStatuses();
  }

  private initializeDefaultStatuses(): void {
    // This would typically come from the backend
    const defaultStatuses: UserStatus[] = [
      { userId: 1, status: 'online' },
      { userId: 2, status: 'away', lastSeen: new Date(Date.now() - 300000) }, // 5 minutes ago
      { userId: 3, status: 'busy', customMessage: 'In a meeting' },
      { userId: 4, status: 'offline', lastSeen: new Date(Date.now() - 3600000) } // 1 hour ago
    ];

    defaultStatuses.forEach(status => {
      this.userStatusMap.set(status.userId, status);
    });
    
    this.userStatusSubject.next(new Map(this.userStatusMap));
  }

  getUserStatus(userId: number): UserStatus | null {
    return this.userStatusMap.get(userId) || null;
  }

  setUserStatus(userId: number, status: UserStatus): void {
    this.userStatusMap.set(userId, status);
    this.userStatusSubject.next(new Map(this.userStatusMap));
  }

  updateUserStatus(userId: number, status: 'online' | 'away' | 'busy' | 'offline', customMessage?: string): void {
    const currentStatus = this.userStatusMap.get(userId) || { userId, status: 'offline' };
    const updatedStatus: UserStatus = {
      ...currentStatus,
      status,
      customMessage,
      lastSeen: status === 'offline' ? new Date() : undefined
    };
    
    this.setUserStatus(userId, updatedStatus);
  }

  getUserStatuses(): Observable<Map<number, UserStatus>> {
    return this.userStatusSubject.asObservable();
  }

  getStatusText(status: UserStatus): string {
    switch (status.status) {
      case 'online':
        return status.customMessage || 'Online';
      case 'away':
        return status.customMessage || 'Away';
      case 'busy':
        return status.customMessage || 'Busy';
      case 'offline':
        if (status.lastSeen) {
          const timeDiff = Date.now() - status.lastSeen.getTime();
          const minutes = Math.floor(timeDiff / 60000);
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);
          
          if (days > 0) {
            return `Last seen ${days} day${days > 1 ? 's' : ''} ago`;
          } else if (hours > 0) {
            return `Last seen ${hours} hour${hours > 1 ? 's' : ''} ago`;
          } else if (minutes > 0) {
            return `Last seen ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
          } else {
            return 'Last seen just now';
          }
        }
        return 'Offline';
      default:
        return 'Unknown';
    }
  }

  getStatusColor(status: UserStatus): string {
    switch (status.status) {
      case 'online':
        return '#10b981'; // green
      case 'away':
        return '#f59e0b'; // yellow
      case 'busy':
        return '#ef4444'; // red
      case 'offline':
        return '#6b7280'; // gray
      default:
        return '#6b7280';
    }
  }
}

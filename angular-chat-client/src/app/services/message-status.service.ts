import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface MessageStatus {
  messageId: number;
  status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
}

export interface TypingIndicator {
  userId: number;
  isTyping: boolean;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class MessageStatusService {
  private messageStatusMap = new Map<number, MessageStatus>();
  private messageStatusSubject = new BehaviorSubject<Map<number, MessageStatus>>(new Map());
  
  private typingIndicators = new Map<number, TypingIndicator>();
  private typingSubject = new BehaviorSubject<Map<number, TypingIndicator>>(new Map());
  
  constructor() {}

  // Message Status Methods
  setMessageStatus(messageId: number, status: 'sent' | 'delivered' | 'read'): void {
    const messageStatus: MessageStatus = {
      messageId,
      status,
      timestamp: new Date()
    };
    
    this.messageStatusMap.set(messageId, messageStatus);
    this.messageStatusSubject.next(new Map(this.messageStatusMap));
  }

  getMessageStatus(messageId: number): MessageStatus | null {
    return this.messageStatusMap.get(messageId) || null;
  }

  getMessageStatuses(): Observable<Map<number, MessageStatus>> {
    return this.messageStatusSubject.asObservable();
  }

  // Typing Indicator Methods
  setTypingIndicator(userId: number, isTyping: boolean): void {
    if (isTyping) {
      const indicator: TypingIndicator = {
        userId,
        isTyping: true,
        timestamp: new Date()
      };
      this.typingIndicators.set(userId, indicator);
    } else {
      this.typingIndicators.delete(userId);
    }
    
    this.typingSubject.next(new Map(this.typingIndicators));
    
    // Auto-clear typing indicator after 3 seconds
    if (isTyping) {
      setTimeout(() => {
        const currentIndicator = this.typingIndicators.get(userId);
        if (currentIndicator && currentIndicator.timestamp.getTime() <= Date.now() - 3000) {
          this.typingIndicators.delete(userId);
          this.typingSubject.next(new Map(this.typingIndicators));
        }
      }, 3000);
    }
  }

  getTypingIndicators(): Observable<Map<number, TypingIndicator>> {
    return this.typingSubject.asObservable();
  }

  isUserTyping(userId: number): boolean {
    const indicator = this.typingIndicators.get(userId);
    if (!indicator) return false;
    
    // Check if typing indicator is still valid (within 3 seconds)
    const timeDiff = Date.now() - indicator.timestamp.getTime();
    return timeDiff < 3000;
  }

  getTypingUsers(): number[] {
    const typingUsers: number[] = [];
    this.typingIndicators.forEach((indicator, userId) => {
      if (this.isUserTyping(userId)) {
        typingUsers.push(userId);
      }
    });
    return typingUsers;
  }

  // Message Status Icons
  getStatusIcon(status: MessageStatus): string {
    switch (status.status) {
      case 'sent':
        return 'fas fa-check'; // single check
      case 'delivered':
        return 'fas fa-check-double'; // double check
      case 'read':
        return 'fas fa-check-double text-blue-500'; // double check in blue
      default:
        return 'fas fa-clock'; // pending
    }
  }

  getStatusColor(status: MessageStatus): string {
    switch (status.status) {
      case 'sent':
        return '#6b7280'; // gray
      case 'delivered':
        return '#6b7280'; // gray
      case 'read':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  }

  // Utility method to format typing text
  getTypingText(userNames: string[]): string {
    if (userNames.length === 0) return '';
    if (userNames.length === 1) return `${userNames[0]} is typing...`;
    if (userNames.length === 2) return `${userNames[0]} and ${userNames[1]} are typing...`;
    return `${userNames[0]} and ${userNames.length - 1} others are typing...`;
  }
}

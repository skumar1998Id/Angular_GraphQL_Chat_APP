import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Message } from '../models/message.model';

interface UnreadMessageCount {
  [userId: number]: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private unreadMessagesSubject = new BehaviorSubject<UnreadMessageCount>({});
  private notificationSubject = new Subject<Message | null>();
  private currentUserId: number | null = null;
  private selectedContactId: number | null = null;
  private audio: HTMLAudioElement;

  constructor() {
    // Create audio element for notification sound
    this.audio = new Audio();
    this.audio.src = 'assets/sounds/notification.mp3';
    this.audio.load();
  }

  setCurrentUser(userId: number | null): void {
    this.currentUserId = userId;
  }

  setSelectedContact(contactId: number | null): void {
    this.selectedContactId = contactId;
    
    // Clear unread count for selected contact
    if (contactId !== null) {
      this.clearUnreadCount(contactId);
    }
  }

  handleNewMessage(message: Message): void {
    // Only process messages sent to current user
    if (this.currentUserId && message.receiverId === this.currentUserId) {
      // Don't count messages from the currently selected contact
      if (this.selectedContactId !== message.senderId) {
        // Update unread count
        const counts = { ...this.unreadMessagesSubject.value };
        counts[message.senderId] = (counts[message.senderId] || 0) + 1;
        this.unreadMessagesSubject.next(counts);
        
        // Play notification sound
        this.playNotificationSound();
        
        // Send notification to display on screen
        this.notificationSubject.next(message);
      }
    }
  }

  getUnreadCounts(): Observable<UnreadMessageCount> {
    return this.unreadMessagesSubject.asObservable();
  }

  getUnreadCountsValue(): UnreadMessageCount {
    return this.unreadMessagesSubject.value;
  }

  getNotifications(): Observable<Message | null> {
    return this.notificationSubject.asObservable();
  }

  clearUnreadCount(userId: number): void {
    const counts = { ...this.unreadMessagesSubject.value };
    if (counts[userId]) {
      delete counts[userId];
      this.unreadMessagesSubject.next(counts);
    }
  }

  getTotalUnreadCount(): number {
    const counts = this.unreadMessagesSubject.value;
    return Object.values(counts).reduce((total, count) => total + count, 0);
  }

  private playNotificationSound(): void {
    this.audio.play().catch(error => {
      console.error('Error playing notification sound:', error);
    });
  }

  // Test method to manually trigger a notification
  testNotification(): void {
    const testMessage: Message = {
      id: 999,
      senderId: 1,
      receiverId: this.currentUserId || 0,
      content: 'This is a test notification message',
      timestamp: new Date().toISOString(),
      read: false
    };
    
    this.notificationSubject.next(testMessage);
    this.playNotificationSound();
  }
}


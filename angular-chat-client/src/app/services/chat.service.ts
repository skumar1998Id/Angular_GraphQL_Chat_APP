import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Message } from '../models/message.model';
import { environment } from '../../environments/environment';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private stompClient: Client | null = null;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private selectedContactSubject = new BehaviorSubject<User | null>(null);
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private typingUsersSubject = new BehaviorSubject<{[key: number]: boolean}>({});
  private contactsSubject = new BehaviorSubject<User[]>([]);
  private activityInterval: any = null;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    console.log('ChatService constructor called');
  }

  // User management
  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.notificationService.setCurrentUser(user.id);
    this.connect(user.id);
  }

  getSelectedContact(): Observable<User | null> {
    return this.selectedContactSubject.asObservable();
  }

  setSelectedContact(contact: User): void {
    this.selectedContactSubject.next(contact);
    this.notificationService.setSelectedContact(contact.id);
    this.loadMessages(this.currentUserSubject.value?.id || 0, contact.id);
  }

  getTypingUsers(): Observable<{[key: number]: boolean}> {
    return this.typingUsersSubject.asObservable();
  }

  getContacts(): Observable<User[]> {
    return this.contactsSubject.asObservable();
  }

  // GraphQL API calls
  getUsers(): Observable<any> {
    const query = `
      query {
        users {
          id
          name
          isOnline
        }
      }
    `;
    return this.http.post(`${environment.apiUrl}`, { query });
  }

  getContactsList(userId: number): Observable<any> {
    const query = `
      query {
        contacts(userId: ${userId}) {
          id
          name
          isOnline
        }
      }
    `;
    return this.http.post(`${environment.apiUrl}`, { query })
      .pipe(
        tap((response: any) => {
          if (response.data?.contacts) {
            this.contactsSubject.next(response.data.contacts);
          }
        })
      );
  }

  // WebSocket connection methods
  connect(userId: number): void {
    console.log(`Connecting user ${userId} to WebSocket`);
    
    // Create a new STOMP client over SockJS
    const socket = new SockJS(`${environment.apiUrl.replace('/graphql', '')}/ws`);
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket:', frame);
      
      if (this.stompClient) {
        // Subscribe to user's message channel
        this.stompClient.subscribe(`/topic/messages/${userId}`, (message) => {
          const newMessage = JSON.parse(message.body);
          console.log('Received message:', newMessage);
          
          // Notify about new message
          this.notificationService.handleNewMessage(newMessage);
          
          // Update messages if they're between current user and selected contact
          if (this.selectedContactSubject.value) {
            const currentMessages = this.messagesSubject.getValue();
            const senderId = newMessage.senderId;
            const receiverId = newMessage.receiverId;
            const currentUserId = this.currentUserSubject.value?.id;
            const selectedContactId = this.selectedContactSubject.value?.id;
            
            if ((senderId === currentUserId && receiverId === selectedContactId) || 
                (senderId === selectedContactId && receiverId === currentUserId)) {
              this.messagesSubject.next([...currentMessages, newMessage]);
              
              // Mark message as read if it's from the selected contact
              if (senderId === selectedContactId) {
                this.markMessageAsRead(newMessage.id, currentUserId || 0);
              }
            }
          }
        });
        
        // Subscribe to status updates
        this.stompClient.subscribe(`/topic/status/${userId}`, (statusMsg) => {
          const status = JSON.parse(statusMsg.body);
          console.log('Status update:', status);
          
          // Update contact status
          this.updateContactStatus(status.userId, status.status === 'online');
        });
        
        // Subscribe to typing indicators
        this.stompClient.subscribe(`/topic/typing/${userId}`, (typingMsg) => {
          const typing = JSON.parse(typingMsg.body);
          console.log('Typing update:', typing);
          
          const typingUsers = {...this.typingUsersSubject.getValue()};
          typingUsers[typing.userId] = typing.isTyping;
          this.typingUsersSubject.next(typingUsers);
        });
        
        // Subscribe to read receipts
        this.stompClient.subscribe(`/topic/read/${userId}`, (readMsg) => {
          const readReceipt = JSON.parse(readMsg.body);
          console.log('Read receipt:', readReceipt);
          
          // Update message read status
          this.updateMessageReadStatus(readReceipt.messageId);
        });
        
        // Subscribe to global status updates
        this.stompClient.subscribe('/topic/status/all', (statusMsg) => {
          const status = JSON.parse(statusMsg.body);
          console.log('Global status update:', status);
          
          // Update contact status
          this.updateContactStatus(status.userId, status.status === 'online');
        });

        // Start sending activity updates
        this.startActivityUpdates(userId);

        // Send connect message to server
        this.stompClient.publish({
          destination: `/app/chat.connect/${userId}`,
          body: JSON.stringify({})
        });
      }
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame);
    };

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.deactivate();
    }
    
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
    
    this.notificationService.setCurrentUser(null);
    this.notificationService.setSelectedContact(null);
  }

  // Helper method to update contact status
  private updateContactStatus(userId: number, isOnline: boolean): void {
    const contacts = [...this.contactsSubject.getValue()];
    const contactIndex = contacts.findIndex(c => c.id === userId);
    
    if (contactIndex >= 0) {
      contacts[contactIndex] = {
        ...contacts[contactIndex],
        isOnline: isOnline
      };
      this.contactsSubject.next(contacts);
    }
  }

  // Helper method to update message read status
  private updateMessageReadStatus(messageId: number): void {
    const messages = [...this.messagesSubject.getValue()];
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex >= 0) {
      messages[messageIndex] = {
        ...messages[messageIndex],
        read: true
      };
      this.messagesSubject.next(messages);
    }
  }

  // Method to get messages
  getMessages(): Observable<Message[]> {
    return this.messagesSubject.asObservable();
  }
  
  // Method to load messages
  loadMessages(senderId: number, receiverId: number): void {
    const query = `
      query {
        messages(senderId: ${senderId}, receiverId: ${receiverId}) {
          id
          senderId
          receiverId
          content
          timestamp
          read
        }
      }
    `;
    this.http.post(`${environment.apiUrl}`, { query }).subscribe(
      (response: any) => {
        const messages = response.data?.messages || [];
        this.messagesSubject.next(messages);
      },
      error => {
        console.error('Error loading messages', error);
      }
    );
  }
  
  // Method to send message
  sendMessage(message: Message): void {
    const fileUrlPart = message.fileUrl ? `, fileUrl: "${message.fileUrl}"` : '';
    const fileTypePart = message.fileType ? `, fileType: "${message.fileType}"` : '';
    
    const query = `
      mutation {
        sendMessage(
          senderId: ${message.senderId}, 
          receiverId: ${message.receiverId}, 
          content: "${message.content.replace(/"/g, '\\"')}"${fileUrlPart}${fileTypePart}
        ) {
          id
          senderId
          receiverId
          content
          timestamp
          read
          fileUrl
          fileType
        }
      }
    `;
    
    this.http.post(`${environment.apiUrl}`, { query }).subscribe(
      (response: any) => {
        console.log('Message sent:', response);
        // Reload messages to include the new one
        this.loadMessages(message.senderId, message.receiverId);
      },
      error => {
        console.error('Error sending message', error);
      }
    );
  }
  
  // Method to set typing status
  setTypingStatus(senderId: number, receiverId: number, isTyping: boolean): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({
          userId: senderId,
          receiverId: receiverId,
          isTyping: isTyping
        })
      });
    } else {
      console.warn('Cannot send typing status: WebSocket not connected');
    }
  }

  // Method to create user
  createUser(name: string): Observable<any> {
    console.log('Creating user with name:', name);
    // Escape special characters in the name to prevent GraphQL injection
    const escapedName = name.replace(/"/g, '\\"');
    const query = `
      mutation {
        createUser(name: "${escapedName}") {
          id
          name
        }
      }
    `;
    return this.http.post(`${environment.apiUrl}`, { query })
      .pipe(
        tap((response: any) => console.log('Raw createUser response:', response)),
        catchError((error: any) => {
          console.error('Error in createUser request:', error);
          return throwError(() => error);
        })
      );
  }

  // Method to mark message as read
  markMessageAsRead(messageId: number, userId: number): void {
    const query = `
      mutation {
        markMessageAsRead(
          messageId: ${messageId}, 
          userId: ${userId}
        )
      }
    `;
    this.http.post(`${environment.apiUrl}`, { query }).subscribe(
      (response: any) => {
        console.log('Message marked as read:', response);
        // The read status will be updated via WebSocket
      },
      error => {
        console.error('Error marking message as read', error);
      }
    );
  }

  startActivityUpdates(userId: number): void {
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
    }
    
    // Send activity update every 30 seconds
    this.activityInterval = setInterval(() => {
      if (this.stompClient && this.stompClient.connected) {
        this.stompClient.publish({
          destination: `/app/chat.activity/${userId}`,
          body: JSON.stringify({})
        });
        console.log('Sent activity update for user', userId);
      }
    }, 30000);
  }

  uploadFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{url: string}>(`${environment.apiUrl.replace('/graphql', '')}/api/upload`, formData)
      .pipe(
        map(response => response.url),
        catchError(error => {
          console.error('Error uploading file', error);
          return throwError(() => new Error('File upload failed'));
        })
      );
  }
}







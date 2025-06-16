import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/user.model';
import { Message } from '../../models/message.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  contacts: User[] = [];
  selectedContact: User | null = null;
  messages: Message[] = [];
  private messageSubscription: Subscription | null = null;
  private contactStatusSubscription: Subscription | null = null;
  private userSubscription: Subscription | null = null;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    const currentUser = this.authService.getCurrentUserValue();
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Subscribe to current user
    this.userSubscription = this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }
      
      this.loadContacts();
      this.connectToChat();
    });

    // Subscribe to messages
    this.messageSubscription = this.chatService.getMessages().subscribe(messages => {
      this.messages = messages;
    });

    // Subscribe to contact status updates if available
    if (this.chatService.getContacts) {
      this.contactStatusSubscription = this.chatService.getContacts().subscribe(contacts => {
        this.contacts = contacts;
      });
    }
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
    
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    
    if (this.contactStatusSubscription) {
      this.contactStatusSubscription.unsubscribe();
    }
    
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  loadContacts(): void {
    if (this.currentUser) {
      // Get all users instead of just contacts
      this.chatService.getUsers().subscribe((response: any) => {
        if (response.data?.users) {
          // Filter out the current user
          this.contacts = response.data.users.filter(
            (user: User) => user.id !== this.currentUser?.id
          );
        }
      });
    }
  }

  connectToChat(): void {
    if (this.currentUser) {
      this.chatService.connect(this.currentUser.id);
    }
  }

  onContactSelected(contact: User): void {
    this.selectedContact = contact;
    this.loadMessages();
  }

  loadMessages(): void {
    if (this.currentUser && this.selectedContact) {
      this.chatService.loadMessages(this.currentUser.id, this.selectedContact.id);
    }
  }

  // Add this method to handle text messages
  sendMessage(content: string): void {
    if (this.currentUser && this.selectedContact) {
      const message: Message = {
        senderId: this.currentUser.id,
        receiverId: this.selectedContact.id,
        content: content,
        timestamp: new Date().toISOString(),
        read: false
      };
      this.chatService.sendMessage(message);
    }
  }

  logout(): void {
    this.authService.logout();
  }
  
  testNotification(): void {
    console.log('Testing notification');
    this.notificationService.testNotification();
  }

  // Add this method to handle file messages
  sendFileMessage(data: {content: string, file: File}): void {
    console.log('Sending file message:', data.content, data.file);
    
    if (this.currentUser && this.selectedContact) {
      // First upload the file
      this.chatService.uploadFile(data.file).subscribe({
        next: (fileUrl) => {
          console.log('File uploaded successfully, URL:', fileUrl);
          
          if (!fileUrl) {
            console.error('File URL is empty or undefined');
            // Use console.error instead of non-existent notification method
            console.error('Error: File upload failed');
            return;
          }
          
          // Make sure the URL is absolute
          const absoluteUrl = fileUrl.startsWith('http') ? 
            fileUrl : 
            `${window.location.origin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
          
          console.log('Absolute file URL:', absoluteUrl);
          
          // Then send the message with the file URL
          const message: Message = {
            senderId: this.currentUser!.id,
            receiverId: this.selectedContact!.id,
            content: data.content,
            timestamp: new Date().toISOString(),
            read: false,
            fileUrl: absoluteUrl,
            fileType: data.file.type
          };
          
          console.log('Sending message with file:', message);
          this.chatService.sendMessage(message);
        },
        error: (error) => {
          console.error('Error uploading file:', error);
          // Use console.error instead of non-existent notification method
          console.error('Failed to upload file. Please try again.');
        }
      });
    } else {
      console.error('Cannot send file: currentUser or selectedContact is null');
    }
  }
}












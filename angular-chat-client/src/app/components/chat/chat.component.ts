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
  filteredContacts: User[] = [];
  selectedContact: User | null = null;
  messages: Message[] = [];
  searchQuery: string = '';
  showUserDetails: boolean = false;
  showSettings: boolean = false;
  private messageSubscription: Subscription | null = null;
  private contactStatusSubscription: Subscription | null = null;
  private userSubscription: Subscription | null = null;
  private contactsRefreshSubscription: Subscription | null = null;

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

    // Subscribe to contacts refresh events
    this.contactsRefreshSubscription = this.chatService.getContactsRefresh().subscribe(shouldRefresh => {
      if (shouldRefresh) {
        console.log('Received contacts refresh signal');
        this.loadContacts();
      }
    });
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

    if (this.contactsRefreshSubscription) {
      this.contactsRefreshSubscription.unsubscribe();
    }
  }

  loadContacts(): void {
    if (this.currentUser) {
      console.log('Loading all users with public keys for user:', this.currentUser.id);
      // Use GraphQL method that gets ALL users (not just contacts) with public keys
      this.chatService.getUsers().subscribe((response: any) => {
        if (response.data?.users) {
          // Filter out the current user from the list
          this.contacts = response.data.users.filter(
            (user: User) => user.id !== this.currentUser?.id
          );
          this.filteredContacts = [...this.contacts];
          console.log('Loaded all users with public keys:', this.contacts.length);

          console.log('Loaded all users successfully');
        }
      }, error => {
        console.error('Error loading users with GraphQL:', error);
        // Fallback to REST API method if GraphQL fails
        this.loadContactsFallback();
      });
    }
  }

  private loadContactsFallback(): void {
    if (this.currentUser) {
      console.log('Using fallback method to load all users');
      // Try the REST API endpoint that excludes blocked users
      this.chatService.getUsersForUser(this.currentUser.id).subscribe((response: any) => {
        if (response.success && response.data?.users) {
          this.contacts = response.data.users;
          this.filteredContacts = [...this.contacts];
          console.log('Fallback: Loaded users from REST API:', this.contacts.length);

          // Note: REST API might not include public keys, so encryption might not work
          // This is just a fallback for basic functionality
        } else {
          console.error('Fallback: Failed to load users from REST API');
        }
      }, error => {
        console.error('Fallback: Error loading users from REST API:', error);
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

  // Send text message
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

  // Search functionality
  onSearchChange(): void {
    console.log('Search query:', this.searchQuery);
    console.log('Available contacts:', this.contacts.length);

    if (!this.searchQuery || this.searchQuery.trim() === '') {
      // Reset to show all contacts (excluding blocked users)
      this.filteredContacts = [...this.contacts];
      console.log('Reset to all contacts:', this.filteredContacts.length);
    } else {
      // Filter contacts based on search query
      this.filteredContacts = this.contacts.filter(contact =>
        contact.name?.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
      console.log('Filtered contacts:', this.filteredContacts.length);
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredContacts = [...this.contacts];
    console.log('Search cleared, showing all contacts:', this.filteredContacts.length);
  }

  // User details modal
  showContactInfo(): void {
    this.showUserDetails = true;
  }

  hideContactInfo(): void {
    this.showUserDetails = false;
  }

  // Block user functionality
  blockUser(): void {
    if (this.selectedContact && this.currentUser) {
      console.log('Blocking user:', this.selectedContact.name);

      // Use backend API to block user
      this.chatService.blockUser(this.currentUser.id, this.selectedContact.id, 'Blocked by user').subscribe(
        (response: any) => {
          if (response.success) {
            console.log('User blocked successfully:', response.message);

            // Remove from contacts list immediately
            this.contacts = this.contacts.filter(contact => contact.id !== this.selectedContact?.id);
            this.filteredContacts = this.filteredContacts.filter(contact => contact.id !== this.selectedContact?.id);

            // Clear selection and close modal
            this.selectedContact = null;
            this.showUserDetails = false;
          } else {
            console.error('Failed to block user:', response.message);
            alert('Failed to block user: ' + response.message);
          }
        },
        error => {
          console.error('Error blocking user:', error);
          alert('Error blocking user. Please try again.');
        }
      );
    }
  }

  // Call functionality
  makeVoiceCall(): void {
    if (this.selectedContact) {
      console.log('Starting voice call with:', this.selectedContact.name);
      // TODO: Implement actual call functionality
      alert(`Voice call with ${this.selectedContact.name} - Feature coming soon!`);
    }
  }

  makeVideoCall(): void {
    if (this.selectedContact) {
      console.log('Starting video call with:', this.selectedContact.name);
      // TODO: Implement actual video call functionality
      alert(`Video call with ${this.selectedContact.name} - Feature coming soon!`);
    }
  }

  // Settings functionality
  openSettings(): void {
    this.showSettings = true;
  }

  closeSettings(): void {
    this.showSettings = false;
  }

  // Add this method to handle file messages
  sendFileMessage(data: {content: string, file: File}): void {
    console.log('Sending file message:', data.content, data.file);

    if (this.currentUser && this.selectedContact) {
      // First upload the file
      this.chatService.uploadFile(data.file).subscribe({
        next: async (fileUrl) => {
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
            fileType: data.file.type,
            fileName: data.file.name
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












import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  @Input() showSettings: boolean = false;
  @Output() closeSettings = new EventEmitter<void>();

  currentUser: User | null = null;
  blockedUsers: User[] = [];
  activeTab: string = 'blocked';

  constructor(
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserValue();
    this.loadBlockedUsers();
  }

  loadBlockedUsers(): void {
    if (this.currentUser) {
      // Use backend API to get blocked users
      this.chatService.getBlockedUsers(this.currentUser.id).subscribe(
        (response: any) => {
          if (response.success && response.data?.blockedUsers) {
            this.blockedUsers = response.data.blockedUsers;
            console.log('Loaded blocked users:', this.blockedUsers.length);
          }
        },
        error => {
          console.error('Error loading blocked users:', error);
          this.blockedUsers = [];
        }
      );
    }
  }

  unblockUser(user: User): void {
    if (this.currentUser) {
      console.log('Unblocking user:', user.name);

      // Use backend API to unblock user
      this.chatService.unblockUser(this.currentUser.id, user.id).subscribe(
        (response: any) => {
          if (response.success) {
            console.log('User unblocked successfully:', response.message);

            // Remove from local blocked users list
            this.blockedUsers = this.blockedUsers.filter(blockedUser => blockedUser.id !== user.id);

            // Trigger a refresh of contacts in the chat service
            this.chatService.refreshContacts();
          } else {
            console.error('Failed to unblock user:', response.message);
            alert('Failed to unblock user: ' + response.message);
          }
        },
        error => {
          console.error('Error unblocking user:', error);
          alert('Error unblocking user. Please try again.');
        }
      );
    }
  }



  onCloseSettings(): void {
    this.closeSettings.emit();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}

import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { User } from '../../models/user.model';
import { ChatService } from '../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-message-input',
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.scss']
})
export class MessageInputComponent implements OnInit, OnDestroy {
  @Input() currentUser: User | null = null;
  @Input() selectedContact: User | null = null;
  @Output() messageSent = new EventEmitter<string>();
  
  messageContent: string = '';
  isContactTyping: boolean = false;
  private typingTimeout: any = null;
  private typingSubscription: Subscription | null = null;
  
  constructor(private chatService: ChatService) {}
  
  ngOnInit(): void {
    // Subscribe to typing indicators
    this.typingSubscription = this.chatService.getTypingUsers().subscribe(typingUsers => {
      if (this.selectedContact) {
        this.isContactTyping = typingUsers[this.selectedContact.id] || false;
      }
    });
  }
  
  ngOnDestroy(): void {
    if (this.typingSubscription) {
      this.typingSubscription.unsubscribe();
    }
    
    // Make sure to clear typing status when component is destroyed
    this.setTypingStatus(false);
  }
  
  sendMessage(): void {
    if (this.messageContent.trim() && this.currentUser && this.selectedContact) {
      this.messageSent.emit(this.messageContent.trim());
      this.messageContent = '';
      
      // Clear typing status when message is sent
      this.setTypingStatus(false);
    }
  }
  
  onTyping(): void {
    if (this.currentUser && this.selectedContact) {
      // Set typing status to true
      this.setTypingStatus(true);
      
      // Clear existing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }
      
      // Set timeout to clear typing status after 3 seconds of inactivity
      this.typingTimeout = setTimeout(() => {
        this.setTypingStatus(false);
      }, 3000);
    }
  }
  
  private setTypingStatus(isTyping: boolean): void {
    if (this.currentUser && this.selectedContact) {
      this.chatService.setTypingStatus(
        this.currentUser.id, 
        this.selectedContact.id, 
        isTyping
      );
    }
  }
}


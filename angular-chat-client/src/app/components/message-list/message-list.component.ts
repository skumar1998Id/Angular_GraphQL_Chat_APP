import { Component, Input, ViewChild, ElementRef, AfterViewChecked, OnChanges, SimpleChanges } from '@angular/core';
import { Message } from '../../models/message.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-message-list',
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss']
})
export class MessageListComponent implements AfterViewChecked, OnChanges {
  @Input() messages: Message[] = [];
  @Input() currentUser: User | null = null;
  @ViewChild('scrollContainer') private scrollContainer: ElementRef | null = null;
  
  private shouldScrollToBottom = true;
  private previousMessagesLength = 0;
  
  constructor() {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      // Check if new messages were added
      this.shouldScrollToBottom = this.previousMessagesLength < this.messages.length;
      this.previousMessagesLength = this.messages.length;
    }
  }
  
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }
  
  scrollToBottom(): void {
    if (this.scrollContainer) {
      try {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Error scrolling to bottom:', err);
      }
    }
  }
  
  isFirstMessageOfGroup(message: Message, index: number): boolean {
    if (index === 0) {
      return true;
    }
    
    const previousMessage = this.messages[index - 1];
    return previousMessage.senderId !== message.senderId;
  }
  
  isLastMessageOfGroup(message: Message, index: number): boolean {
    if (index === this.messages.length - 1) {
      return true;
    }
    
    const nextMessage = this.messages[index + 1];
    return nextMessage.senderId !== message.senderId;
  }
  
  formatTime(timestamp: string): string {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
             ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
}






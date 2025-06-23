import { Component, Input, OnChanges, SimpleChanges, AfterViewChecked, ViewChild, ElementRef, OnInit } from '@angular/core';
import { User } from '../../models/user.model';
import { Message } from '../../models/message.model';

@Component({
  selector: 'app-message-list',
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss']
})
export class MessageListComponent implements OnChanges, AfterViewChecked, OnInit {
  @Input() messages: Message[] = [];
  @Input() currentUser: User | null = null;
  @ViewChild('messageContainer', { static: false }) private messageContainer!: ElementRef;

  private shouldScrollToBottom = false;

  constructor() {}

  ngOnInit(): void {
    // Initialize component
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When messages change, we should scroll to bottom
    if (changes['messages']) {
      this.shouldScrollToBottom = true;
    }
  }

  ngAfterViewChecked(): void {
    // Scroll to bottom after view is updated
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        const element = this.messageContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  // File type detection methods
  isImageFile(fileType?: string): boolean {
    if (!fileType) return false;
    return fileType.startsWith('image/');
  }

  isVideoFile(fileType?: string): boolean {
    if (!fileType) return false;
    return fileType.startsWith('video/');
  }

  isAudioFile(fileType?: string): boolean {
    if (!fileType) return false;
    return fileType.startsWith('audio/');
  }

  isPdfFile(fileType?: string): boolean {
    if (!fileType) return false;
    return fileType === 'application/pdf';
  }

  isDocumentFile(fileType?: string): boolean {
    if (!fileType) return false;
    const documentTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];
    return documentTypes.includes(fileType);
  }

  getFileName(fileUrl?: string, fileName?: string): string {
    // If we have the original fileName, use it
    if (fileName) {
      return fileName;
    }

    // Fallback to extracting from URL
    if (!fileUrl) return 'Unknown file';
    const parts = fileUrl.split('/');
    return parts[parts.length - 1] || 'Unknown file';
  }

  openFileInNewTab(fileUrl?: string): void {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  }

  downloadFile(fileUrl?: string, fileName?: string): void {
    if (!fileUrl) return;

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'download';
    link.target = '_blank';

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Get the display content for a message
  getMessageContent(message: Message): string {
    return message.content;
  }

  // Check if message is encrypted (for UI display)
  isMessageEncrypted(message: Message): boolean {
    return message.isEncrypted || false;
  }
}


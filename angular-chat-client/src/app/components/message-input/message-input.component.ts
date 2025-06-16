import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { Message } from '../../models/message.model';
import { User } from '../../models/user.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PickerModule } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-message-input',
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.scss']
})
export class MessageInputComponent implements OnInit {
  @Input() currentUser: User | null = null;
  @Input() selectedContact: User | null = null;
  @Input() isContactTyping: boolean = false;
  @Output() messageSent = new EventEmitter<string>();
  @Output() fileSent = new EventEmitter<{content: string, file: File}>();
  @Output() typing = new EventEmitter<boolean>();
  @ViewChild('messageInput') messageInput!: ElementRef;
  @ViewChild('emojiPickerContainer') emojiPickerContainer!: ElementRef;
  @ViewChild('emojiButton') emojiButton!: ElementRef;
  
  message: string = '';
  showEmojiPicker: boolean = false;
  selectedFile: File | null = null;
  typingTimeout: any;
  
  // Emoji picker configuration
  emojiPickerOptions = {
    perLine: 8,
    showPreview: false,
    showSkinTones: true,
    showSearch: false,
    emojiSize: 24,
    sheetSize: 32,
    showCategoryNames: false,
    categories: [
      'recent',
      'people',
      'nature',
      'foods',
      'activity',
      'places',
      'objects',
      'symbols',
      'flags'
    ],
    i18n: {
      categories: {
        recent: '',
        people: '',
        nature: '',
        foods: '',
        activity: '',
        places: '',
        objects: '',
        symbols: '',
        flags: ''
      }
    }
  };

  constructor(private renderer: Renderer2) {
    // Close emoji picker when clicking outside
    this.renderer.listen('window', 'click', (e: Event) => {
      if (this.showEmojiPicker && 
          this.emojiPickerContainer && 
          !this.emojiPickerContainer.nativeElement.contains(e.target) &&
          this.emojiButton && 
          !this.emojiButton.nativeElement.contains(e.target)) {
        this.showEmojiPicker = false;
      }
    });
  }

  ngOnInit(): void {
  }
  
  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
    
    if (this.showEmojiPicker) {
      // Allow time for the picker to render
      setTimeout(() => {
        this.positionEmojiPicker();
      }, 0);
    }
  }
  
  // Position the emoji picker to ensure it stays within viewport
  positionEmojiPicker(): void {
    if (!this.emojiPickerContainer) return;
    
    const container = this.emojiPickerContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // If the picker would go above the viewport
    if (rect.top < 0) {
      // Position below the input instead
      this.renderer.setStyle(container, 'bottom', 'auto');
      this.renderer.setStyle(container, 'top', '100%');
      this.renderer.setStyle(container, 'margin-top', '10px');
      this.renderer.setStyle(container, 'margin-bottom', '0');
    }
    
    // If the picker would go below the viewport
    if (rect.bottom > viewportHeight) {
      // Adjust height to fit
      const newHeight = viewportHeight - rect.top - 20;
      this.renderer.setStyle(container, 'max-height', `${newHeight}px`);
    }
    
    // If the picker would go off the left edge
    if (rect.left < 0) {
      // Adjust horizontal position
      const adjustment = Math.abs(rect.left) + 10;
      const currentTransform = `translateX(calc(-50% + ${adjustment}px))`;
      this.renderer.setStyle(container, 'transform', currentTransform);
    }
    
    // If the picker would go off the right edge
    if (rect.right > viewportWidth) {
      // Adjust horizontal position
      const adjustment = rect.right - viewportWidth + 10;
      const currentTransform = `translateX(calc(-50% - ${adjustment}px))`;
      this.renderer.setStyle(container, 'transform', currentTransform);
    }
  }
  
  addEmoji(event: any): void {
    this.message += event.emoji.native;
    this.showEmojiPicker = false;
  }
  
  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }
  
  sendMessage(): void {
    if (this.selectedFile) {
      // Send message with file
      this.fileSent.emit({
        content: this.message.trim() || 'Attachment',
        file: this.selectedFile
      });
      this.message = '';
      this.selectedFile = null;
      this.showEmojiPicker = false;
    } else if (this.message.trim()) {
      // Send text-only message
      this.messageSent.emit(this.message.trim());
      this.message = '';
      this.showEmojiPicker = false;
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
  
  setTypingStatus(isTyping: boolean): void {
    // Implement this method based on your chat service
    console.log('Typing status:', isTyping);
    this.typing.emit(isTyping);
  }
  
  resetForm(): void {
    this.message = '';
    this.selectedFile = null;
    this.showEmojiPicker = false;
  }
}
















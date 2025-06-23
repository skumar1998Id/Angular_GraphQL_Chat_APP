import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Message } from '../../models/message.model';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent {
  @Input() message!: Message;
  @Input() isOwnMessage: boolean = false;
  
  constructor(private sanitizer: DomSanitizer) {}
  
  isImageFile(fileType: string | undefined): boolean {
    if (!fileType) return false;
    return fileType.startsWith('image/');
  }
  
  isPdfFile(fileType: string | undefined): boolean {
    if (!fileType) return false;
    return fileType.includes('pdf');
  }
  
  isVideoFile(fileType: string | undefined): boolean {
    if (!fileType) return false;
    return fileType.startsWith('video/');
  }
  
  isAudioFile(fileType: string | undefined): boolean {
    if (!fileType) return false;
    return fileType.startsWith('audio/');
  }
  
  getFileIcon(fileType: string | undefined): string {
    if (!fileType) return 'fa-file';
    
    if (fileType.startsWith('image/')) {
      return 'fa-file-image';
    } else if (fileType.startsWith('video/')) {
      return 'fa-file-video';
    } else if (fileType.startsWith('audio/')) {
      return 'fa-file-audio';
    } else if (fileType.includes('pdf')) {
      return 'fa-file-pdf';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return 'fa-file-word';
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      return 'fa-file-excel';
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
      return 'fa-file-powerpoint';
    } else if (fileType.includes('zip') || fileType.includes('compressed')) {
      return 'fa-file-archive';
    } else {
      return 'fa-file';
    }
  }
  
  getFileName(fileUrl: string | undefined): string {
    if (!fileUrl) return 'File';
    
    // Extract filename from URL
    const parts = fileUrl.split('/');
    return parts[parts.length - 1];
  }
  
  openImageInNewTab(fileUrl: string | undefined): void {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  }
  
  getSafeUrl(url: string | undefined): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}








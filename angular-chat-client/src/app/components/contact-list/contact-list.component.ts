import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../models/user.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.scss']
})
export class ContactListComponent {
  @Input() contacts: User[] = [];
  @Input() selectedContact: User | null = null;
  @Output() contactSelected = new EventEmitter<User>();

  constructor(private notificationService: NotificationService) {}

  selectContact(contact: User): void {
    this.contactSelected.emit(contact);
    this.notificationService.clearUnreadCount(contact.id);
  }

  hasUnreadMessages(contactId: number): boolean {
    const unreadCounts = this.notificationService.getUnreadCountsValue();
    return unreadCounts[contactId] > 0;
  }

  getUnreadCount(contactId: number): number {
    const unreadCounts = this.notificationService.getUnreadCountsValue();
    return unreadCounts[contactId] || 0;
  }
}


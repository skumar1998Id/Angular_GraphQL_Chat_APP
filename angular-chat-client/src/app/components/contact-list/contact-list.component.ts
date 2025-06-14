import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.scss']
})
export class ContactListComponent {
  @Input() contacts: User[] = [];
  @Input() selectedContact: User | null = null;
  @Output() contactSelected = new EventEmitter<User>();

  selectContact(contact: User): void {
    this.contactSelected.emit(contact);
  }

  hasUnreadMessages(contactId: number): boolean {
    // Implement this method based on your notification service
    return false;
  }

  getUnreadCount(contactId: number): number {
    // Implement this method based on your notification service
    return 0;
  }
}



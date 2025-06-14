import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnChanges {
  @Input() contacts: User[] = [];
  @Input() selectedContact: User | null = null;
  @Output() contactSelected = new EventEmitter<User>();
  
  displayedContacts: User[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contacts']) {
      this.displayedContacts = [...this.contacts];
    }
  }

  onSelectContact(contact: User): void {
    this.contactSelected.emit(contact);
  }
}


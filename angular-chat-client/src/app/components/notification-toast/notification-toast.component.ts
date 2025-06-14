import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Message } from '../../models/message.model';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-notification-toast',
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss'],
  animations: [
    trigger('toastAnimation', [
      state('hidden', style({
        opacity: 0,
        transform: 'translateY(100%)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('hidden => visible', animate('300ms ease-in')),
      transition('visible => hidden', animate('300ms ease-out'))
    ])
  ]
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  notifications: {message: Message, state: string}[] = [];
  private subscription: Subscription | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.getNotifications().subscribe(message => {
      if (message) {
        this.showNotification(message);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private showNotification(message: Message): void {
    // Add notification with 'visible' state
    const notification = { message, state: 'visible' };
    this.notifications.push(notification);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      notification.state = 'hidden';
      
      // Remove from array after animation completes
      setTimeout(() => {
        const index = this.notifications.indexOf(notification);
        if (index !== -1) {
          this.notifications.splice(index, 1);
        }
      }, 300);
    }, 5000);
  }
}
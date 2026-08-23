export type NotificationType = 'task' | 'review' | 'system';

export interface AppNotification {
  id: string; // "initial-101" for seed data, "post-23" for polled JSONPlaceholder posts
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

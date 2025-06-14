export interface User {
  id: number;
  name: string;
  email?: string;
  isOnline?: boolean;
  lastSeen?: string;
  avatar?: string;
}

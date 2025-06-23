export interface User {
  id: number;
  name: string | null | undefined;
  isOnline?: boolean;
  publicKey?: string; // For end-to-end encryption
}





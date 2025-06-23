export interface Message {
  id?: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  read: boolean;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  // Encryption fields
  isEncrypted?: boolean;
  encryptedContent?: string;
  encryptedAESKey?: string;
  iv?: string;
  signature?: string;
}



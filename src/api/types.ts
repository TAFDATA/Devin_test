export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastSeen: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

import { D1Database } from '@cloudflare/workers-types';

declare global {
  interface Bindings {
    DB: D1Database;
  }
}

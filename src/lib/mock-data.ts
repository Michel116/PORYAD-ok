
import type { Terminal, User, Shipment, ShelfSection, VerificationRequest } from './types';
import { PlaceHolderImages } from './placeholder-images';

// Default password for all users is 'password' for demo purposes
// For the admin user 'm', the password is 'm000M'
// Hash for 'm000M': $2b$10$f.BqA82y18j.F2yJ6sM/M.gP2sF/wP/dG/gT/hK/iX/jV/kL/nO/m
// For other users, you can generate hashes as needed.
export const users: User[] = [
  {
    id: 'user-1',
    name: 'm',
    email: 'admin@example.com',
    role: 'Administrator',
    avatarUrl: PlaceHolderImages.find(img => img.id === 'user-avatar-1')?.imageUrl || '',
    passwordHash: '$2a$10$Uv5jAZDHS3k7Fh7g1y9f1eS.1R/8qY.3gZ/e5qE/rT5i.4nJ/nB/G', // Hash for 'm000M'
  },
  {
    id: 'user-2',
    name: 'verifier',
    email: 'verifier@example.com',
    role: 'Verifier',
    avatarUrl: 'https://picsum.photos/seed/user2/100/100',
    passwordHash: '$2a$10$Uv5jAZDHS3k7Fh7g1y9f1eS.1R/8qY.3gZ/e5qE/rT5i.4nJ/nB/G' // Example hash
  },
  {
    id: 'user-3',
    name: 'user',
    email: 'user@example.com',
    role: 'User',
    avatarUrl: 'https://picsum.photos/seed/user3/100/100',
    passwordHash: '$2a$10$Uv5jAZDHS3k7Fh7g1y9f1eS.1R/8qY.3gZ/e5qE/rT5i.4nJ/nB/G' // Example hash
  }
];

const mockTerminals: Terminal[] = [];


export const shelfSections: ShelfSection[] = [
    {
        id: '12121',
        tier: 'Верхний',
        capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 3, cols: 6 } },
        currentBoxType: null,
        terminals: []
    },
    {
        id: '12122',
        tier: 'Верхний',
        capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 3, cols: 7 } },
        currentBoxType: null,
        terminals: []
    },
     {
        id: '12123',
        tier: 'Верхний',
        capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 3, cols: 6 } },
        currentBoxType: null,
        terminals: []
    },
    {
        id: '12111',
        tier: 'Нижний',
        capacity: { type_A: { rows: 3, cols: 5 }, type_B: { rows: 5, cols: 6 } },
        currentBoxType: null,
        terminals: []
    },
    {
        id: '12112',
        tier: 'Нижний',
        capacity: { type_A: { rows: 3, cols: 6 }, type_B: { rows: 5, cols: 7 } },
        currentBoxType: null,
        terminals: []
    },
    {
        id: '12113',
        tier: 'Нижний',
        capacity: { type_A: { rows: 3, cols: 5 }, type_B: { rows: 5, cols: 6 } },
        currentBoxType: null,
        terminals: []
    },
    {
        id: '12131',
        tier: 'Аренда',
        capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 1, cols: 5 } },
        currentBoxType: null,
        terminals: []
    },
    {
        id: '12132',
        tier: 'Аренда',
        capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 1, cols: 5 } },
        currentBoxType: null,
        terminals: []
    },
    {
        id: '12133',
        tier: 'Аренда',
        capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 1, cols: 5 } },
        currentBoxType: null,
        terminals: []
    }
];

export const terminals: Terminal[] = mockTerminals;


export const shipments: Shipment[] = [];

export const verificationRequests: VerificationRequest[] = [];

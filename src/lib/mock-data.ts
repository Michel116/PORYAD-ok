
import type { Terminal, User, Shipment, ShelfSection, VerificationRequest } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const users: User[] = [
  {
    id: 'user-1',
    name: 'Michel116',
    email: 'admin@example.com',
    role: 'Administrator',
    avatarUrl: PlaceHolderImages.find(img => img.id === 'user-avatar-1')?.imageUrl || '',
  },
  {
    id: 'user-2',
    name: 'Michel116',
    email: 'verifier@example.com',
    role: 'Verifier',
    avatarUrl: 'https://picsum.photos/seed/user2/100/100',
  },
];

const mockTerminals: Terminal[] = [
  {
    serialNumber: '170240001',
    model: 'Инспектор 1',
    status: 'verified',
    boxType: 'type_A',
    position: 0,
    verifiedUntil: '2024-10-14T00:00:00.000Z',
    location: { sectionId: '12121', cell: 1 },
    lastVerificationDate: '2023-10-15T00:00:00.000Z',
    history: [
      { date: '2023-01-20', event: 'Добавлен на склад', responsible: 'Michel116' },
      { date: '2023-10-15', event: 'Поверен', responsible: 'Michel116' },
    ],
  },
  {
    serialNumber: '170230002',
    model: 'Инспектор 1',
    status: 'pending',
    boxType: 'type_A',
    position: 1,
    location: { sectionId: '12121', cell: 2 },
    lastVerificationDate: null,
    verifiedUntil: null,
    history: [
        { date: '2023-02-10', event: 'Добавлен на склад', responsible: 'Michel116' },
        { date: '2023-02-11', event: 'Переведен в статус "Ожидание"', responsible: 'Michel116' }
    ],
  },
    {
    serialNumber: '172460004',
    model: 'Инспектор 1',
    status: 'verified',
    boxType: 'type_A',
    position: 2,
    verifiedUntil: '2025-01-04T00:00:00.000Z',
    location: { sectionId: '12111', cell: 3 },
    lastVerificationDate: '2024-01-05T00:00:00.000Z',
    history: [
      { date: '2023-09-15', event: 'Добавлен на склад', responsible: 'Michel116' },
      { date: '2024-01-05', event: 'Поверен', responsible: 'Michel116' },
    ],
  },
  {
    serialNumber: '170230005',
    model: 'Инспектор 1',
    status: 'shipped',
    boxType: 'type_B',
    position: 3,
    lastVerificationDate: '2023-12-10T00:00:00.000Z',
    verifiedUntil: '2024-12-09T00:00:00.000Z',
    history: [
      { date: '2023-10-01', event: 'Добавлен на склад', responsible: 'Michel116' },
      { date: '2023-12-10', event: 'Поверен', responsible: 'Michel116' },
      { date: '2024-02-01', event: 'Отгружен контрагенту: ООО МАССИВ', responsible: 'Michel116', statusBeforeShipment: 'verified' },
    ],
  },
    {
    serialNumber: '170250001',
    model: 'Инспектор 1',
    status: 'not_verified',
    boxType: 'type_A',
    position: 4,
    location: { sectionId: '12111', cell: 1 },
    lastVerificationDate: null,
    verifiedUntil: null,
    history: [{ date: '2024-03-01', event: 'Добавлен на склад', responsible: 'Michel116' }],
  },
  {
    serialNumber: '172560001',
    model: 'Инспектор 1',
    status: 'not_verified',
    boxType: 'type_A',
    position: 5,
    location: { sectionId: '12111', cell: 2 },
    lastVerificationDate: null,
    verifiedUntil: null,
    history: [
        { date: '2024-03-01', event: 'Добавлен на склад', responsible: 'Michel116' },
    ],
  },
  {
    serialNumber: '179250001',
    model: 'Инспектор 1 (Аренда)',
    status: 'rented',
    boxType: 'type_A',
    verifiedUntil: '2025-05-20T00:00:00.000Z',
    lastVerificationDate: '2024-05-21T00:00:00.000Z',
    history: [
        { date: '2024-05-20', event: 'Добавлен в арендный фонд', responsible: 'Michel116' },
        { date: '2024-05-21', event: 'Поверен', responsible: 'Michel116' },
        { date: '2024-06-10', event: 'Передан в аренду контрагенту: ООО "СтройИнвест"', responsible: 'Michel116' }
    ],
  },
  {
    serialNumber: '179250002',
    model: 'Инспектор 1 (Аренда)',
    status: 'rented',
    boxType: 'type_B',
    verifiedUntil: '2025-04-15T00:00:00.000Z',
    lastVerificationDate: '2024-04-16T00:00:00.000Z',
    history: [
        { date: '2024-04-15', event: 'Добавлен в арендный фонд', responsible: 'Michel116' },
        { date: '2024-04-16', event: 'Поверен', responsible: 'Michel116' },
        { date: '2024-06-15', event: 'Передан в аренду контрагенту: АО "ТехноСтрой"', responsible: 'Michel116' }
    ],
  },
  {
    serialNumber: '179260001',
    model: 'Инспектор 1 (Аренда)',
    status: 'not_verified',
    boxType: 'type_A',
    location: { sectionId: '12131', cell: 1 },
    position: 0,
    verifiedUntil: null,
    lastVerificationDate: null,
    history: [
        { date: '2024-06-01', event: 'Добавлен в арендный фонд', responsible: 'Michel116' }
    ],
  },
  {
    serialNumber: '179260002',
    model: 'Инспектор 1 (Аренда)',
    status: 'verified',
    boxType: 'type_A',
    location: { sectionId: '12131', cell: 2 },
    position: 1,
    verifiedUntil: '2025-07-10T00:00:00.000Z',
    lastVerificationDate: '2024-07-11T00:00:00.000Z',
    history: [
        { date: '2024-07-01', event: 'Добавлен в арендный фонд', responsible: 'Michel116' },
        { date: '2024-07-11', event: 'Поверен', responsible: 'Michel116' }
    ],
  },
];


export const shelfSections: ShelfSection[] = [
    {
        id: '12121',
        tier: 'Верхний',
        capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 3, cols: 6 } },
        currentBoxType: 'type_A',
        terminals: mockTerminals.filter(t => ['170240001', '170230002'].includes(t.serialNumber))
    },
    {
        id: '12122',
        tier: 'Верхний',
        capacity: { type_A: { rows: 2, cols: 5 }, type_B: { rows: 3, cols: 7 } },
        currentBoxType: 'type_B',
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
        currentBoxType: 'type_A',
        terminals: mockTerminals.filter(t => ['172460004', '170250001', '172560001'].includes(t.serialNumber))
    },
    {
        id: '12112',
        tier: 'Нижний',
        capacity: { type_A: { rows: 3, cols: 6 }, type_B: { rows: 5, cols: 7 } },
        currentBoxType: 'type_A',
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
        currentBoxType: 'type_A',
        terminals: mockTerminals.filter(t => ['179260001', '179260002'].includes(t.serialNumber))
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


export const shipments: Shipment[] = [
  {
    terminalId: '170230005',
    shippingDate: '2024-02-01T00:00:00.000Z',
    contragent: 'ООО МАССИВ',
    statusBeforeShipment: 'verified',
  },
];

export const verificationRequests: VerificationRequest[] = [];

export type OrderStatus = 'pending' | 'transit' | 'delivered' | 'rejected';

export interface OrderItem {
  name: string;
  qty: string;
}

export interface Order {
  id: string;
  ref: string;
  clientName: string;
  meta: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  hasPrescription: boolean;
  prescriptionLabel?: string;
}

export const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    ref: '#CMD-2341',
    clientName: 'Sophie Martin',
    meta: 'Il y a 4 min · 3 articles',
    status: 'pending',
    total: 47.8,
    items: [
      { name: 'Doliprane 1000mg', qty: '×2 boîtes' },
      { name: 'Amoxicilline 500mg', qty: '×1 boîte' },
      { name: 'Sérum physiologique', qty: '×5 unités' },
    ],
    hasPrescription: true,
    prescriptionLabel: 'Ordonnance jointe — Dr. Renard',
  },
  {
    id: '2',
    ref: '#CMD-2340',
    clientName: 'Thomas Dupont',
    meta: 'Il y a 12 min · 1 article',
    status: 'pending',
    total: 12.5,
    items: [{ name: 'Ibuprofène 400mg', qty: '×1 boîte' }],
    hasPrescription: false,
  },
  {
    id: '3',
    ref: '#CMD-2338',
    clientName: 'Émilie Bernard',
    meta: 'Il y a 38 min · 4 articles',
    status: 'transit',
    total: 83.2,
    items: [
      { name: 'Metformine 850mg', qty: '×3 boîtes' },
      { name: 'Amlodipine 5mg', qty: '×1 boîte' },
      { name: 'Oméprazole 20mg', qty: '×1 boîte' },
      { name: 'Vitamine D3 1000 UI', qty: '×2 boîtes' },
    ],
    hasPrescription: true,
    prescriptionLabel: 'Ordonnance jointe — Dr. Morel',
  },
  {
    id: '4',
    ref: '#CMD-2337',
    clientName: 'Lucas Petit',
    meta: 'Il y a 1h · 2 articles',
    status: 'pending',
    total: 29.9,
    items: [
      { name: 'Ventoline 100µg', qty: '×2 inhalateurs' },
      { name: 'Flixotide 125µg', qty: '×1 inhalateur' },
    ],
    hasPrescription: true,
    prescriptionLabel: 'Ordonnance jointe — Dr. Blanc',
  },
  {
    id: '5',
    ref: '#CMD-2335',
    clientName: 'Camille Rousseau',
    meta: 'Il y a 2h · 2 articles',
    status: 'delivered',
    total: 22.4,
    items: [
      { name: 'Smecta 3g', qty: '×2 boîtes' },
      { name: 'Ultralevure 200mg', qty: '×1 boîte' },
    ],
    hasPrescription: false,
  },
];

export const STATS = {
  pending: 6,
  validated: 14,
  revenue: 312,
};

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance: string;
  open: boolean;
  closeTime?: string;
  openTime?: string;
  rating: number;
}

export const MOCK_PHARMACIES: Pharmacy[] = [
  {
    id: '1',
    name: 'Pharmacie Lumière',
    address: '14 rue de Rivoli, Paris 1er',
    distance: '0.4 km',
    open: true,
    closeTime: '23:30',
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Pharmacie du Marché',
    address: '3 place du Marché, Paris 4e',
    distance: '1.2 km',
    open: true,
    closeTime: '20:00',
    rating: 4.6,
  },
  {
    id: '3',
    name: 'Grande Pharmacie Centrale',
    address: '88 boulevard Haussmann, Paris 8e',
    distance: '2.1 km',
    open: false,
    openTime: '09:00',
    rating: 4.9,
  },
  {
    id: '4',
    name: 'Pharmacie Saint-Paul',
    address: '42 rue Saint-Antoine, Paris 4e',
    distance: '2.8 km',
    open: true,
    closeTime: '22:00',
    rating: 4.5,
  },
  {
    id: '5',
    name: 'Pharmacie Bastille',
    address: '7 rue de la Bastille, Paris 12e',
    distance: '3.4 km',
    open: true,
    closeTime: '21:00',
    rating: 4.7,
  },
];

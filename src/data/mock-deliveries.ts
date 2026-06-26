export interface Delivery {
  id: string;
  from: string;
  fromAddress: string;
  to: string;
  toAddress: string;
  distance: string;
  estimatedTime: string;
  fee: number;
  itemsSummary: string;
}

export const MOCK_DELIVERIES: Delivery[] = [
  {
    id: '1',
    from: 'Pharmacie Lumière',
    fromAddress: '14 rue de Rivoli, Paris 1er',
    to: 'Marie D.',
    toAddress: '28 rue du Temple, Paris 3e',
    distance: '1.2 km',
    estimatedTime: '14 min',
    fee: 5.5,
    itemsSummary: '3 médicaments · ordonnance',
  },
  {
    id: '2',
    from: 'Grande Pharmacie Centrale',
    fromAddress: '88 bd Haussmann, Paris 8e',
    to: 'Jean-Pierre L.',
    toAddress: '12 avenue Montaigne, Paris 8e',
    distance: '2.8 km',
    estimatedTime: '22 min',
    fee: 7.8,
    itemsSummary: '5 médicaments · ordonnance',
  },
  {
    id: '3',
    from: 'Pharmacie du Marché',
    fromAddress: '3 place du Marché, Paris 4e',
    to: 'Sophie M.',
    toAddress: '6 place des Vosges, Paris 4e',
    distance: '0.9 km',
    estimatedTime: '11 min',
    fee: 4.2,
    itemsSummary: '2 médicaments',
  },
];

export const DAILY_STATS = {
  earnings: 68,
  deliveries: 7,
  rating: 4.9,
};

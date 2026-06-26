import type { OrderStatus } from '@/services/orders';

export interface OrderStatusConfig {
  label: string;
  color: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  pending: { label: 'En attente', color: '#eba24e' },
  accepted: { label: 'Acceptée', color: '#7fb89e' },
  in_delivery: { label: 'En livraison', color: '#6b9fd4' },
  delivered: { label: 'Livrée', color: '#6fcf97' },
  rejected: { label: 'Refusée', color: '#e07a6b' },
  cancelled: { label: 'Annulée', color: '#8a8f98' },
};

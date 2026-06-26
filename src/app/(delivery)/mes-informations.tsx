import { useEffect, useState } from 'react';
import { AccountInfoScreen } from '@/components/ui/account-info-screen';
import { ChipPickerCard, EditableFieldCard, StatsRow } from '@/components/ui/profile-extra-fields';
import { useAuth } from '@/hooks/use-auth';
import { updateProfileFields, type VehicleType } from '@/services/auth';
import { getDeliveryStats } from '@/services/orders';

const VEHICLE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'velo', label: 'Vélo' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'voiture', label: 'Voiture' },
];

export default function DeliveryMesInformationsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ totalDeliveries: number; totalEarnings: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    getDeliveryStats(user.uid).then(setStats).catch(() => setStats(null));
  }, [user]);

  if (!user) return null;

  return (
    <AccountInfoScreen
      uid={user.uid}
      nameLabel="Nom"
      currentName={user.name}
      currentEmail={user.email}
    >
      <EditableFieldCard
        label="Téléphone"
        initialValue={user.phone ?? ''}
        placeholder="06 12 34 56 78"
        keyboardType="phone-pad"
        onSave={(value) => updateProfileFields(user.uid, { phone: value })}
      />
      <ChipPickerCard
        label="Type de véhicule"
        options={VEHICLE_OPTIONS}
        value={user.vehicleType}
        onSelect={(value) => updateProfileFields(user.uid, { vehicleType: value })}
      />
      <EditableFieldCard
        label="Zone de livraison"
        initialValue={user.deliveryZone ?? ''}
        placeholder="Lyon 1er-6e"
        onSave={(value) => updateProfileFields(user.uid, { deliveryZone: value })}
      />
      {stats && (
        <StatsRow
          label="Statistiques"
          items={[
            { label: 'Note moyenne', value: user.rating ? user.rating.toFixed(1) : '—' },
            { label: 'Livraisons', value: String(stats.totalDeliveries) },
            { label: 'Gains totaux', value: `${Math.round(stats.totalEarnings)}€` },
          ]}
        />
      )}
    </AccountInfoScreen>
  );
}

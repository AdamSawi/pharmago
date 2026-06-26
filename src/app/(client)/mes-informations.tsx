import { useEffect, useState } from 'react';
import { AccountInfoScreen } from '@/components/ui/account-info-screen';
import { EditableFieldCard, StatsRow } from '@/components/ui/profile-extra-fields';
import { useAuth } from '@/hooks/use-auth';
import { updateProfileFields } from '@/services/auth';
import { getClientStats } from '@/services/orders';

export default function ClientMesInformationsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ orderCount: number; totalSpent: number; favoritePharmacy: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    getClientStats(user.uid).then(setStats).catch(() => setStats(null));
  }, [user]);

  if (!user) return null;

  return (
    <AccountInfoScreen
      uid={user.uid}
      nameLabel="Nom complet"
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
      <EditableFieldCard
        label="Date de naissance"
        initialValue={user.birthDate ?? ''}
        placeholder="JJ/MM/AAAA"
        onSave={(value) => updateProfileFields(user.uid, { birthDate: value })}
      />
      {stats && (
        <StatsRow
          label="Statistiques"
          items={[
            { label: 'Commandes', value: String(stats.orderCount) },
            { label: 'Dépensé', value: `${Math.round(stats.totalSpent)}€` },
            { label: 'Pharmacie favorite', value: stats.favoritePharmacy ?? '—' },
          ]}
        />
      )}
    </AccountInfoScreen>
  );
}

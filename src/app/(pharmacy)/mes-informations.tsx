import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AccountInfoScreen } from '@/components/ui/account-info-screen';
import { EditableFieldCard, ToggleCard } from '@/components/ui/profile-extra-fields';
import { useAuth } from '@/hooks/use-auth';
import { updateProfileFields } from '@/services/auth';

export default function PharmacyMesInformationsScreen() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <AccountInfoScreen
      uid={user.uid}
      nameLabel="Nom de l'officine"
      currentName={user.name}
      currentEmail={user.email}
      onNameSaved={(n) => updateDoc(doc(db, 'pharmacies', user.uid), { name: n }).catch(() => {})}
    >
      <EditableFieldCard
        label="Téléphone de l'officine"
        initialValue={user.phone ?? ''}
        placeholder="04 78 00 00 00"
        keyboardType="phone-pad"
        onSave={(value) => updateProfileFields(user.uid, { phone: value })}
      />
      <EditableFieldCard
        label="Numéro SIRET"
        initialValue={user.siret ?? ''}
        placeholder="123 456 789 00012"
        onSave={(value) => updateProfileFields(user.uid, { siret: value })}
      />
      <EditableFieldCard
        label="Horaires d'ouverture"
        initialValue={user.openingHours ?? ''}
        placeholder="Lun-Ven 9h-19h, Sam 9h-13h, Dim fermé"
        onSave={(value) => updateProfileFields(user.uid, { openingHours: value })}
      />
      <ToggleCard
        label="Officine ouverte"
        description="Visible des clients quand activé"
        value={user.isOpen ?? true}
        onToggle={(value) => updateProfileFields(user.uid, { isOpen: value })}
      />
    </AccountInfoScreen>
  );
}

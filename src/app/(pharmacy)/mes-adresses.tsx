import { SingleAddressScreen } from '@/components/ui/single-address-screen';
import { useAuth } from '@/hooks/use-auth';
import { updatePharmacyAddress } from '@/services/pharmacies';
import type { Address } from '@/services/auth';

export default function PharmacyMesAdressesScreen() {
  const { user } = useAuth();
  if (!user) return null;

  const uid = user.uid;
  async function handleSave(address: Address) {
    await updatePharmacyAddress(uid, address);
  }

  return <SingleAddressScreen initialAddress={user.pharmacyAddress} onSave={handleSave} />;
}

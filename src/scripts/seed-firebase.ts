/**
 * Seed script — resets and pre-fills Firestore with clean demo data
 *
 * Usage (run once before demo):
 *   npx tsx src/scripts/seed-firebase.ts
 *
 * Prerequisites:
 *   - Firebase Auth: Email/Password must be enabled
 *   - Firestore: database created (test mode for MVP)
 *   - Existing accounts with these emails must be DELETED manually from
 *     Firebase Console (Authentication > Users) before re-running if you
 *     want to start fresh, OR just run the script again — it will sign in
 *     and update existing accounts.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDScglKw4nIhEOMSjcexAdi6pc-qHdlxMI',
  authDomain: 'pharmago-inov.firebaseapp.com',
  projectId: 'pharmago-inov',
  storageBucket: 'pharmago-inov.firebasestorage.app',
  messagingSenderId: '938526253161',
  appId: '1:938526253161:web:21bae253e823dc792942f8',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateUser(email: string, password: string): Promise<string> {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    return user.uid;
  } catch (e: any) {
    if (e.code === 'auth/email-already-in-use') {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return user.uid;
    }
    throw e;
  }
}

async function deleteCollection(collectionName: string): Promise<void> {
  const snap = await getDocs(collection(db, collectionName));
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`  🗑️  Deleted ${snap.size} docs from ${collectionName}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding Firestore (clean slate)…\n');

  // ── 0. Clean existing data ──────────────────────────────────────────────────
  console.log('🧹 Cleaning old data…');
  await deleteCollection('pharmacies');
  await deleteCollection('products');
  await deleteCollection('orders');
  await deleteCollection('conversations');
  await deleteCollection('messages');
  await deleteCollection('favorites');
  await deleteCollection('reviews');
  console.log('');

  // ── 1. Pharmacies ──────────────────────────────────────────────────────────
  console.log('🏥 Creating pharmacies…');

  const pharmacyAccounts = [
    {
      email: 'lumiere@pharmacie.fr',
      password: 'Azerty123',
      name: 'Pharmacie Lumière',
      address: '12 rue de la République, 69001 Lyon',
      addressDetails: { street: '12 rue de la République', zipCode: '69001', city: 'Lyon' },
      phone: '04 72 00 11 22',
      siret: '123 456 789 00012',
      openingHours: 'Lun–Ven 8h30–19h30 · Sam 9h–13h',
      rating: 4.8,
    },
    {
      email: 'horloge@pharmacie.fr',
      password: 'Azerty123',
      name: "Pharmacie de l'Horloge",
      address: '22 place du Châtelet, 75001 Paris',
      addressDetails: { street: '22 place du Châtelet', zipCode: '75001', city: 'Paris' },
      phone: '01 42 33 44 55',
      siret: '987 654 321 00034',
      openingHours: 'Lun–Sam 8h–20h · Dim 10h–14h',
      rating: 4.6,
    },
    {
      email: 'soleil@pharmacie.fr',
      password: 'Azerty123',
      name: 'Pharmacie du Soleil',
      address: "5 avenue d'Italie, 75013 Paris",
      addressDetails: { street: "5 avenue d'Italie", zipCode: '75013', city: 'Paris' },
      phone: '01 55 66 77 88',
      siret: '456 789 123 00056',
      openingHours: 'Lun–Ven 9h–19h · Sam 9h–18h',
      rating: 4.9,
    },
  ];

  const pharmacyUids: string[] = [];

  for (const ph of pharmacyAccounts) {
    const uid = await getOrCreateUser(ph.email, ph.password);
    pharmacyUids.push(uid);

    await setDoc(doc(db, 'users', uid), {
      email: ph.email,
      name: ph.name,
      role: 'pharmacy',
      pharmacyId: uid,
      pharmacyName: ph.name,
      address: ph.address,
      addressDetails: ph.addressDetails,
      phone: ph.phone,
      siret: ph.siret,
      openingHours: ph.openingHours,
      isOpen: true,
      createdAt: serverTimestamp(),
    }, { merge: true });

    await setDoc(doc(db, 'pharmacies', uid), {
      name: ph.name,
      address: ph.address,
      addressDetails: ph.addressDetails,
      phone: ph.phone,
      siret: ph.siret,
      openingHours: ph.openingHours,
      isOpen: true,
      rating: ph.rating,
      createdAt: serverTimestamp(),
    }, { merge: true });

    console.log(`  ✅ ${ph.name} → ${ph.email} (uid: ${uid})`);
  }

  // ── 2. Products ────────────────────────────────────────────────────────────
  console.log('\n💊 Creating catalogs…');

  // Pharmacie Lumière — full catalog
  const lumiereProducts = [
    { name: 'Doliprane 1000mg', description: 'Paracétamol 1000 mg, boîte de 8 comprimés effervescents', price: 4.40, requiresOrdonnance: false, stock: 50 },
    { name: 'Amoxicilline 500mg', description: 'Antibiotique large spectre, boîte de 12 gélules', price: 5.10, requiresOrdonnance: true, stock: 30 },
    { name: 'Sérum physiologique', description: 'Solution isotonique NaCl 0,9%, boîte de 30 unidoses', price: 3.80, requiresOrdonnance: false, stock: 80 },
    { name: 'Ibuprofène 400mg', description: 'Anti-inflammatoire, boîte de 30 comprimés enrobés', price: 3.20, requiresOrdonnance: false, stock: 40 },
    { name: 'Smecta 3g', description: 'Diosmectite, sachet poudre pour suspension buvable ×30', price: 9.30, requiresOrdonnance: false, stock: 25 },
    { name: 'Vitamine C 1000mg', description: 'Acide ascorbique effervescent, tube de 20 comprimés', price: 6.50, requiresOrdonnance: false, stock: 60 },
    { name: 'Efferalgan 1000mg', description: 'Paracétamol effervescent 1000 mg, boîte de 16 comprimés', price: 4.90, requiresOrdonnance: false, stock: 45 },
    { name: 'Toplexil sirop', description: 'Oxomémazine 0,33 mg/ml, fl. 150 ml — antitussif', price: 7.20, requiresOrdonnance: true, stock: 15 },
    { name: 'Strepsils citron', description: 'Pastilles pour la gorge, boîte de 24', price: 4.10, requiresOrdonnance: false, stock: 35 },
    { name: 'Paracétamol générique 500mg', description: 'Paracétamol 500 mg, boîte de 16 comprimés', price: 2.60, requiresOrdonnance: false, stock: 70 },
    { name: 'Spasfon 80mg', description: 'Phloroglucinol, comprimés lyophilisés ×6 — antispasmodique', price: 5.80, requiresOrdonnance: false, stock: 28 },
    { name: 'Maalox suspension', description: "Antiacide, fl. 250 ml — brûlures d'estomac", price: 8.40, requiresOrdonnance: false, stock: 20 },
    { name: 'Actifed Rhume', description: 'Pseudoéphédrine + triprolidine, boîte de 12 comprimés', price: 6.90, requiresOrdonnance: false, stock: 22 },
    { name: 'Augmentin 1g', description: 'Amoxicilline + acide clavulanique, boîte de 16 cp — antibiotique', price: 9.70, requiresOrdonnance: true, stock: 18 },
    { name: 'Daflon 500mg', description: 'Veinotonique, boîte de 60 comprimés', price: 12.50, requiresOrdonnance: false, stock: 15 },
    { name: 'Levothyrox 50µg', description: 'Lévothyroxine sodique, boîte de 30 comprimés', price: 3.40, requiresOrdonnance: true, stock: 25 },
    { name: 'Ventoline 100µg/dose', description: 'Salbutamol spray inhalateur, 200 doses', price: 4.60, requiresOrdonnance: true, stock: 12 },
    { name: 'Nurofen 200mg', description: 'Ibuprofène 200 mg, boîte de 12 comprimés enrobés', price: 4.20, requiresOrdonnance: false, stock: 55 },
    { name: 'Prontalgine', description: 'Paracétamol 400 mg + codéine 20 mg + caféine, boîte de 16 cp', price: 5.60, requiresOrdonnance: true, stock: 10 },
    { name: 'Gel hydroalcoolique 300ml', description: 'Solution hydro-alcoolique désinfectante, flacon pompe', price: 3.90, requiresOrdonnance: false, stock: 100 },
  ];

  for (const p of lumiereProducts) {
    await addDoc(collection(db, 'products'), { ...p, pharmacyId: pharmacyUids[0], createdAt: serverTimestamp() });
  }
  console.log(`  ✅ Pharmacie Lumière: ${lumiereProducts.length} produits`);

  // Pharmacie de l'Horloge — catalog
  const horlogeProducts = [
    { name: 'Doliprane 500mg', description: 'Paracétamol 500 mg, boîte de 16 comprimés', price: 2.80, requiresOrdonnance: false, stock: 60 },
    { name: 'Aspirine UPSA 500mg', description: 'Acide acétylsalicylique effervescent, tube 20 cp', price: 3.50, requiresOrdonnance: false, stock: 45 },
    { name: 'Codoliprane 400/20mg', description: 'Paracétamol + codéine — antalgique, boîte de 16 cp', price: 4.90, requiresOrdonnance: true, stock: 20 },
    { name: 'Rhinofluimucil spray', description: 'Tuaminoheptane + acétylcystéine, flacon 10 ml nasal', price: 6.20, requiresOrdonnance: false, stock: 30 },
    { name: 'Magné B6 comprimés', description: 'Magnésium + vitamine B6, boîte de 60 comprimés', price: 7.80, requiresOrdonnance: false, stock: 40 },
    { name: 'Voltarène Emulgel 1%', description: 'Diclofénac gel, tube 100 g — douleurs musculaires', price: 8.60, requiresOrdonnance: false, stock: 25 },
    { name: 'Amoxicilline 1g', description: 'Antibiotique, boîte de 12 gélules', price: 6.30, requiresOrdonnance: true, stock: 15 },
    { name: 'Biafine émulsion', description: 'Tréthanolamine, tube 93 g — soins des brûlures', price: 5.40, requiresOrdonnance: false, stock: 35 },
    { name: 'Euphon pastilles', description: 'Dyclonine, boîte de 40 pastilles — maux de gorge', price: 4.70, requiresOrdonnance: false, stock: 50 },
    { name: 'Xyzall 5mg', description: 'Lévocétirizine — antihistaminique, boîte de 14 cp', price: 7.10, requiresOrdonnance: false, stock: 28 },
    { name: 'Tahor 10mg', description: 'Atorvastatine — hypocholestérolémiant, boîte de 30 cp', price: 11.20, requiresOrdonnance: true, stock: 22 },
    { name: 'Inexium 20mg', description: 'Ésoméprazole — inhibiteur pompe à protons, boîte de 28 gél.', price: 9.80, requiresOrdonnance: true, stock: 18 },
  ];

  for (const p of horlogeProducts) {
    await addDoc(collection(db, 'products'), { ...p, pharmacyId: pharmacyUids[1], createdAt: serverTimestamp() });
  }
  console.log(`  ✅ Pharmacie de l'Horloge: ${horlogeProducts.length} produits`);

  // Pharmacie du Soleil — catalog
  const soleilProducts = [
    { name: 'Doliprane 1000mg', description: 'Paracétamol 1000 mg, boîte de 8 comprimés effervescents', price: 4.40, requiresOrdonnance: false, stock: 40 },
    { name: 'Ibuprofène 200mg', description: 'Anti-inflammatoire, boîte de 20 comprimés', price: 2.90, requiresOrdonnance: false, stock: 50 },
    { name: 'Loratadine 10mg', description: 'Antihistaminique — allergie, boîte de 14 comprimés', price: 5.30, requiresOrdonnance: false, stock: 33 },
    { name: 'Oméprazole 20mg', description: 'Inhibiteur pompe à protons, boîte de 28 gélules', price: 4.80, requiresOrdonnance: false, stock: 42 },
    { name: 'Cétirizine 10mg', description: 'Antihistaminique — rhinite allergique, boîte de 7 cp', price: 4.50, requiresOrdonnance: false, stock: 38 },
    { name: 'Prednisolone 20mg', description: 'Corticoïde — anti-inflammatoire, boîte de 20 cp', price: 6.70, requiresOrdonnance: true, stock: 12 },
    { name: 'Clamoxyl 500mg', description: 'Amoxicilline — antibiotique, boîte de 16 gélules', price: 5.50, requiresOrdonnance: true, stock: 20 },
    { name: 'Euphytose comprimés', description: 'Valériane + passiflore — anxiété légère, boîte de 180 cp', price: 10.90, requiresOrdonnance: false, stock: 15 },
    { name: 'Bépanthène pommade', description: 'Dexpanthénol 5%, tube 30 g — érythème fessier/cicatrices', price: 5.20, requiresOrdonnance: false, stock: 60 },
    { name: 'Vicks Inhaler', description: 'Lévométhamphétamine 50 mg, tube inhaleur nasal', price: 4.30, requiresOrdonnance: false, stock: 44 },
    { name: 'Metformine 850mg', description: 'Antidiabétique oral, boîte de 90 comprimés', price: 3.60, requiresOrdonnance: true, stock: 25 },
    { name: 'Symbicort Turbuhaler', description: 'Budésonide + formotérol — asthme, 120 doses', price: 28.50, requiresOrdonnance: true, stock: 8 },
    { name: 'Acide folique 5mg', description: 'Vitamine B9, boîte de 20 comprimés', price: 2.40, requiresOrdonnance: true, stock: 30 },
    { name: 'Dafalgan 1g suppo', description: 'Paracétamol suppositoire adulte ×10', price: 3.80, requiresOrdonnance: false, stock: 22 },
  ];

  for (const p of soleilProducts) {
    await addDoc(collection(db, 'products'), { ...p, pharmacyId: pharmacyUids[2], createdAt: serverTimestamp() });
  }
  console.log(`  ✅ Pharmacie du Soleil: ${soleilProducts.length} produits`);

  // ── 3. Livreurs ────────────────────────────────────────────────────────────
  console.log('\n🚴 Creating delivery accounts…');

  const deliveryAccounts = [
    {
      email: 'kevin@livreur.fr',
      password: 'Azerty123',
      name: 'Kevin Dubois',
      phone: '06 11 22 33 44',
      vehicleType: 'scooter',
      deliveryZone: 'Lyon 1er–6e',
      rating: 4.9,
    },
    {
      email: 'sarah@livreur.fr',
      password: 'Azerty123',
      name: 'Sarah Martin',
      phone: '06 55 66 77 88',
      vehicleType: 'velo',
      deliveryZone: 'Paris 1er–4e',
      rating: 4.7,
    },
    {
      email: 'thomas@livreur.fr',
      password: 'Azerty123',
      name: 'Thomas Petit',
      phone: '06 99 00 11 22',
      vehicleType: 'voiture',
      deliveryZone: 'Paris 13e–15e',
      rating: 4.8,
    },
  ];

  const deliveryUids: string[] = [];

  for (const lv of deliveryAccounts) {
    const uid = await getOrCreateUser(lv.email, lv.password);
    deliveryUids.push(uid);

    await setDoc(doc(db, 'users', uid), {
      email: lv.email,
      name: lv.name,
      role: 'delivery',
      phone: lv.phone,
      vehicleType: lv.vehicleType,
      deliveryZone: lv.deliveryZone,
      rating: lv.rating,
      isOnline: false,
      earningsToday: 0,
      createdAt: serverTimestamp(),
    }, { merge: true });

    console.log(`  ✅ ${lv.name} → ${lv.email} (uid: ${uid})`);
  }

  // ── 4. Clients ─────────────────────────────────────────────────────────────
  console.log('\n👤 Creating client accounts…');

  const clientAccounts = [
    {
      email: 'margot@client.fr',
      password: 'Azerty123',
      name: 'Margot Dupont',
      phone: '07 11 22 33 44',
      addresses: [
        { id: 'addr-margot-1', label: 'Domicile', street: '45 avenue Jean Jaurès', zipCode: '69007', city: 'Lyon', isDefault: true },
        { id: 'addr-margot-2', label: 'Bureau', street: '3 place de la Bourse', zipCode: '69002', city: 'Lyon', isDefault: false },
      ],
    },
    {
      email: 'pierre@client.fr',
      password: 'Azerty123',
      name: 'Pierre Lambert',
      phone: '07 55 66 77 88',
      addresses: [
        { id: 'addr-pierre-1', label: 'Appartement', street: '8 rue du Temple', zipCode: '75003', city: 'Paris', isDefault: true },
        { id: 'addr-pierre-2', label: 'Parents', street: '27 boulevard Voltaire', zipCode: '75011', city: 'Paris', isDefault: false },
        { id: 'addr-pierre-3', label: 'Travail', street: '10 rue de la Paix', zipCode: '75002', city: 'Paris', isDefault: false },
      ],
    },
    {
      email: 'claire@client.fr',
      password: 'Azerty123',
      name: 'Claire Moreau',
      phone: '07 99 00 11 22',
      addresses: [
        { id: 'addr-claire-1', label: 'Maison', street: '15 impasse des Lilas', zipCode: '75020', city: 'Paris', isDefault: true },
      ],
    },
  ];

  const clientUids: string[] = [];

  for (const cl of clientAccounts) {
    const uid = await getOrCreateUser(cl.email, cl.password);
    clientUids.push(uid);

    await setDoc(doc(db, 'users', uid), {
      email: cl.email,
      name: cl.name,
      role: 'client',
      phone: cl.phone,
      addresses: cl.addresses,
      createdAt: serverTimestamp(),
    }, { merge: true });

    console.log(`  ✅ ${cl.name} → ${cl.email} | ${cl.addresses.length} adresse(s) (uid: ${uid})`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed terminé avec succès !\n');
  console.log('─────────────────────────────────────────────────');
  console.log('PHARMACIES');
  console.log('  Pharmacie Lumière   → lumiere@pharmacie.fr / Azerty123');
  console.log("  Pharmacie Horloge   → horloge@pharmacie.fr / Azerty123");
  console.log('  Pharmacie du Soleil → soleil@pharmacie.fr  / Azerty123');
  console.log('');
  console.log('LIVREURS');
  console.log('  Kevin Dubois  → kevin@livreur.fr  / Azerty123');
  console.log('  Sarah Martin  → sarah@livreur.fr  / Azerty123');
  console.log('  Thomas Petit  → thomas@livreur.fr / Azerty123');
  console.log('');
  console.log('CLIENTS');
  console.log('  Margot Dupont  → margot@client.fr / Azerty123  (2 adresses)');
  console.log('  Pierre Lambert → pierre@client.fr / Azerty123  (3 adresses)');
  console.log('  Claire Moreau  → claire@client.fr / Azerty123  (1 adresse)');
  console.log('─────────────────────────────────────────────────');
  console.log('0 commandes · 0 conversations · 0 historique');
}

seed().catch(console.error);

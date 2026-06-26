import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { UserRole } from '@/services/auth';
import { getUserBasic } from '@/services/users';

export interface ConversationDoc {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantRoles: Record<string, UserRole>;
  lastMessage: string;
  lastMessageAt: { toMillis: () => number } | null;
  unreadCount: Record<string, number>;
  orderId: string | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  attachmentBase64: string | null;
  attachmentType: 'image' | 'pdf' | null;
  attachmentName: string | null;
  createdAt: { toMillis: () => number } | null;
}

export interface ChatContact {
  uid: string;
  name: string;
  orderId?: string | null;
}

function pairId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

/**
 * Client-delivery conversations are scoped to a single order (one thread per
 * delivery), so their doc ID is the orderId itself rather than the user pair —
 * otherwise every order between the same client and delivery person would
 * collapse into one mixed-up thread. Pharmacy pairs stay pair-scoped since
 * they aren't order-specific.
 */
function resolveConversationId(params: {
  uidA: string;
  roleA: UserRole;
  uidB: string;
  roleB: UserRole;
  orderId?: string | null;
}): string {
  const isClientDeliveryPair =
    [params.roleA, params.roleB].includes('client') && [params.roleA, params.roleB].includes('delivery');
  if (isClientDeliveryPair && params.orderId) return params.orderId;
  return pairId(params.uidA, params.uidB);
}

/**
 * Creates the conversation if it doesn't exist yet. The doc is never created
 * by the recipient side — only whichever role is allowed to initiate calls
 * this (enforced by which UI surfaces expose it).
 */
export async function getOrCreateConversation(params: {
  uidA: string;
  nameA: string;
  roleA: UserRole;
  uidB: string;
  nameB: string;
  roleB: UserRole;
  orderId?: string | null;
}): Promise<string> {
  const id = resolveConversationId(params);
  const ref = doc(db, 'conversations', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [params.uidA, params.uidB],
      participantNames: { [params.uidA]: params.nameA, [params.uidB]: params.nameB },
      participantRoles: { [params.uidA]: params.roleA, [params.uidB]: params.roleB },
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      unreadCount: { [params.uidA]: 0, [params.uidB]: 0 },
      orderId: params.orderId ?? null,
      createdAt: serverTimestamp(),
    });
  }
  return id;
}

export async function conversationExists(uidA: string, uidB: string): Promise<string | null> {
  const id = pairId(uidA, uidB);
  const snap = await getDoc(doc(db, 'conversations', id));
  return snap.exists() ? id : null;
}

export async function conversationExistsForOrder(orderId: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'conversations', orderId));
  return snap.exists() ? orderId : null;
}

export function listenConversations(
  uid: string,
  onData: (conversations: ConversationDoc[]) => void,
): Unsubscribe {
  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    try {
      const conversations = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ConversationDoc));
      conversations.sort((a, b) => (b.lastMessageAt?.toMillis() ?? 0) - (a.lastMessageAt?.toMillis() ?? 0));
      onData(conversations);
    } catch (err) {
      console.error('listenConversations processing error:', err);
    }
  }, (err) => console.error('listenConversations listener error:', err));
}

export function listenConversation(
  conversationId: string,
  onData: (conversation: ConversationDoc | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'conversations', conversationId), (snap) => {
    try {
      onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as ConversationDoc) : null);
    } catch (err) {
      console.error('listenConversation processing error:', err);
    }
  }, (err) => console.error('listenConversation listener error:', err));
}

export function listenMessages(
  conversationId: string,
  onData: (messages: ChatMessage[]) => void,
): Unsubscribe {
  const msgsCol = collection(db, 'messages', conversationId, 'msgs');
  return onSnapshot(msgsCol, (snap) => {
    try {
      const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
      // Newest first — feeds directly into an inverted FlatList
      messages.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
      onData(messages);
    } catch (err) {
      console.error('listenMessages processing error:', err);
    }
  }, (err) => console.error('listenMessages listener error:', err));
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string,
  attachment?: { base64: string; type: 'image' | 'pdf'; name: string } | null,
): Promise<void> {
  const convRef = doc(db, 'conversations', conversationId);
  const convSnap = await getDoc(convRef);
  if (!convSnap.exists()) throw new Error('Conversation introuvable');

  const msgsCol = collection(db, 'messages', conversationId, 'msgs');
  const trimmed = text.trim();
  await addDoc(msgsCol, {
    senderId,
    senderName,
    text: trimmed,
    attachmentBase64: attachment?.base64 ?? null,
    attachmentType: attachment?.type ?? null,
    attachmentName: attachment?.name ?? null,
    createdAt: serverTimestamp(),
  });

  const data = convSnap.data();
  const participants: string[] = data.participants ?? [];
  const otherUid = participants.find((p) => p !== senderId);
  const unreadCount: Record<string, number> = { ...(data.unreadCount ?? {}) };
  if (otherUid) unreadCount[otherUid] = (unreadCount[otherUid] ?? 0) + 1;
  unreadCount[senderId] = 0;

  await updateDoc(convRef, {
    lastMessage: trimmed || (attachment?.type === 'image' ? '📷 Photo' : attachment?.type === 'pdf' ? '📄 Document' : ''),
    lastMessageAt: serverTimestamp(),
    unreadCount,
  });
}

export async function markAsRead(conversationId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'conversations', conversationId), { [`unreadCount.${uid}`]: 0 }).catch(() => {});
}

// ─── Contact lists (who can a given role start a conversation with) ───────────

export async function getPharmacyClientContacts(pharmacyId: string): Promise<ChatContact[]> {
  const snap = await getDocs(query(collection(db, 'orders'), where('pharmacyId', '==', pharmacyId)));
  const map = new Map<string, string>();
  snap.docs.forEach((d) => {
    const o = d.data();
    if (o.clientId && o.clientName) map.set(o.clientId, o.clientName);
  });
  return [...map].map(([uid, name]) => ({ uid, name }));
}

export async function getPharmacyDeliveryContacts(pharmacyId: string): Promise<ChatContact[]> {
  const snap = await getDocs(query(collection(db, 'orders'), where('pharmacyId', '==', pharmacyId)));
  const ids = new Set<string>();
  snap.docs.forEach((d) => {
    const deliveryId = d.data().deliveryId;
    if (deliveryId) ids.add(deliveryId);
  });
  const profiles = await Promise.all([...ids].map((uid) => getUserBasic(uid)));
  return profiles.filter((p): p is NonNullable<typeof p> => !!p).map((p) => ({ uid: p.uid, name: p.name }));
}

export async function getDeliveryClientContacts(deliveryId: string): Promise<ChatContact[]> {
  const snap = await getDocs(query(collection(db, 'orders'), where('deliveryId', '==', deliveryId)));
  const map = new Map<string, { name: string; orderId: string; updatedAt: number }>();
  snap.docs.forEach((d) => {
    const o = d.data();
    if (!o.clientId) return;
    const updatedAt = o.updatedAt?.toMillis?.() ?? 0;
    const existing = map.get(o.clientId);
    if (!existing || updatedAt > existing.updatedAt) {
      map.set(o.clientId, { name: o.clientName, orderId: d.id, updatedAt });
    }
  });
  return [...map].map(([uid, v]) => ({ uid, name: v.name, orderId: v.orderId }));
}

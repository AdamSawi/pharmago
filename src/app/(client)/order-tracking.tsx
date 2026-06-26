import { File, Paths } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ambient-background';
import {
  IconChat,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconDocument,
  IconMapPin,
  IconStar,
} from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ORDER_STATUS_CONFIG } from '@/constants/order-status';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { conversationExistsForOrder } from '@/services/chat';
import { cancelOrder, listenClientOrder, type FirestoreOrder, type OrderStatus } from '@/services/orders';
import { addReview, getDeliveryProfile, getReviewForOrder, type ReviewDoc } from '@/services/reviews';
import { generateInvoicePDF } from '@/utils/generate-invoice';

// ── Step definitions ──────────────────────────────────────────────────────────

interface Step {
  status: OrderStatus;
  label: string;
  desc: string;
  color: string;
}

const STEPS: Step[] = [
  {
    status: 'pending',
    label: 'Commande reçue',
    desc: 'La pharmacie examine votre commande',
    color: ORDER_STATUS_CONFIG.pending.color,
  },
  {
    status: 'accepted',
    label: 'Acceptée par la pharmacie',
    desc: 'Votre commande est en cours de préparation',
    color: ORDER_STATUS_CONFIG.accepted.color,
  },
  {
    status: 'in_delivery',
    label: 'En livraison',
    desc: 'Votre livreur est en route',
    color: ORDER_STATUS_CONFIG.in_delivery.color,
  },
  {
    status: 'delivered',
    label: 'Livrée',
    desc: 'Bonne santé !',
    color: ORDER_STATUS_CONFIG.delivered.color,
  },
];

const CANCELLED_STEPS: Step[] = [
  {
    status: 'pending',
    label: 'Commande reçue',
    desc: 'La commande a été transmise à la pharmacie',
    color: ORDER_STATUS_CONFIG.pending.color,
  },
  {
    status: 'cancelled',
    label: 'Commande annulée',
    desc: 'Annulée par le client',
    color: ORDER_STATUS_CONFIG.cancelled.color,
  },
];

const REJECTED_STEPS: Step[] = [
  {
    status: 'pending',
    label: 'Commande reçue',
    desc: 'La commande a été transmise à la pharmacie',
    color: ORDER_STATUS_CONFIG.pending.color,
  },
  {
    status: 'rejected',
    label: 'Commande refusée',
    desc: 'Refusée par la pharmacie',
    color: ORDER_STATUS_CONFIG.rejected.color,
  },
];

function statusToStep(status: OrderStatus): number {
  if (status === 'pending') return 0;
  if (status === 'accepted') return 1;
  if (status === 'in_delivery') return 2;
  if (status === 'delivered') return 3;
  return 0;
}

// ── Pulsing active dot ────────────────────────────────────────────────────────
function PulsingDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(0.5, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [opacity, scale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: color,
  }));

  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={pulseStyle} />
      <View style={[dots.inner, { backgroundColor: color }]} />
    </View>
  );
}

const dots = StyleSheet.create({
  inner: { width: 10, height: 10, borderRadius: 5 },
});

// ── Step row ──────────────────────────────────────────────────────────────────

function StepRow({
  step,
  index,
  currentStep,
  isLast,
}: {
  step: Step;
  index: number;
  currentStep: number;
  isLast: boolean;
}) {
  const { colors } = useTheme();
  const stepStyles = useMemo(() => createStepStyles(colors), [colors]);
  const done = index < currentStep;
  const active = index === currentStep;
  const pending = index > currentStep;

  const color = active || done ? step.color : colors.text.tertiary;

  return (
    <View style={stepStyles.row}>
      {/* Left — dot + connector */}
      <View style={stepStyles.left}>
        <View style={[stepStyles.dotWrap, { opacity: pending ? 0.35 : 1 }]}>
          {active ? (
            <PulsingDot color={step.color} />
          ) : done ? (
            <View style={[stepStyles.dotDone, { backgroundColor: step.color }]}>
              <IconCheck size={8} color="#000" strokeWidth={2.5} />
            </View>
          ) : (
            <View style={stepStyles.dotEmpty} />
          )}
        </View>
        {!isLast && (
          <View style={[stepStyles.connector, done && { backgroundColor: `${step.color}60` }]} />
        )}
      </View>

      {/* Right — text */}
      <View style={stepStyles.textWrap}>
        <Text style={[stepStyles.label, { color: pending ? colors.text.tertiary : colors.text.primary }]}>
          {step.label}
        </Text>
        <Text style={[stepStyles.desc, active && { color: step.color }]}>
          {step.desc}
        </Text>
      </View>
    </View>
  );
}

function createStepStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 16,
      minHeight: 56,
    },
    left: {
      alignItems: 'center',
      width: 20,
    },
    dotWrap: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    dotDone: {
      width: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotEmpty: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: colors.border.glassStrong,
    },
    connector: {
      flex: 1,
      width: 2,
      backgroundColor: colors.border.glass,
      borderRadius: 1,
      marginVertical: 4,
    },
    textWrap: {
      flex: 1,
      paddingBottom: 20,
      gap: 3,
    },
    label: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14.5,
    },
    desc: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.tertiary,
      lineHeight: 18,
    },
  });
}

// ── Delivery person card ─────────────────────────────────────────────────────

function DeliveryPersonCard({
  name,
  rating,
  onContact,
}: {
  name: string;
  rating: number;
  onContact?: () => void;
}) {
  const { colors } = useTheme();
  const driverStyles = useMemo(() => createDriverStyles(colors), [colors]);
  return (
    <GlassCard style={driverStyles.card}>
      <View style={driverStyles.avatar}>
        <Text style={driverStyles.avatarText}>
          {name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={driverStyles.info}>
        <Text style={driverStyles.label}>Votre livreur</Text>
        <Text style={driverStyles.name}>{name}</Text>
      </View>
      <View style={driverStyles.ratingRow}>
        <IconStar size={13} color={colors.amberBright} />
        <Text style={driverStyles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
      {onContact && (
        <Pressable onPress={onContact} hitSlop={8} style={driverStyles.contactBtn}>
          <IconChat size={15} color={colors.amberBright} strokeWidth={2} />
        </Pressable>
      )}
    </GlassCard>
  );
}

function createDriverStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: Radius.lg,
      marginBottom: 14,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(139,92,246,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(167,139,250,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14,
      color: '#a78bfa',
    },
    info: { flex: 1, gap: 2 },
    label: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 9.5,
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    name: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14.5,
      color: colors.text.primary,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ratingText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13,
      color: colors.text.primary,
    },
    contactBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.amberSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

// ── Delivery verification code ───────────────────────────────────────────────

function DeliveryCodeCard({ code }: { code: string }) {
  const { colors } = useTheme();
  const codeStyles = useMemo(() => createCodeStyles(colors), [colors]);
  return (
    <GlassCard strong style={codeStyles.card}>
      <Text style={codeStyles.label}>Code de vérification</Text>
      <Text style={codeStyles.code}>{code}</Text>
      <Text style={codeStyles.hint}>Donnez ce code à votre livreur à la remise de la commande.</Text>
    </GlassCard>
  );
}

function createCodeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      padding: 18,
      borderRadius: Radius.lg,
      alignItems: 'center',
      gap: 6,
      marginBottom: 14,
    },
    label: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 10.5,
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    code: {
      fontFamily: FontFamily.serif,
      fontSize: 34,
      color: colors.amberBright,
      letterSpacing: 6,
    },
    hint: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.tertiary,
      textAlign: 'center',
    },
  });
}

// ── Review form ───────────────────────────────────────────────────────────────

function ReviewForm({ onSubmit }: { onSubmit: (rating: number, comment: string) => void }) {
  const { colors } = useTheme();
  const reviewStyles = useMemo(() => createReviewStyles(colors), [colors]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(rating, comment);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard strong style={reviewStyles.card}>
      <Text style={reviewStyles.title}>Comment s'est passée votre livraison ?</Text>
      <View style={reviewStyles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable key={i} onPress={() => setRating(i)} hitSlop={6}>
            <IconStar size={28} color={i <= rating ? colors.amberBright : colors.border.glassStrong} />
          </Pressable>
        ))}
      </View>
      <TextInput
        style={reviewStyles.input}
        value={comment}
        onChangeText={setComment}
        placeholder="Laisser un commentaire (optionnel)"
        placeholderTextColor={colors.text.tertiary}
        multiline
      />
      <PrimaryButton label="Envoyer mon avis" onPress={handleSubmit} loading={submitting} disabled={rating === 0} />
    </GlassCard>
  );
}

function SubmittedReviewCard({ review }: { review: ReviewDoc }) {
  const { colors } = useTheme();
  const reviewStyles = useMemo(() => createReviewStyles(colors), [colors]);
  return (
    <GlassCard strong style={reviewStyles.card}>
      <Text style={reviewStyles.title}>Votre avis</Text>
      <View style={reviewStyles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <IconStar key={i} size={20} color={i <= review.rating ? colors.amberBright : colors.border.glassStrong} />
        ))}
      </View>
      {!!review.comment && <Text style={reviewStyles.submittedComment}>{review.comment}</Text>}
      {review.deliveryResponse && (
        <View style={reviewStyles.responseBlock}>
          <Text style={reviewStyles.responseLabel}>Réponse du livreur</Text>
          <Text style={reviewStyles.responseText}>{review.deliveryResponse}</Text>
        </View>
      )}
    </GlassCard>
  );
}

function createReviewStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      padding: 18,
      borderRadius: Radius.lg,
      gap: 14,
      marginBottom: 20,
    },
    title: {
      fontFamily: FontFamily.sansBold,
      fontSize: 14.5,
      color: colors.text.primary,
    },
    submittedComment: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13.5,
      color: colors.text.secondary,
      lineHeight: 19,
    },
    responseBlock: {
      borderLeftWidth: 2,
      borderLeftColor: colors.amberBright,
      paddingLeft: 12,
      gap: 4,
    },
    responseLabel: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 10.5,
      color: colors.amberBright,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    responseText: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    starsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    input: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 13.5,
      color: colors.text.primary,
      borderWidth: 1,
      borderColor: colors.border.glass,
      borderRadius: Radius.md,
      padding: 12,
      minHeight: 64,
      textAlignVertical: 'top',
    },
  });
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function OrderTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<FirestoreOrder | null>(null);
  const [deliveryProfile, setDeliveryProfile] = useState<{ name: string; rating: number } | null>(null);
  const [submittedReview, setSubmittedReview] = useState<ReviewDoc | null>(null);
  const [reviewChecked, setReviewChecked] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [deliveryConversationId, setDeliveryConversationId] = useState<string | null>(null);

  async function handleDownloadInvoice() {
    if (!order || generatingInvoice) return;
    setGeneratingInvoice(true);
    try {
      await generateInvoicePDF(order);
    } catch {
      Alert.alert('Erreur', "La facture n'a pas pu être générée.");
    } finally {
      setGeneratingInvoice(false);
    }
  }

  async function handleOpenPdf(base64: string, name: string) {
    try {
      const filename = name.endsWith('.pdf') ? name : `${name}.pdf`;
      const file = new File(Paths.cache, filename);
      file.create({ overwrite: true });
      file.write(base64, { encoding: 'base64' });
      await Linking.openURL(file.uri);
    } catch {
      Alert.alert('Erreur', "L'ordonnance n'a pas pu être ouverte.");
    }
  }

  function handleCancel() {
    if (!orderId || cancelling) return;
    Alert.alert('Annuler la commande', 'Êtes-vous sûr ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelOrder(orderId);
            Alert.alert('Commande annulée');
          } catch {
            Alert.alert('Erreur', "La commande n'a pas pu être annulée.");
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }

  useEffect(() => {
    if (!orderId) return;
    const unsub = listenClientOrder(orderId, (data) => {
      console.log('order-tracking: order.status =', data.status);
      setOrder(data);
    });
    return unsub;
  }, [orderId]);

  useEffect(() => {
    if (!order?.deliveryId) { setDeliveryProfile(null); return; }
    getDeliveryProfile(order.deliveryId).then(setDeliveryProfile).catch(() => setDeliveryProfile(null));
  }, [order?.deliveryId]);

  // The client can only reply inside a conversation the delivery person already
  // started — never create one from here (see Lot chat: asymmetric initiation).
  useEffect(() => {
    if (!user || !order?.deliveryId) { setDeliveryConversationId(null); return; }
    conversationExistsForOrder(order.id).then(setDeliveryConversationId).catch(() => setDeliveryConversationId(null));
  }, [user, order?.deliveryId, order?.id]);

  useEffect(() => {
    if (order?.status !== 'delivered' || !orderId) return;
    getReviewForOrder(orderId)
      .then((review) => { setSubmittedReview(review); setReviewChecked(true); })
      .catch(() => setReviewChecked(true));
  }, [order?.status, orderId]);

  async function handleSubmitReview(rating: number, comment: string) {
    if (!user || !order) return;
    try {
      await addReview({
        orderId: order.id,
        clientId: user.uid,
        clientName: user.name,
        deliveryId: order.deliveryId ?? '',
        rating,
        comment,
      });
      const review = await getReviewForOrder(order.id);
      setSubmittedReview(review);
    } catch {
      Alert.alert('Erreur', "Votre avis n'a pas pu être envoyé.");
    }
  }

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <AmbientBackground />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </View>
    );
  }

  const currentStep = statusToStep(order.status);
  const isTerminal = order.status === 'rejected' || order.status === 'cancelled';
  const activeStep = isTerminal
    ? { label: ORDER_STATUS_CONFIG[order.status].label, color: ORDER_STATUS_CONFIG[order.status].color }
    : STEPS[currentStep];

  const minutesAgo = order.createdAt
    ? Math.round((Date.now() - order.createdAt.toMillis()) / 60000)
    : 0;
  const timeLabel =
    minutesAgo < 60
      ? `Il y a ${minutesAgo} min`
      : `Il y a ${Math.round(minutesAgo / 60)}h`;

  const updatedAtLabel = order.updatedAt
    ? new Date(order.updatedAt.toMillis()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : null;
  const deliveryFee = order.deliveryFee ?? 0;
  const subtotal = (order.totalPrice ?? 0) - deliveryFee;

  const displaySteps = order.status === 'cancelled'
    ? CANCELLED_STEPS
    : order.status === 'rejected'
      ? REJECTED_STEPS
      : STEPS;
  const displayCurrentStep = isTerminal ? 1 : currentStep;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <AmbientBackground />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <IconChevronLeft size={18} color={colors.text.secondary} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.heading}>Suivi de commande</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Order info card */}
        <GlassCard strong style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <Text style={styles.infoRef}>#{order.id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.infoMeta} numberOfLines={1}>{order.pharmacyName} · {timeLabel}</Text>
              {!!order.pharmacyAddress && (
                <Text style={styles.infoMeta} numberOfLines={1}>{order.pharmacyAddress}</Text>
              )}
            </View>
            <View style={[styles.statusPill, { borderColor: `${activeStep.color}40`, backgroundColor: `${activeStep.color}15` }]}>
              <View style={[styles.statusDot, { backgroundColor: activeStep.color }]} />
              <Text style={[styles.statusLabel, { color: activeStep.color }]} numberOfLines={1}>
                {activeStep.label}
              </Text>
            </View>
          </View>

          <View style={styles.infoMetaRow}>
            <View style={styles.infoMetaItem}>
              <IconClock size={12} color={colors.text.tertiary} strokeWidth={1.8} />
              <Text style={styles.infoMetaText}>
                {order.status === 'delivered'
                  ? 'Livrée'
                  : order.status === 'in_delivery'
                    ? 'En cours de livraison'
                    : '~20-40 min estimés'}
              </Text>
            </View>
            <View style={styles.infoMetaItem}>
              <IconMapPin size={12} color={colors.text.tertiary} strokeWidth={1.8} />
              <Text style={styles.infoMetaText}>Livraison à domicile</Text>
            </View>
          </View>
        </GlassCard>

        {/* Motif de refus */}
        {order.status === 'rejected' && (
          <Text style={styles.refusalReason}>
            Motif : {order.refusalReason ?? 'Non renseigné'}
            {updatedAtLabel ? ` · Refusée le ${updatedAtLabel}` : ''}
          </Text>
        )}

        {/* Annulation */}
        {order.status === 'cancelled' && updatedAtLabel && (
          <Text style={styles.refusalReason}>Annulée le {updatedAtLabel}</Text>
        )}

        {/* Annulation — uniquement si en attente */}
        {order.status === 'pending' && (
          <Pressable onPress={handleCancel} style={styles.cancelBtn} disabled={cancelling}>
            <Text style={styles.cancelBtnText}>
              {cancelling ? 'Annulation…' : 'Annuler la commande'}
            </Text>
          </Pressable>
        )}

        {/* Code de vérification à remettre au livreur */}
        {order.status === 'in_delivery' && order.deliveryCode && (
          <DeliveryCodeCard code={order.deliveryCode} />
        )}

        {/* Livreur assigné */}
        {(order.status === 'in_delivery' || order.status === 'delivered') && deliveryProfile && (
          <DeliveryPersonCard
            name={deliveryProfile.name}
            rating={deliveryProfile.rating}
            onContact={
              deliveryConversationId
                ? () => router.push({ pathname: '/(client)/conversation' as never, params: { conversationId: deliveryConversationId } })
                : undefined
            }
          />
        )}

        {/* Facture PDF */}
        {order.status === 'delivered' && (
          <Pressable onPress={handleDownloadInvoice} disabled={generatingInvoice} style={({ pressed }) => pressed && { opacity: 0.8 }}>
            <GlassCard style={styles.invoiceBtn}>
              <IconDocument size={17} color={colors.amberBright} strokeWidth={1.8} />
              <Text style={styles.invoiceBtnText}>
                {generatingInvoice ? 'Génération…' : 'Télécharger la facture'}
              </Text>
            </GlassCard>
          </Pressable>
        )}

        {/* Évaluation après livraison */}
        {order.status === 'delivered' && order.deliveryId && reviewChecked && (
          submittedReview ? <SubmittedReviewCard review={submittedReview} /> : <ReviewForm onSubmit={handleSubmitReview} />
        )}

        {/* Progress steps */}
        <GlassCard style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Progression</Text>
          <View style={styles.stepsList}>
            {displaySteps.map((step, i) => (
              <StepRow
                key={step.status}
                step={step}
                index={i}
                currentStep={displayCurrentStep}
                isLast={i === displaySteps.length - 1}
              />
            ))}
          </View>
        </GlassCard>

        {/* Adresse de livraison */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Adresse de livraison</Text>
        </View>
        <GlassCard style={styles.addressCard}>
          <IconMapPin size={17} color={colors.amberBright} strokeWidth={1.7} />
          <Text style={styles.addressText}>
            {order.deliveryAddress
              ? `${order.deliveryAddress.street}, ${order.deliveryAddress.zipCode} ${order.deliveryAddress.city}`
              : 'Non renseignée'}
          </Text>
        </GlassCard>

        {/* Ordonnances — toujours visibles si transmises, quel que soit le statut */}
        {(order.ordonnances?.length ?? 0) > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>
                Ordonnance{(order.ordonnances?.length ?? 0) > 1 ? 's' : ''}
              </Text>
            </View>
            {order.ordonnances.map((ord, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  if (ord.type === 'pdf') {
                    handleOpenPdf(ord.base64, ord.name ?? 'ordonnance.pdf');
                  } else {
                    setShowRxModal(true);
                  }
                }}
              >
                <GlassCard style={styles.addressCard}>
                  <IconDocument size={17} color={colors.sage} strokeWidth={1.7} />
                  <Text style={styles.addressText}>{ord.title}</Text>
                  <IconChevronRight size={14} color={colors.text.tertiary} strokeWidth={2} />
                </GlassCard>
              </Pressable>
            ))}
          </>
        )}

        <Modal visible={showRxModal} transparent animationType="fade" onRequestClose={() => setShowRxModal(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowRxModal(false)}>
            {(() => {
              const imgOrd = order.ordonnances?.find((o) => o.type === 'image');
              if (!imgOrd) return null;
              return (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${imgOrd.base64}` }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              );
            })()}
          </Pressable>
        </Modal>

        {/* Items */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Articles commandés</Text>
        </View>
        <GlassCard style={styles.itemsCard}>
          {order.items.map((item, i) => (
            <View
              key={i}
              style={[
                styles.itemRow,
                i < order.items.length - 1 && styles.itemBorder,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemUnitPrice}>{(item.price ?? 0).toFixed(2)} € / unité</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemQty}>×{item.quantity}</Text>
                <Text style={styles.itemPrice}>
                  {((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)} €
                </Text>
              </View>
            </View>
          ))}
          <View style={[styles.itemRow, styles.itemBorder]}>
            <Text style={styles.itemUnitPrice}>Sous-total médicaments</Text>
            <Text style={styles.itemPrice}>{subtotal.toFixed(2)} €</Text>
          </View>
          <View style={[styles.itemRow, styles.itemBorder]}>
            <Text style={styles.itemUnitPrice}>Frais de livraison</Text>
            <Text style={styles.itemPrice}>{deliveryFee.toFixed(2)} €</Text>
          </View>
          <View style={[styles.itemRow, styles.itemTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{(order.totalPrice ?? 0).toFixed(2)} €</Text>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg.surface },
    content: { paddingHorizontal: Spacing.xl },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 14,
      color: colors.text.tertiary,
    },
    topbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.bg.card,
      borderWidth: 1,
      borderColor: colors.border.glass,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heading: {
      fontFamily: FontFamily.serif,
      fontSize: 18,
      color: colors.text.primary,
    },
    infoCard: {
      padding: 18,
      borderRadius: Radius.lg,
      gap: 14,
      marginBottom: 14,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
    },
    infoRowLeft: {
      flex: 1,
    },
    infoRef: {
      fontFamily: FontFamily.sansBold,
      fontSize: 17,
      color: colors.text.primary,
      marginBottom: 4,
    },
    infoMeta: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.tertiary,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderWidth: 1,
      borderRadius: Radius.pill,
      paddingVertical: 6,
      paddingHorizontal: 11,
      flexShrink: 0,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusLabel: {
      fontFamily: FontFamily.sansBold,
      fontSize: 11.5,
    },
    infoMetaRow: {
      flexDirection: 'row',
      gap: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border.glass,
      paddingTop: 12,
    },
    infoMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    infoMetaText: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.secondary,
    },
    refusalReason: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12.5,
      color: '#f0a89e',
      marginBottom: 14,
    },
    cancelBtn: {
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: 'rgba(224,122,107,0.25)',
      backgroundColor: 'rgba(224,122,107,0.10)',
      marginBottom: 20,
    },
    cancelBtnText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13.5,
      color: '#f0a89e',
    },
    stepsCard: {
      padding: 18,
      borderRadius: Radius.lg,
      gap: 16,
      marginBottom: 20,
    },
    stepsTitle: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 11,
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    stepsList: { gap: 0 },
    sectionHeader: { marginBottom: 10 },
    sectionLabel: {
      fontFamily: FontFamily.sansExtraBold,
      fontSize: 11,
      color: colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    itemsCard: {
      borderRadius: Radius.lg,
      overflow: 'hidden',
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 16,
    },
    itemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border.glass,
    },
    itemTotal: {
      borderTopWidth: 1,
      borderTopColor: colors.border.glassStrong,
      backgroundColor: 'rgba(255,255,255,0.02)',
    },
    itemName: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13.5,
      color: colors.text.primary,
    },
    itemUnitPrice: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 11.5,
      color: colors.text.tertiary,
      marginTop: 1,
      flex: 1,
    },
    addressCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      padding: 14,
      borderRadius: Radius.md,
      marginBottom: 14,
    },
    invoiceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      padding: 14,
      borderRadius: Radius.md,
      marginBottom: 14,
      borderColor: 'rgba(235,162,78,0.30)',
    },
    invoiceBtnText: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13.5,
      color: colors.amberBright,
    },
    addressText: {
      flex: 1,
      fontFamily: FontFamily.sansMedium,
      fontSize: 13,
      color: colors.text.primary,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalImage: {
      width: '92%',
      height: '80%',
    },
    itemRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    itemQty: {
      fontFamily: FontFamily.sansMedium,
      fontSize: 12,
      color: colors.text.tertiary,
    },
    itemPrice: {
      fontFamily: FontFamily.sansBold,
      fontSize: 13.5,
      color: colors.text.primary,
    },
    totalLabel: {
      fontFamily: FontFamily.sansBold,
      fontSize: 15,
      color: colors.text.primary,
    },
    totalValue: {
      fontFamily: FontFamily.serif,
      fontSize: 20,
      color: colors.amberBright,
    },
  });
}

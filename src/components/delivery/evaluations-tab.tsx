import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconStar } from '@/components/icons';
import { GlassCard } from '@/components/ui/glass-card';
import { SkeletonList } from '@/components/ui/skeleton-loader';
import { FontFamily, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { listenDeliveryReviews, respondToReview, type ReviewDoc } from '@/services/reviews';

function anonymize(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length < 2) return name;
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

function StarRow({ rating }: { rating: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar key={i} size={13} color={i <= rating ? colors.amberBright : colors.border.glassStrong} />
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: ReviewDoc }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [responding, setResponding] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dateLabel = review.createdAt
    ? new Date(review.createdAt.toMillis()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    : '';

  async function handleSendResponse() {
    if (!responseText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await respondToReview(review.id, responseText);
      setResponding(false);
    } catch {
      Alert.alert('Erreur', "La réponse n'a pas pu être envoyée.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardAuthor}>{anonymize(review.clientName)}</Text>
        <Text style={styles.cardDate}>{dateLabel}</Text>
      </View>
      <StarRow rating={review.rating} />
      {review.comment ? <Text style={styles.cardComment}>{review.comment}</Text> : null}

      {review.deliveryResponse ? (
        <View style={styles.responseBlock}>
          <Text style={styles.responseLabel}>Votre réponse</Text>
          <Text style={styles.responseText}>{review.deliveryResponse}</Text>
        </View>
      ) : responding ? (
        <View style={styles.responseForm}>
          <TextInput
            style={styles.responseInput}
            value={responseText}
            onChangeText={setResponseText}
            placeholder="Répondre à cet avis…"
            placeholderTextColor={colors.text.tertiary}
            multiline
          />
          <View style={styles.responseFormActions}>
            <Pressable onPress={() => setResponding(false)} style={styles.responseCancelBtn}>
              <Text style={styles.responseCancelText}>Annuler</Text>
            </Pressable>
            <Pressable onPress={handleSendResponse} style={styles.responseSendBtn} disabled={submitting}>
              <Text style={styles.responseSendText}>{submitting ? 'Envoi…' : 'Envoyer'}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setResponding(true)} style={styles.respondBtn}>
          <Text style={styles.respondBtnText}>Répondre</Text>
        </Pressable>
      )}
    </GlassCard>
  );
}

export function EvaluationsTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = listenDeliveryReviews(user.uid, (data) => {
      setReviews(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const average = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Évaluations</Text>

        <GlassCard strong style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{average}</Text>
          <StarRow rating={Math.round(Number(average))} />
          <Text style={styles.summaryLabel}>{reviews.length} évaluation{reviews.length > 1 ? 's' : ''}</Text>
        </GlassCard>

        {loading ? <SkeletonList /> : (
        <View style={styles.list}>
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
          {reviews.length === 0 && (
            <Text style={styles.emptyText}>Aucune évaluation reçue pour le moment</Text>
          )}
        </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl },
  heading: {
    fontFamily: FontFamily.serif,
    fontSize: 27,
    color: colors.text.primary,
    letterSpacing: -0.27,
    marginBottom: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: Radius.xl,
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  summaryValue: {
    fontFamily: FontFamily.serif,
    fontSize: 34,
    color: colors.amberBright,
  },
  summaryLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12.5,
    color: colors.text.tertiary,
  },
  starRow: {
    flexDirection: 'row',
    gap: 3,
  },
  list: { gap: 9 },
  card: {
    padding: 14,
    borderRadius: Radius.lg,
    gap: 7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAuthor: {
    fontFamily: FontFamily.sansBold,
    fontSize: 13.5,
    color: colors.text.primary,
  },
  cardDate: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11.5,
    color: colors.text.tertiary,
  },
  cardComment: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
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
    fontSize: 10,
    color: colors.amberBright,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  responseText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12.5,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  respondBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: 'rgba(235,162,78,0.25)',
  },
  respondBtnText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 11.5,
    color: colors.amberBright,
  },
  responseForm: {
    gap: 8,
  },
  responseInput: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 13,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.glass,
    borderRadius: Radius.md,
    padding: 10,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  responseFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  responseCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  responseCancelText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  responseSendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: colors.amberBright,
  },
  responseSendText: {
    fontFamily: FontFamily.sansBold,
    fontSize: 12,
    color: '#221204',
  },
  emptyText: {
    fontFamily: FontFamily.sans,
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingTop: 40,
  },
  });
}

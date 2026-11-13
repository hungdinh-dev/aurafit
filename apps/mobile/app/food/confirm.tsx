import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BackHeader } from '@/features/coach/components/BackHeader';
import { draftFromAnalysis, type MealDraft, type MealSlot } from '@/features/nutrition/analysis';
import { QuotaExceededError, uploadMealPhoto, useAnalyzePhoto, useSaveMeal } from '@/features/nutrition/api';
import { DraftEditor, useDraftEditing } from '@/features/nutrition/components/DraftEditor';
import { compressMealPhoto, useMealDraft } from '@/features/nutrition/draft';
import { useAuth } from '@/lib/auth';
import { Button, Card, Chip, Screen, Text, haptics, radii, spacing, useTheme } from '@/ui';

type Stage = 'idle' | 'uploading' | 'analyzing';

/** Xác nhận món (NUT-02 / NUT-03 / NUT-05): photo → compress → upload → analyze-meal → edit → save. */
export default function ConfirmMealScreen() {
  const { t } = useTranslation(['nutrition', 'common']);
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const pending = useMealDraft((s) => s.pendingPhoto);
  const draft = useMealDraft((s) => s.draft);
  const setDraft = useMealDraft((s) => s.setDraft);
  const clear = useMealDraft((s) => s.clear);
  const editing = useDraftEditing(draft);
  const analyze = useAnalyzePhoto();
  const save = useSaveMeal();
  const [stage, setStage] = useState<Stage>('idle');
  const started = useRef(false);

  const pipeline = useMutation({
    mutationFn: async (input: { uri: string; slot: MealSlot; photoPath?: string | null; reanalyze?: boolean }) => {
      if (!user) throw new Error('not_signed_in');
      let path = input.photoPath ?? null;
      if (!path) {
        setStage('uploading');
        const small = await compressMealPhoto(input.uri);
        path = await uploadMealPhoto(user.id, small);
      }
      setStage('analyzing');
      const res = await analyze.mutateAsync({ photoPath: path, slot: input.slot, reanalyze: input.reanalyze });
      return draftFromAnalysis(res, { source: 'photo', slot: input.slot, photoPath: path });
    },
    onSuccess: (d: MealDraft) => {
      setDraft(d);
      haptics.success();
    },
    onError: () => haptics.error(),
    onSettled: () => setStage('idle'),
  });

  useEffect(() => {
    if (pending && !draft && !started.current && user) {
      started.current = true;
      pipeline.mutate({ uri: pending.uri, slot: pending.slot });
    }
  }, [pending, draft, user, pipeline]);

  const slot = draft?.slot ?? pending?.slot ?? 'snack';
  const meal = t(`nutrition:mealsLower.${slot}`);
  const busy = pipeline.isPending;
  const confidencePct = draft?.confidence != null ? Math.round(draft.confidence * 100) : null;
  const error = pipeline.error;

  const onSave = () => {
    if (!draft || !editing.computed) return;
    save.mutate(
      {
        slot: draft.slot,
        source: 'photo',
        items: editing.computed.items,
        photoPath: draft.photoPath,
        aiRequestId: draft.aiRequestId,
        saveAs: editing.saveToLibrary ? editing.saveName || draft.items[0]?.name : null,
      },
      {
        onSuccess: () => {
          haptics.success();
          clear();
          router.back();
        },
        onError: () => haptics.error(),
      },
    );
  };

  return (
    <>
      <BackHeader />
      <Screen title={t(`nutrition:meals.${slot}`)} eyebrow={t('nutrition:confirm.title')}>
        {pending ? (
          <View style={[styles.photo, { backgroundColor: colors.surfaceNested }]}>
            <Image source={{ uri: pending.uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
            {confidencePct != null ? (
              <View style={styles.chip}>
                <Chip
                  label={
                    draft?.lowConfidence
                      ? t('nutrition:confirm.lowConfidence', { pct: confidencePct })
                      : t('nutrition:confirm.confidence', { pct: confidencePct })
                  }
                  symbol="sparkles"
                  selected={!draft?.lowConfidence}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {!pending && !draft ? (
          <Text variant="body" color="secondary">
            {t('nutrition:confirm.noDraft')}
          </Text>
        ) : null}

        {busy ? (
          <Card style={styles.row}>
            <ActivityIndicator color={colors.tint} />
            <Text variant="subheadline" color="secondary" accessibilityLiveRegion="polite">
              {stage === 'uploading' ? t('nutrition:confirm.uploading') : t('nutrition:confirm.analyzing')}
            </Text>
          </Card>
        ) : null}

        {error ? (
          <Card style={{ gap: spacing.md }}>
            <Text variant="subheadline" color="destructive">
              {error instanceof QuotaExceededError ? t('nutrition:confirm.quotaExceeded') : t('nutrition:confirm.error')}
            </Text>
            {pending && !(error instanceof QuotaExceededError) ? (
              <Button
                title={t('common:actions.retry')}
                variant="tinted"
                size="medium"
                onPress={() => pipeline.mutate({ uri: pending.uri, slot: pending.slot })}
              />
            ) : null}
          </Card>
        ) : null}

        {draft && !draft.isFood ? (
          <Text variant="subheadline" color="warning">
            {t('nutrition:confirm.notFood')}
          </Text>
        ) : null}

        {draft && draft.items.length > 0 ? (
          <>
            <Text variant="title">{draft.items.map((i) => i.name).join(' · ')}</Text>
            {draft.notes ? (
              <Text variant="footnote" color="secondary">
                {draft.notes}
              </Text>
            ) : null}
            <DraftEditor draft={draft} editing={editing} />
            <View style={styles.buttons}>
              <Button
                title={t('nutrition:confirm.reanalyze')}
                variant="gray"
                size="medium"
                symbol="arrow.clockwise"
                disabled={busy || save.isPending}
                onPress={() =>
                  pending &&
                  pipeline.mutate({ uri: pending.uri, slot, photoPath: draft.photoPath, reanalyze: true })
                }
              />
            </View>
            {save.isError ? (
              <Text variant="footnote" color="destructive">
                {t('nutrition:confirm.saveError')}
              </Text>
            ) : null}
            <Button
              title={t('nutrition:confirm.save', { meal })}
              loading={save.isPending}
              disabled={busy}
              onPress={onSave}
            />
          </>
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  photo: { height: 180, borderRadius: radii.inner + 6, overflow: 'hidden' },
  chip: { position: 'absolute', left: spacing.md, bottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  buttons: { flexDirection: 'row', justifyContent: 'center' },
});

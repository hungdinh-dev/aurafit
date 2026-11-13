import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BackHeader } from '@/features/coach/components/BackHeader';
import { localNowMin } from '@/features/coach/lib/clock';
import { asMealSlot, draftFromAnalysis, slotForTime, type MealDraft } from '@/features/nutrition/analysis';
import { QuotaExceededError, useAnalyzeText, useSaveMeal } from '@/features/nutrition/api';
import { DraftEditor, useDraftEditing } from '@/features/nutrition/components/DraftEditor';
import { useAuth } from '@/lib/auth';
import { Button, Screen, Text, TextField, haptics } from '@/ui';

/** Mô tả bữa ăn (NUT-04): text (or keyboard dictation) → analyze-text → edit → save. */
export default function TextLogScreen() {
  const { t } = useTranslation(['nutrition', 'common']);
  const router = useRouter();
  const params = useLocalSearchParams<{ slot?: string }>();
  const { user } = useAuth();
  const slot = params.slot ? asMealSlot(params.slot) : slotForTime(localNowMin());
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<MealDraft | null>(null);
  const editing = useDraftEditing(draft);
  const analyze = useAnalyzeText();
  const save = useSaveMeal();
  const meal = t(`nutrition:mealsLower.${slot}`);

  const run = () =>
    analyze.mutate(
      { text, slot },
      {
        onSuccess: (res) => {
          haptics.success();
          setDraft(draftFromAnalysis(res, { source: 'text', slot }));
        },
        onError: () => haptics.error(),
      },
    );

  const onSave = () => {
    if (!draft || !editing.computed) return;
    save.mutate(
      {
        slot,
        source: 'text',
        items: editing.computed.items,
        aiRequestId: draft.aiRequestId,
        saveAs: editing.saveToLibrary ? editing.saveName || draft.items[0]?.name : null,
      },
      {
        onSuccess: () => {
          haptics.success();
          router.back();
        },
        onError: () => haptics.error(),
      },
    );
  };

  return (
    <>
      <BackHeader />
      <Screen title={t('nutrition:text.title')}>
        <Text variant="subheadline" color="secondary">
          {t('nutrition:text.prompt')}
        </Text>
        <TextField
          value={text}
          onChangeText={setText}
          placeholder={t('nutrition:text.placeholder')}
          accessibilityLabel={t('nutrition:text.title')}
          multiline
          maxLength={1000}
          style={{ minHeight: 110, textAlignVertical: 'top', paddingTop: 14 }}
        />
        {!user ? (
          <Text variant="footnote" color="secondary">
            {t('nutrition:add.previewOnly')}
          </Text>
        ) : null}
        <Button
          title={draft ? t('nutrition:text.reanalyze') : t('nutrition:text.analyze')}
          variant={draft ? 'gray' : 'filled'}
          symbol="sparkles"
          loading={analyze.isPending}
          disabled={!user || text.trim().length < 2}
          onPress={run}
        />
        {analyze.isError ? (
          <Text variant="footnote" color="destructive">
            {analyze.error instanceof QuotaExceededError ? t('nutrition:confirm.quotaExceeded') : t('nutrition:confirm.error')}
          </Text>
        ) : null}
        {draft ? (
          <>
            <Text variant="footnote" color="secondary">
              {t('nutrition:text.result', { count: draft.items.length })}
            </Text>
            <DraftEditor draft={draft} editing={editing} />
            {save.isError ? (
              <Text variant="footnote" color="destructive">
                {t('nutrition:confirm.saveError')}
              </Text>
            ) : null}
            <Button
              title={t('nutrition:confirm.save', { meal })}
              loading={save.isPending}
              disabled={draft.items.length === 0}
              onPress={onSave}
            />
          </>
        ) : null}
      </Screen>
    </>
  );
}

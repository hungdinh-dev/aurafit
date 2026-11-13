import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import { useFormat } from '@/features/coach/lib/format';
import {
  Card,
  GroupedList,
  ListRow,
  SegmentedControl,
  Stepper,
  Text,
  TextField,
  spacing,
  useTheme,
} from '@/ui';

import { computeDraft, defaultAnswers, type MealDraft } from '../analysis';

/** Editing state of a draft: clarifying answers (on device), portion, "save to My foods". */
export function useDraftEditing(draft: MealDraft | null) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => (draft ? defaultAnswers(draft.questions) : {}));
  const [portion, setPortion] = useState(1);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [prevDraft, setPrevDraft] = useState(draft);
  if (draft !== prevDraft) {
    // New analysis → reset answers to the AI defaults (render-time state sync, no effect).
    setPrevDraft(draft);
    setAnswers(draft ? defaultAnswers(draft.questions) : {});
    setPortion(1);
    setSaveName(draft?.items[0]?.name ?? '');
  }
  const computed = useMemo(() => (draft ? computeDraft(draft, answers, portion) : null), [draft, answers, portion]);
  return { answers, setAnswers, portion, setPortion, saveToLibrary, setSaveToLibrary, saveName, setSaveName, computed };
}

export type DraftEditing = ReturnType<typeof useDraftEditing>;

const signed = (n: number) => (n === 0 ? '±0' : `${n > 0 ? '+' : '−'}${Math.abs(n)}`);

/** Totals, clarifying questions (≤ 3), items, portion and "save to My foods" (NUT-03 / NUT-05). */
export function DraftEditor({ draft, editing }: { draft: MealDraft; editing: DraftEditing }) {
  const { t } = useTranslation(['nutrition', 'common', 'today']);
  const { colors } = useTheme();
  const f = useFormat();
  const totals = editing.computed?.totals;

  return (
    <View style={styles.gap}>
      {totals ? (
        <Card>
          <View style={styles.totalsRow}>
            <Text variant="metricLarge">{f.num(totals.kcal)}</Text>
            <Text variant="headline" color="secondary">
              {t('nutrition:kcal')}
            </Text>
          </View>
          <View style={styles.macros}>
            <Text variant="subheadline" color={colors.data.protein} weight="600">
              {t('nutrition:macroShort.protein', { g: f.num(totals.protein_g, 1) })}
            </Text>
            <Text variant="subheadline" color={colors.data.carb} weight="600">
              {t('nutrition:macroShort.carb', { g: f.num(totals.carb_g, 1) })}
            </Text>
            <Text variant="subheadline" color={colors.data.fat} weight="600">
              {t('nutrition:macroShort.fat', { g: f.num(totals.fat_g, 1) })}
            </Text>
            <Text variant="subheadline" color={colors.data.sugar} weight="600">
              {t('nutrition:macroShort.sugar', { g: f.num(totals.sugar_g, 1) })}
            </Text>
          </View>
        </Card>
      ) : null}

      {draft.questions.map((q) => (
        <View key={q.id} style={styles.question}>
          <Text variant="footnote" color="secondary" style={styles.caption}>
            {q.question}
          </Text>
          <SegmentedControl
            accessibilityLabel={q.question}
            value={editing.answers[q.id] ?? ''}
            onChange={(v) => editing.setAnswers((a) => ({ ...a, [q.id]: v }))}
            options={q.labels.map((o) => ({
              value: o.id,
              label: `${o.label} ${signed(o.kcalDelta)}`,
              accessibilityLabel: t('nutrition:confirm.optionA11y', { label: o.label, delta: signed(o.kcalDelta) }),
            }))}
          />
        </View>
      ))}

      <GroupedList header={t('nutrition:confirm.items')}>
        {(editing.computed?.items ?? []).map((item, i) => (
          <ListRow
            key={`${item.name}-${i}`}
            title={item.name}
            subtitle={item.portionText ?? undefined}
            value={t('nutrition:kcalValue', { kcal: f.num(item.final.kcal) })}
          />
        ))}
      </GroupedList>

      <GroupedList>
        <ListRow
          title={t('nutrition:confirm.portion')}
          trailing={
            <Stepper
              value={editing.portion}
              onChange={editing.setPortion}
              min={0.5}
              max={4}
              step={0.5}
              format={(v) => t('nutrition:confirm.portionValue', { value: f.num(v, 1) })}
              accessibilityLabel={t('nutrition:confirm.portion')}
              decrementLabel={t('common:actions.decrease')}
              incrementLabel={t('common:actions.increase')}
            />
          }
        />
        <ListRow
          title={t('nutrition:confirm.saveToLibrary')}
          trailing={
            <Switch
              value={editing.saveToLibrary}
              onValueChange={editing.setSaveToLibrary}
              trackColor={{ true: colors.success, false: colors.fill }}
              accessibilityLabel={t('nutrition:confirm.saveToLibrary')}
            />
          }
        />
      </GroupedList>
      {editing.saveToLibrary ? (
        <TextField
          value={editing.saveName}
          onChangeText={editing.setSaveName}
          maxLength={120}
          accessibilityLabel={t('nutrition:confirm.saveToLibrary')}
          placeholder={draft.items[0]?.name}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.lg },
  totalsRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  macros: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xs },
  question: { gap: 6 },
  caption: { paddingHorizontal: spacing.lg },
});

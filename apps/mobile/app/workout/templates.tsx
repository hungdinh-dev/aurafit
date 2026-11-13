import { workout } from '@aurafit/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useCanSync, useCreateProgram, useGymProfile, useTrainingPrefs } from '@/features/workout/api';
import { useCatalogNames } from '@/features/workout/catalog';
import { PreviewNote, PushedHeader } from '@/features/workout/components/common';
import { useWorkoutStore } from '@/features/workout/store';
import { useStartWorkout } from '@/features/workout/useWorkoutActions';
import { adaptSession } from '@/features/workout/plan';
import { plannedFromTemplate } from '@/features/workout/sessionLogic';
import { Button, Card, Chip, MIN_TOUCH, Screen, SegmentedControl, Text, haptics, spacing, useTheme } from '@/ui';

/** Giáo án – Templates mockup: 7 templates, weekday vs rotation (WRK-20 / WRK-15), generate (WRK-03). */
export default function TemplatesScreen() {
  const { t } = useTranslation('workout');
  const { colors } = useTheme();
  const names = useCatalogNames();
  const canSync = useCanSync();
  const kind = useWorkoutStore((s) => s.profileKind);
  const { profile } = useGymProfile(kind);
  const prefs = useTrainingPrefs();
  const create = useCreateProgram();
  const starter = useStartWorkout();
  const [slug, setSlug] = useState<workout.TemplateSlug>(() =>
    workout.chooseTemplate({ daysPerWeek: 3, availableEquipment: profile.equipment })
  );
  const [mode, setMode] = useState<workout.ScheduleMode>('rotation');
  const template = workout.getTemplate(slug);
  const [days, setDays] = useState(template.daysPerWeek);
  const dayOptions = template.supportedDays.includes(days) ? days : template.daysPerWeek;
  const weekdays = workout.defaultWeekdays(dayOptions);
  const weekdayText = weekdays
    .map((d, i) => {
      const session = template.sessions[i % template.sessions.length]!;
      return `${t(`weekdayShort.${d}` as 'weekdayShort.1')} ${names.templateSession(slug, session.rotationIndex)}`;
    })
    .join(' · ');

  const use = async () => {
    haptics.light();
    if (!canSync) {
      // Preview: no program can be saved – train the first session of the template right away.
      await starter.start({
        title: names.templateSession(slug, 0),
        exercises: adaptSession(plannedFromTemplate(template.sessions[0]!), profile.equipment).exercises,
        profile,
        plannedSessionId: null,
        programId: null,
        rotationIndex: null,
        rotationCount: null,
        readiness: null,
      });
      return;
    }
    const program = workout.generateProgram({
      goal: prefs.data?.goal ?? 'maintain',
      level: prefs.data?.level ?? template.level,
      daysPerWeek: dayOptions,
      availableEquipment: profile.equipment,
      templateSlug: slug,
      scheduleMode: mode,
    });
    create.mutate(
      { program, sessionName: (idx) => names.templateSession(slug, idx), equipmentProfileId: profile.id },
      {
        onSuccess: () => {
          haptics.success();
          router.back();
        },
        onError: () => haptics.error(),
      }
    );
  };

  return (
    <Screen title={t('templates.title')}>
      <PushedHeader />
      {!canSync ? <PreviewNote text={t('templates.signInNeeded')} /> : null}

      <View style={[styles.list, { backgroundColor: colors.surface }]}>
        {workout.PROGRAM_TEMPLATES.map((tpl, i) => {
          const selected = tpl.slug === slug;
          return (
            <Pressable
              key={tpl.slug}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => {
                haptics.selection();
                setSlug(tpl.slug);
                setDays(tpl.daysPerWeek);
              }}
              style={[
                styles.row,
                { backgroundColor: selected ? colors.surfaceNested : 'transparent' },
                i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator } : null,
              ]}>
              <View
                style={[
                  styles.radio,
                  { borderColor: selected ? colors.tint : colors.separator, backgroundColor: selected ? colors.tint : 'transparent' },
                ]}
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="body" weight="600">
                  {names.templateName(tpl.slug)}
                </Text>
                <Text variant="footnote" color="secondary">
                  {t('templates.meta', {
                    level: t(`level.${tpl.level}`),
                    days: tpl.supportedDays.join('/'),
                    equipment: t(`equipmentKind.${tpl.equipmentKind}`),
                  })}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Card style={{ gap: spacing.md }}>
        <Text variant="subheadline">{names.templateDescription(slug)}</Text>
        <Text variant="footnote" color="secondary">
          {t(`templates.progression.${template.progressionRule}`)} · {t('templates.deload', { count: template.deloadEveryWeeks })}
        </Text>
        {template.supportedDays.length > 1 ? (
          <View style={{ gap: spacing.sm }}>
            <Text variant="footnote" color="secondary">
              {t('templates.daysPerWeek')}
            </Text>
            <View className="flex-row" style={{ gap: spacing.sm }}>
              {template.supportedDays.map((d) => (
                <Chip key={d} label={String(d)} selected={dayOptions === d} onPress={() => setDays(d)} />
              ))}
            </View>
          </View>
        ) : null}
        <SegmentedControl
          options={[
            { value: 'weekday', label: t('templates.mode.weekday') },
            { value: 'rotation', label: t('templates.mode.rotation') },
          ]}
          value={mode}
          onChange={setMode}
        />
        <Text variant="footnote" color="secondary">
          {mode === 'rotation' ? t('templates.rotationBody') : t('templates.weekdayBody', { days: weekdayText })}
        </Text>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Text variant="headline">{t('templates.sessions')}</Text>
        {template.sessions.map((s) => (
          <View key={s.rotationIndex} style={{ gap: 2 }}>
            <Text variant="subheadline" weight="600">
              {names.templateSession(slug, s.rotationIndex)}
            </Text>
            <Text variant="footnote" color="secondary">
              {s.exercises.map((e) => `${names.exercise(e.exerciseSlug)} ${e.sets}×${e.repMin}–${e.repMax}`).join(' · ')}
            </Text>
          </View>
        ))}
      </Card>

      {create.isError ? (
        <Text variant="footnote" color="destructive">
          {t('templates.createError')}
        </Text>
      ) : null}
      <Button
        title={t('templates.use')}
        symbol="checkmark.circle.fill"
        loading={create.isPending || starter.isPending}
        onPress={() => void use()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { borderRadius: 26, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, minHeight: MIN_TOUCH + 16 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
});

import { health, time } from '@aurafit/core';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Switch, View } from 'react-native';

import { StrictnessLockedError, useCoachSettings, useUpdateCoachSettings, type CoachSettingsPatch } from '@/features/coach/api';
import { BackHeader } from '@/features/coach/components/BackHeader';
import { STRICTNESS_LEVELS, VOICES, asStrictness, asVoice } from '@/features/coach/insights';
import { localNowMin, localToday, timeToMin } from '@/features/coach/lib/clock';
import { useWaterToday, useWeighIns } from '@/features/health/api';
import { cancelWaterReminders, scheduleWaterReminders } from '@/features/health/reminders';
import { appleHealthSource } from '@/features/health/sources';
import { useMyProfile } from '@/features/profile/api';
import { useUpdateProfile } from '@/features/settings/api';
import { usePrefs, type Prefs } from '@/features/settings/prefs';
import { LANGUAGES, useLanguage } from '@/i18n';
import { useAuth, useSignOut } from '@/lib/auth';
import { GroupedList, ListRow, Screen, SegmentedControl, Stepper, Text, haptics, spacing, useTheme } from '@/ui';

const STEP = 30;
const fmt = (min: number) => time.formatTimeOfDay(min);

/** Cài đặt (ONB-02, ONB-04, NUT-12, HLT-01, COA-07). */
export default function SettingsScreen() {
  const { t } = useTranslation(['settings', 'coach', 'common', 'health']);
  const router = useRouter();
  const { colors } = useTheme();
  const { user, devPreview } = useAuth();
  const [language, setLanguage] = useLanguage();
  const profile = useMyProfile();
  const updateProfile = useUpdateProfile();
  const settings = useCoachSettings();
  const update = useUpdateCoachSettings();
  const signOut = useSignOut();
  const prefs = usePrefs();
  const today = localToday();
  const water = useWaterToday(today);
  const weighIns = useWeighIns(30);

  const s = settings.data;
  const canEdit = !!user && !!s;
  const strictness = asStrictness(s?.strictness);
  const voice = asVoice(s?.voice);
  const quietStart = timeToMin(s?.quiet_start, 22 * 60 + 30);
  const quietEnd = timeToMin(s?.quiet_end, 6 * 60 + 30);
  const workStart = s?.work_start ? timeToMin(s.work_start, 9 * 60) : null;
  const workEnd = s?.work_end ? timeToMin(s.work_end, 17 * 60 + 30) : null;

  const patch = (p: CoachSettingsPatch) =>
    update.mutate(p, {
      onError: (e) => {
        haptics.error();
        Alert.alert(e instanceof StrictnessLockedError ? t('coach:strictnessLocked') : t('settings:saveError'));
      },
    });

  const switchRow = (key: keyof Prefs, title: string, onChange?: (v: boolean) => void) => (
    <ListRow
      key={key}
      title={title}
      trailing={
        <Switch
          value={prefs[key]}
          accessibilityLabel={title}
          trackColor={{ true: colors.success, false: colors.fill }}
          onValueChange={(v) => {
            haptics.selection();
            prefs.set(key, v);
            onChange?.(v);
          }}
        />
      }
    />
  );

  const onWaterReminders = (enabled: boolean) => {
    if (!enabled) {
      void cancelWaterReminders();
      return;
    }
    const weight = weighIns.data?.at(-1)?.weightKg;
    if (!weight) return;
    void scheduleWaterReminders({
      enabled,
      nowMin: localNowMin(),
      consumedMl: water.data ?? 0,
      targetMl: health.waterTargetMl({ weightKg: weight }),
      strictness,
      quietStartMin: quietStart,
      quietEndMin: quietEnd,
      title: t('health:reminders.waterTitle'),
      body: t('health:reminders.waterBody'),
    }).catch(() => {});
  };

  const timeStepper = (label: string, value: number, onChange: (v: number) => void) => (
    <Stepper
      value={value}
      onChange={(v) => onChange(((v % 1440) + 1440) % 1440)}
      step={STEP}
      format={fmt}
      accessibilityLabel={label}
      decrementLabel={t('settings:earlier')}
      incrementLabel={t('settings:later')}
    />
  );

  const confirmSignOut = () =>
    Alert.alert(t('settings:signOutTitle'), t('settings:signOutBody'), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      { text: t('settings:signOut'), style: 'destructive', onPress: () => signOut.mutate() },
    ]);

  return (
    <>
      <BackHeader />
      <Screen title={t('settings:title')}>
        <GroupedList header={t('settings:account')}>
          <ListRow
            title={t('settings:language')}
            trailing={
              <SegmentedControl
                accessibilityLabel={t('settings:language')}
                segmentWidth={56}
                value={language}
                onChange={(l) => void setLanguage(l)}
                options={LANGUAGES.map((l) => ({
                  value: l,
                  label: t(`common:language.${l}Short`),
                  accessibilityLabel: t(`common:language.${l}`),
                }))}
              />
            }
          />
          <ListRow
            title={t('settings:character')}
            trailing={
              <SegmentedControl
                accessibilityLabel={t('settings:character')}
                segmentWidth={64}
                value={profile.data?.character === 'mira' ? 'mira' : 'kai'}
                onChange={(c) => {
                  if (user) updateProfile.mutate({ character: c, character_name: c === 'mira' ? 'Mira' : 'Kai' });
                }}
                options={[
                  { value: 'kai', label: 'Kai' },
                  { value: 'mira', label: 'Mira' },
                ]}
              />
            }
          />
          <ListRow
            title={t('settings:login')}
            value={user?.email ?? (devPreview ? t('settings:devPreview') : '—')}
          />
        </GroupedList>

        {!canEdit ? (
          <Text variant="footnote" color="secondary">
            {t('settings:previewNote')}
          </Text>
        ) : null}

        <View style={{ gap: 6 }}>
          <Text variant="footnote" color="secondary" style={{ paddingHorizontal: spacing.lg }}>
            {t('settings:groups.coach')}
          </Text>
          <SegmentedControl
            accessibilityLabel={t('settings:strictness')}
            value={strictness}
            onChange={(v) => canEdit && patch({ strictness: v })}
            options={STRICTNESS_LEVELS.map((l) => ({ value: l, label: t(`coach:strictness.${l}`) }))}
          />
          <SegmentedControl
            accessibilityLabel={t('settings:voice')}
            value={voice}
            onChange={(v) => canEdit && patch({ voice: v })}
            options={VOICES.map((v) => ({ value: v, label: t(`coach:voices.${v}`) }))}
          />
        </View>

        <GroupedList footer={t('settings:coachNote')}>
          <ListRow
            title={t('settings:freeDays')}
            trailing={
              <Stepper
                value={s?.free_days_per_week ?? 1}
                onChange={(v) => canEdit && patch({ free_days_per_week: v })}
                min={0}
                max={3}
                format={(v) => String(v)}
                accessibilityLabel={t('settings:freeDays')}
                decrementLabel={t('common:actions.decrease')}
                incrementLabel={t('common:actions.increase')}
              />
            }
          />
          <ListRow
            title={t('settings:freeDayMode')}
            trailing={
              <Switch
                value={s?.free_day_mode !== 'no_compensate'}
                disabled={!canEdit}
                accessibilityLabel={t('settings:freeDayMode')}
                trackColor={{ true: colors.success, false: colors.fill }}
                onValueChange={(v) => patch({ free_day_mode: v ? 'compensate' : 'no_compensate' })}
              />
            }
          />
        </GroupedList>

        <GroupedList header={t('settings:quietHours')} footer={t('settings:remindersNote')}>
          <ListRow
            title={t('settings:quietStart')}
            trailing={timeStepper(t('settings:quietStart'), quietStart, (v) => canEdit && patch({ quiet_start: fmt(v) }))}
          />
          <ListRow
            title={t('settings:quietEnd')}
            trailing={timeStepper(t('settings:quietEnd'), quietEnd, (v) => canEdit && patch({ quiet_end: fmt(v) }))}
          />
        </GroupedList>

        <GroupedList header={t('settings:workHours')}>
          {workStart != null && workEnd != null ? (
            <>
              <ListRow
                title={t('settings:workStart')}
                trailing={timeStepper(t('settings:workStart'), workStart, (v) => canEdit && patch({ work_start: fmt(v) }))}
              />
              <ListRow
                title={t('settings:workEnd')}
                trailing={timeStepper(t('settings:workEnd'), workEnd, (v) => canEdit && patch({ work_end: fmt(v) }))}
              />
              <ListRow
                title={t('settings:clearWorkHours')}
                destructive
                disabled={!canEdit}
                onPress={() => patch({ work_start: null, work_end: null })}
              />
            </>
          ) : (
            <ListRow
              title={t('settings:setWorkHours')}
              value={t('settings:notSet')}
              disabled={!canEdit}
              onPress={() => patch({ work_start: '09:00', work_end: '17:30' })}
            />
          )}
        </GroupedList>

        <GroupedList header={t('settings:groups.nutrition')}>
          {switchRow('showFiber', t('settings:showFiber'))}
          {switchRow('showSodium', t('settings:showSodium'))}
          <ListRow title={t('settings:photoQuota')} value={s ? String(s.photo_quota_per_day) : '—'} />
        </GroupedList>

        <GroupedList header={t('settings:groups.reminders')} footer={t('settings:remindersNote')}>
          {switchRow('waterReminders', t('settings:waterReminders'), onWaterReminders)}
          {switchRow('weighReminders', t('settings:weighReminders'))}
          {switchRow('mealReminders', t('settings:mealReminders'))}
        </GroupedList>

        <GroupedList header={t('settings:groups.privacy')}>
          <ListRow
            icon="heart.fill"
            iconColor={colors.icon.pink}
            title={t('settings:appleHealth')}
            value={appleHealthSource.isAvailable() ? t('health:apple.connected') : t('health:apple.notConnected')}
            onPress={() => router.push('/health/apple-health')}
          />
          <ListRow
            icon="scalemass.fill"
            iconColor={colors.icon.teal}
            title={t('settings:health')}
            onPress={() => router.push('/health/log')}
          />
          <ListRow title={t('settings:signOut')} destructive onPress={confirmSignOut} />
        </GroupedList>
      </Screen>
    </>
  );
}

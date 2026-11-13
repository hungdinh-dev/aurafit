import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { CAPTURE_BUTTON_CLEARANCE } from '@/features/capture/CaptureButton';
import { useLanguage } from '@/i18n';
import {
  Card,
  GlassButton,
  GroupedList,
  ListRow,
  ProgressBar,
  ProgressRing,
  Screen,
  Text,
  spacing,
  useTheme,
} from '@/ui';

const EMPTY = '—';

/** Hôm nay (PRG-01). M0 placeholder showing the layout from Main.dc.html with empty values. */
export default function TodayScreen() {
  const { t } = useTranslation(['today', 'coach', 'health']);
  const [language] = useLanguage();
  const { colors } = useTheme();
  const date = new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const macros = [
    { key: 'protein', color: colors.data.protein },
    { key: 'carb', color: colors.data.carb },
    { key: 'fat', color: colors.data.fat },
    { key: 'sugar', color: colors.data.sugar },
  ] as const;

  return (
    <Screen
      title={t('today:title')}
      eyebrow={date}
      bottomInset={CAPTURE_BUTTON_CLEARANCE}
      headerRight={
        <GlassButton
          symbol="flame.fill"
          label="0"
          color={colors.streak}
          accessibilityLabel={t('coach:streak', { count: 0 })}
        />
      }>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <ProgressRing progress={0} accessibilityLabel={t('today:kcalLeft')}>
          <Text variant="metric">{EMPTY}</Text>
          <Text variant="caption" color="secondary">
            {t('today:kcalLeft')}
          </Text>
        </ProgressRing>
        <View style={{ flex: 1, gap: spacing.sm + 1 }}>
          {macros.map((m) => (
            <View key={m.key} style={{ gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="caption" color="secondary">
                  {t(`today:macros.${m.key}`)}
                </Text>
                <Text variant="caption" weight="600">
                  {EMPTY}
                </Text>
              </View>
              <ProgressBar progress={0} color={m.color} accessibilityLabel={t(`today:macros.${m.key}`)} />
            </View>
          ))}
        </View>
      </Card>

      <GroupedList>
        <ListRow icon="drop.fill" iconColor={colors.icon.blue} title={t('health:water')} value={EMPTY} />
        <ListRow icon="moon.fill" iconColor={colors.icon.indigo} title={t('health:sleep')} value={EMPTY} />
        <ListRow icon="checklist" iconColor={colors.icon.orange} title={t('coach:quests')} value={EMPTY} />
      </GroupedList>
    </Screen>
  );
}

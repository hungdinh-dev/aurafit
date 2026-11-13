import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BackHeader } from '@/features/coach/components/BackHeader';
import { localNowMin } from '@/features/coach/lib/clock';
import { useFormat } from '@/features/coach/lib/format';
import { asMealSlot, barcodeNutrients, slotForTime } from '@/features/nutrition/analysis';
import { useBarcodeProduct, useSaveMeal } from '@/features/nutrition/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, GroupedList, ListRow, Screen, Stepper, Text, haptics, radii, spacing, useTheme } from '@/ui';

const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e'] as const;

/** Quét mã vạch (NUT-07): camera → barcode_products (open food DB cache, no AI) → servings → save. */
export default function BarcodeScreen() {
  const { t } = useTranslation(['nutrition', 'common', 'today']);
  const router = useRouter();
  const { colors } = useTheme();
  const f = useFormat();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ slot?: string }>();
  const slot = params.slot ? asMealSlot(params.slot) : slotForTime(localNowMin());
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState<string | null>(null);
  const [servings, setServings] = useState(1);
  const product = useBarcodeProduct(code);
  const save = useSaveMeal();
  const meal = t(`nutrition:mealsLower.${slot}`);

  const onScanned = (r: BarcodeScanningResult) => {
    if (code || !r.data) return;
    haptics.success();
    setCode(r.data);
  };

  const p = product.data;
  const grams = (p?.serving_g ?? 100) * servings;
  const n = p ? barcodeNutrients(p, grams) : null;

  const onSave = () => {
    if (!p || !n) return;
    save.mutate(
      {
        slot,
        source: 'barcode',
        items: [
          {
            name: [p.brand, p.name].filter(Boolean).join(' ').slice(0, 120) || p.name,
            portionText: t('nutrition:grams', { g: f.num(grams) }),
            nutrients: n,
            final: n,
            confidence: null,
            barcode: p.barcode,
            clarifications: [],
          },
        ],
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

  const nutrientRows = n
    ? [
        { k: t('nutrition:kcal'), v: f.num(n.kcal) },
        { k: t('today:macros.protein'), v: t('nutrition:grams', { g: f.num(n.protein_g, 1) }) },
        { k: t('today:macros.carb'), v: t('nutrition:grams', { g: f.num(n.carb_g, 1) }) },
        { k: t('today:macros.fat'), v: t('nutrition:grams', { g: f.num(n.fat_g, 1) }) },
        { k: t('today:macros.sugar'), v: t('nutrition:grams', { g: f.num(n.sugar_g, 1) }) },
      ]
    : [];

  return (
    <>
      <BackHeader />
      <Screen title={t('nutrition:barcode.title')}>
        {!permission ? null : !permission.granted ? (
          <Card style={{ gap: spacing.md }}>
            <Text variant="body">{t('nutrition:barcode.permission')}</Text>
            <Button title={t('nutrition:barcode.grant')} size="medium" onPress={() => void requestPermission()} />
          </Card>
        ) : !code ? (
          <View style={[styles.camera, { backgroundColor: colors.surfaceNested }]}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
              onBarcodeScanned={onScanned}
            />
            <View pointerEvents="none" style={[styles.frame, { borderColor: colors.tint }]} />
            <Text variant="subheadline" weight="600" color="#FFFFFF" style={styles.hint}>
              {t('nutrition:barcode.hint')}
            </Text>
          </View>
        ) : null}

        {code && product.isLoading ? (
          <Card style={styles.row}>
            <ActivityIndicator color={colors.tint} />
            <Text variant="subheadline" color="secondary">
              {t('nutrition:barcode.looking')}
            </Text>
          </Card>
        ) : null}

        {code && !product.isLoading && !p ? (
          <Card style={{ gap: spacing.md }}>
            <Text variant="body">{product.isError ? t('common:errors.generic') : t('nutrition:barcode.notFound')}</Text>
            <View style={styles.row}>
              <Button title={t('nutrition:barcode.scanAgain')} variant="gray" size="medium" onPress={() => setCode(null)} />
              <Button
                title={t('nutrition:barcode.describe')}
                variant="tinted"
                size="medium"
                onPress={() => router.replace({ pathname: '/food/text', params: { slot } })}
              />
            </View>
          </Card>
        ) : null}

        {p && n ? (
          <>
            <View style={{ gap: spacing.xs }}>
              <Text variant="title">{p.name}</Text>
              <Text variant="footnote" color="secondary">
                {[p.brand, t('nutrition:barcode.servingMeta', { grams: f.num(p.serving_g ?? 100) })].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <GroupedList>
              {nutrientRows.map((r) => (
                <ListRow key={r.k} title={r.k} value={r.v} />
              ))}
            </GroupedList>
            <GroupedList>
              <ListRow
                title={t('nutrition:barcode.servings')}
                trailing={
                  <Stepper
                    value={servings}
                    onChange={setServings}
                    min={0.5}
                    max={5}
                    step={0.5}
                    format={(v) => f.num(v, 1)}
                    accessibilityLabel={t('nutrition:barcode.servings')}
                    decrementLabel={t('common:actions.decrease')}
                    incrementLabel={t('common:actions.increase')}
                  />
                }
              />
            </GroupedList>
            <Button
              title={t('nutrition:barcode.add', { meal })}
              loading={save.isPending}
              disabled={!user}
              onPress={onSave}
            />
            {save.isError ? (
              <Text variant="footnote" color="destructive">
                {t('nutrition:confirm.saveError')}
              </Text>
            ) : null}
            <Button title={t('nutrition:barcode.scanAgain')} variant="plain" size="medium" onPress={() => setCode(null)} />
          </>
        ) : null}

        <Text variant="caption" color="tertiary" align="center">
          {t('nutrition:barcode.source')}
        </Text>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  camera: { height: 300, borderRadius: radii.group, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  frame: { width: '78%', height: 120, borderWidth: 3, borderRadius: radii.inner },
  hint: { position: 'absolute', bottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
});

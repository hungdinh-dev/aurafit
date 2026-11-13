import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { authErrorMessage } from '@/features/auth/errors';
import { useSendEmailOtp, useVerifyEmailOtp } from '@/lib/auth';
import { Button, Screen, Text, TextField, haptics, spacing } from '@/ui';

/** Email OTP: request a 6-digit code, then verify it. The root guard navigates on success. */
export default function SignInScreen() {
  const { t } = useTranslation(['auth', 'common']);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const send = useSendEmailOtp();
  const verify = useVerifyEmailOtp();

  const sendCode = () =>
    send.mutate(email, {
      onSuccess: () => {
        setStep('code');
        setCode('');
      },
      onError: () => haptics.warning(),
    });

  const verifyCode = () =>
    verify.mutate(
      { email, token: code },
      { onSuccess: () => haptics.success(), onError: () => haptics.warning() }
    );

  return (
    <Screen title={t('auth:signIn.title')} gap={spacing.lg}>
      {step === 'email' ? (
        <View style={{ gap: spacing.lg }}>
          <TextField
            label={t('auth:signIn.emailLabel')}
            placeholder={t('auth:signIn.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={sendCode}
            error={send.isError}
            message={send.isError ? authErrorMessage(send.error, t, 'email') : undefined}
          />
          <Button title={t('auth:signIn.sendCode')} loading={send.isPending} onPress={sendCode} />
        </View>
      ) : (
        <View style={{ gap: spacing.lg }}>
          <Text variant="subheadline" color="secondary">
            {t('auth:signIn.codeHint', { email: email.trim() })}
          </Text>
          <TextField
            label={t('auth:signIn.codeLabel')}
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            autoFocus
            numeric
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            style={{ letterSpacing: 8, textAlign: 'center' }}
            error={verify.isError}
            message={verify.isError ? authErrorMessage(verify.error, t, 'code') : undefined}
          />
          <Button
            title={t('auth:signIn.verify')}
            loading={verify.isPending}
            disabled={code.length !== 6}
            onPress={verifyCode}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button title={t('auth:signIn.changeEmail')} variant="plain" size="small" onPress={() => setStep('email')} />
            <Button
              title={t('auth:signIn.resend')}
              variant="plain"
              size="small"
              loading={send.isPending}
              onPress={() => send.mutate(email)}
            />
          </View>
        </View>
      )}
    </Screen>
  );
}

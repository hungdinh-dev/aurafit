// Typed translation keys: t('auth:google') / useTranslation('auth') → t('google') are checked
// against the Vietnamese (source) resources.
import 'i18next';

import type { vi } from './resources';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof vi;
  }
}

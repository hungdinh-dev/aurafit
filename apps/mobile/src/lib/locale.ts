import { time } from '@aurafit/core';
import { getCalendars } from 'expo-localization';

/** IANA time zone of the device, falling back to the product default (Asia/Ho_Chi_Minh). */
export function deviceTimeZone(): string {
  try {
    return getCalendars()[0]?.timeZone ?? time.DEFAULT_TIME_ZONE;
  } catch {
    return time.DEFAULT_TIME_ZONE;
  }
}

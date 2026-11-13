import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { create } from 'zustand';

import type { MealDraft, MealSlot } from './analysis';

/**
 * Hand-off between the add-food sheet and the confirm screen (objects are too big for route
 * params). `pendingPhoto` = picked but not analysed yet; `draft` = analysed / built draft.
 */
type DraftStore = {
  pendingPhoto: { uri: string; slot: MealSlot } | null;
  draft: MealDraft | null;
  setPendingPhoto: (p: { uri: string; slot: MealSlot } | null) => void;
  setDraft: (d: MealDraft | null) => void;
  clear: () => void;
};

export const useMealDraft = create<DraftStore>((set) => ({
  pendingPhoto: null,
  draft: null,
  setPendingPhoto: (pendingPhoto) => set({ pendingPhoto, draft: null }),
  setDraft: (draft) => set({ draft }),
  clear: () => set({ pendingPhoto: null, draft: null }),
}));

/** Longest edge sent to the AI (analyze-meal expects ~1024 px, ≤ 4 MB). */
export const PHOTO_MAX_EDGE = 1024;

export type PhotoPickResult = { uri: string } | { error: 'permission' } | null;

/** Opens the camera or the photo library. `null` = cancelled. */
export async function pickMealPhoto(from: 'camera' | 'library'): Promise<PhotoPickResult> {
  if (from === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { error: 'permission' };
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };
  const result =
    from === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  return asset ? { uri: asset.uri } : null;
}

/** Resizes so the longest edge is ≤ 1024 px and re-encodes as JPEG (~0.7). */
export async function compressMealPhoto(uri: string): Promise<string> {
  const ctx = ImageManipulator.ImageManipulator.manipulate(uri);
  const probe = await ctx.renderAsync();
  const landscape = probe.width >= probe.height;
  const longest = Math.max(probe.width, probe.height);
  if (longest > PHOTO_MAX_EDGE) {
    ctx.resize(landscape ? { width: PHOTO_MAX_EDGE } : { height: PHOTO_MAX_EDGE });
  }
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
  return saved.uri;
}

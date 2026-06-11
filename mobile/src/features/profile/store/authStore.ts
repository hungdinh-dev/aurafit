import { create } from 'zustand';

interface AuthState {
  session: any | null;
  isSandboxBypassed: boolean;
  isOnboarded: boolean;
  setSession: (session: any) => void;
  setSandboxBypassed: (bypassed: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isSandboxBypassed: false,
  isOnboarded: false,
  setSession: (session) => set({ session }),
  setSandboxBypassed: (bypassed) => set({ isSandboxBypassed: bypassed }),
  setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),
}));

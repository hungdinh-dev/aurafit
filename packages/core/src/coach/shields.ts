/**
 * COA-02 – shield fragments → shields (gamification.md §7): ⭐ day = 1 fragment, 3 fragments =
 * 1 shield, max 3 shields, 1 starter shield, monthly gift 1 (gentle 2). Every change produces a
 * `shield_ledger` entry with net deltas so the ledger always sums to the wallet.
 */
import type { ShieldLedgerEntry, ShieldReason } from './types';

export const MAX_SHIELDS = 3;
export const FRAGMENTS_PER_SHIELD = 3;
export const STARTER_SHIELDS = 1;

export interface ShieldWallet {
  shields: number;
  /** 0–2. */
  fragments: number;
}

export interface WalletChange {
  wallet: ShieldWallet;
  ledger: ShieldLedgerEntry[];
  shieldsGained: number;
  /** Fragments that could not be kept because the wallet is full (3 shields + 2 fragments). */
  fragmentsWasted: number;
}

/** Add fragments one by one; a 3rd fragment becomes a shield when below the cap. */
export function addFragments(wallet: ShieldWallet, count: number, reason: ShieldReason, localDate: string): WalletChange {
  let { shields, fragments } = wallet;
  const ledger: ShieldLedgerEntry[] = [];
  let shieldsGained = 0;
  let fragmentsWasted = 0;
  for (let i = 0; i < count; i++) {
    if (fragments + 1 >= FRAGMENTS_PER_SHIELD) {
      if (shields < MAX_SHIELDS) {
        shields += 1;
        shieldsGained += 1;
        ledger.push({ deltaShields: 1, deltaFragments: -fragments, reason, localDate });
        fragments = 0;
      } else {
        // Full wallet: assumption – the fragment is lost (fragments stay ≤ 2 per DB constraint).
        fragmentsWasted += 1;
      }
    } else {
      fragments += 1;
      ledger.push({ deltaShields: 0, deltaFragments: 1, reason, localDate });
    }
  }
  return { wallet: { shields, fragments }, ledger, shieldsGained, fragmentsWasted };
}

/** Grant whole shields (starter, monthly gift), capped at 3. */
export function grantShields(wallet: ShieldWallet, count: number, reason: ShieldReason, localDate: string): WalletChange {
  const granted = Math.max(0, Math.min(count, MAX_SHIELDS - wallet.shields));
  return {
    wallet: { shields: wallet.shields + granted, fragments: wallet.fragments },
    ledger: granted > 0 ? [{ deltaShields: granted, deltaFragments: 0, reason, localDate }] : [],
    shieldsGained: granted,
    fragmentsWasted: 0,
  };
}

/** Spend one shield (protect streak / free day). Returns `null` when none is available. */
export function consumeShield(
  wallet: ShieldWallet,
  reason: Extract<ShieldReason, 'protect_streak' | 'free_day'>,
  localDate: string,
): { wallet: ShieldWallet; entry: ShieldLedgerEntry } | null {
  if (wallet.shields <= 0) return null;
  return {
    wallet: { shields: wallet.shields - 1, fragments: wallet.fragments },
    entry: { deltaShields: -1, deltaFragments: 0, reason, localDate },
  };
}

/** Sum a ledger (audit helper): starting from an empty wallet must give the current wallet. */
export function sumLedger(ledger: readonly ShieldLedgerEntry[]): ShieldWallet {
  return ledger.reduce(
    (w, e) => ({ shields: w.shields + e.deltaShields, fragments: w.fragments + e.deltaFragments }),
    { shields: 0, fragments: 0 },
  );
}

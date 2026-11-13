import { suggestFoods, type SuggestibleFood } from './suggest';

const library: SuggestibleFood[] = [
  { id: 'chicken', kcal: 380, protein_g: 43, carb_g: 0, fat_g: 22, usual_slot: 'lunch', use_count: 10 },
  { id: 'rice', kcal: 260, protein_g: 5, carb_g: 57, fat_g: 0.5, use_count: 20 },
  { id: 'coffee', kcal: 150, protein_g: 2, carb_g: 20, fat_g: 6, sugar_g: 18, usual_slot: 'breakfast', use_count: 30 },
  { id: 'shake', kcal: 200, protein_g: 25, carb_g: 10, fat_g: 4, use_count: 3 },
  { id: 'pho', kcal: 450, protein_g: 25, carb_g: 60, fat_g: 12, use_count: 5 },
];

describe('suggestFoods ("Ăn gì bây giờ?", NUT-10)', () => {
  it('reproduces the docs example: 520 kcal / 42 g → chicken + ½ rice', () => {
    const r = suggestFoods({ remaining: { kcal: 520, protein_g: 42 }, foods: library });
    expect(r.status).toBe('ok');
    const top = r.suggestions[0]!;
    expect(top.parts.map((p) => [p.foodId, p.portion])).toEqual([
      ['chicken', 1],
      ['rice', 0.5],
    ]);
    expect(top.totals.kcal).toBe(510);
    expect(top.totals.protein_g).toBe(45.5);
  });

  it('never exceeds the remaining kcal by more than the tolerance', () => {
    const r = suggestFoods({ remaining: { kcal: 400, protein_g: 30 }, foods: library, limit: 10 });
    for (const s of r.suggestions) expect(s.totals.kcal).toBeLessThanOrEqual(440);
  });

  it('returns distinct food combinations up to the limit', () => {
    const r = suggestFoods({ remaining: { kcal: 700, protein_g: 50 }, foods: library, limit: 4 });
    expect(r.suggestions).toHaveLength(4);
    const keys = r.suggestions.map((s) => s.parts.map((p) => p.foodId).sort().join('+'));
    expect(new Set(keys).size).toBe(4);
    const scores = r.suggestions.map((s) => s.score);
    expect([...scores].sort((a, b) => a - b)).toEqual(scores);
  });

  it('prefers foods usually eaten in the current slot', () => {
    const twins: SuggestibleFood[] = [
      { id: 'dinner_dish', kcal: 300, protein_g: 20, usual_slot: 'dinner' },
      { id: 'breakfast_dish', kcal: 300, protein_g: 20, usual_slot: 'breakfast' },
    ];
    const r = suggestFoods({ remaining: { kcal: 300, protein_g: 20 }, foods: twins, slot: 'breakfast', maxParts: 1 });
    expect(r.suggestions[0]!.parts[0]!.foodId).toBe('breakfast_dish');
  });

  it('maxParts 1 only returns single foods', () => {
    const r = suggestFoods({ remaining: { kcal: 520, protein_g: 42 }, foods: library, maxParts: 1, limit: 5 });
    expect(r.suggestions.every((s) => s.parts.length === 1)).toBe(true);
  });

  it('ignores protein when none is left', () => {
    const r = suggestFoods({ remaining: { kcal: 150, protein_g: -10 }, foods: library, maxParts: 1 });
    expect(r.suggestions[0]!.parts[0]!.foodId).toBe('coffee');
  });

  it('status codes for empty budget, empty library, and no fit', () => {
    expect(suggestFoods({ remaining: { kcal: 50, protein_g: 10 }, foods: library }).status).toBe('no_budget');
    expect(suggestFoods({ remaining: { kcal: -200, protein_g: 10 }, foods: library }).status).toBe('no_budget');
    expect(suggestFoods({ remaining: { kcal: 500, protein_g: 10 }, foods: [] }).status).toBe('no_foods');
    expect(suggestFoods({ remaining: { kcal: 500, protein_g: 10 }, foods: [{ id: 'water', kcal: 0 }] }).status).toBe('no_foods');
    expect(
      suggestFoods({ remaining: { kcal: 150, protein_g: 10 }, foods: [{ id: 'big', kcal: 400, protein_g: 30 }] }),
    ).toEqual({ status: 'no_match', suggestions: [] });
  });
});

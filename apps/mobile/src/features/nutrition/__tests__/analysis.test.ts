import {
  AnalyzeResponseSchema,
  barcodeNutrients,
  computeDraft,
  defaultAnswers,
  draftFromAnalysis,
  slotForTime,
} from '../analysis';

const zero = { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0, sugar_g: 0 };

const pho = {
  ai_request_id: 'req-1',
  analysis: {
    is_food: true,
    overall_confidence: 0.78,
    items: [
      {
        name: 'Pho bo',
        portion_text: '1 bowl',
        kcal: 480,
        protein_g: 28,
        carb_g: 62,
        fat_g: 12,
        sugar_g: 4,
        fiber_g: 2,
        sodium_mg: 1500,
        confidence: 0.8,
      },
    ],
    clarifying_questions: [
      {
        id: 'size',
        question: 'Bowl size?',
        item_index: null,
        options: [
          { label: 'S', is_default: false, adjustment: { kcal: -120, protein_g: -6, carb_g: -16, fat_g: -3, sugar_g: 0 } },
          { label: 'M', is_default: true, adjustment: zero },
          { label: 'L', is_default: false, adjustment: { kcal: 150, protein_g: 8, carb_g: 20, fat_g: 4, sugar_g: 1 } },
        ],
      },
      {
        id: 'quay',
        question: 'Fried dough?',
        item_index: 0,
        options: [
          { label: 'No', is_default: true, adjustment: zero },
          { label: 'Yes', is_default: false, adjustment: { kcal: 230, protein_g: 4, carb_g: 25, fat_g: 12, sugar_g: 1 } },
        ],
      },
    ],
    notes: null,
  },
  totals: {},
  low_confidence: false,
  quota: { used: 1, limit: 15 },
};

describe('analysis draft', () => {
  const parsed = AnalyzeResponseSchema.parse(pho);
  const draft = draftFromAnalysis(parsed, { source: 'photo', slot: 'dinner', photoPath: 'u/1.jpg' });

  it('maps the AI response to a draft with option ids and defaults', () => {
    expect(draft.items).toHaveLength(1);
    expect(draft.questions[0]?.labels.map((l) => l.kcalDelta)).toEqual([-120, 0, 150]);
    expect(defaultAnswers(draft.questions)).toEqual({ size: '1', quay: '0' });
    expect(draft.aiRequestId).toBe('req-1');
  });

  it('applies answers then the portion multiplier on device', () => {
    const base = computeDraft(draft, defaultAnswers(draft.questions));
    expect(base.totals.kcal).toBe(480);
    const big = computeDraft(draft, { size: '2', quay: '1' });
    expect(big.totals.kcal).toBe(480 + 150 + 230);
    expect(big.items[0]?.clarifications).toHaveLength(2);
    const half = computeDraft(draft, { size: '1', quay: '0' }, 0.5);
    expect(half.totals.kcal).toBe(240);
    expect(half.totals.protein_g).toBe(14);
  });

  it('rejects malformed responses', () => {
    expect(AnalyzeResponseSchema.safeParse({ analysis: { items: 'x' } }).success).toBe(false);
  });

  it('keeps at most three questions', () => {
    const q = pho.analysis.clarifying_questions[1]!;
    const many = AnalyzeResponseSchema.parse({
      ...pho,
      analysis: { ...pho.analysis, clarifying_questions: [0, 1, 2, 3].map((i) => ({ ...q, id: `q${i}` })) },
    });
    expect(draftFromAnalysis(many, { source: 'text', slot: 'lunch' }).questions).toHaveLength(3);
  });
});

describe('slotForTime', () => {
  it('maps clock times to meal slots', () => {
    expect(slotForTime(7 * 60)).toBe('breakfast');
    expect(slotForTime(12 * 60)).toBe('lunch');
    expect(slotForTime(15 * 60)).toBe('snack');
    expect(slotForTime(19 * 60 + 12)).toBe('dinner');
    expect(slotForTime(23 * 60)).toBe('snack');
  });
});

describe('barcodeNutrients', () => {
  it('scales per-100 g values to the portion', () => {
    const n = barcodeNutrients(
      {
        kcal_100g: 97,
        protein_g_100g: 10,
        carb_g_100g: 4,
        fat_g_100g: 4,
        sugar_g_100g: 4,
        fiber_g_100g: null,
        sodium_mg_100g: 40,
      },
      150,
    );
    expect(n.kcal).toBe(146);
    expect(n.protein_g).toBe(15);
    expect(n.fiber_g).toBe(0);
  });
});

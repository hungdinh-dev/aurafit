import {
  MAX_CLARIFYING_QUESTIONS,
  applyClarifications,
  clarificationsForItem,
  mainItemIndex,
  type ClarificationQuestion,
} from './clarifications';
import { scaleNutrients } from './nutrients';

// AI result for "Bún chả": main dish + herbs
const items = [
  { kcal: 50, protein_g: 1, carb_g: 8, fat_g: 1, sugar_g: 2, fiber_g: 3, sodium_mg: 300 },
  { kcal: 550, protein_g: 28, carb_g: 70, fat_g: 18, sugar_g: 10, fiber_g: 2, sodium_mg: 1600 },
];

const bowlSize: ClarificationQuestion = {
  id: 'bowl_size',
  options: [
    { id: 'small', delta: { kcal: -120, carb_g: -25 } },
    { id: 'medium', delta: {} },
    { id: 'large', delta: { kcal: 150, carb_g: 30, protein_g: 2 } },
  ],
  defaultOptionId: 'medium',
};
const quay: ClarificationQuestion = {
  id: 'extra_quay',
  options: [
    { id: 'no', delta: {} },
    { id: 'yes', delta: { kcal: 230, carb_g: 25, fat_g: 13 } },
  ],
};
const herbs: ClarificationQuestion = {
  id: 'herb_plate',
  itemIndex: 0,
  options: [
    { id: 'none', delta: { kcal: -50, carb_g: -8, protein_g: -1, fat_g: -1, sugar_g: -2, fiber_g: -3, sodium_mg: -300 } },
    { id: 'normal', delta: {} },
  ],
};

describe('mainItemIndex', () => {
  it('picks the highest-kcal item, first on ties, −1 when empty', () => {
    expect(mainItemIndex(items)).toBe(1);
    expect(mainItemIndex([{ kcal: 100 }, { kcal: 100 }])).toBe(0);
    expect(mainItemIndex([])).toBe(-1);
  });
});

describe('applyClarifications (NUT-03, on device)', () => {
  it('applies chosen deltas to the main item by default and to itemIndex when given', () => {
    const r = applyClarifications(items, [bowlSize, quay, herbs], {
      bowl_size: 'large',
      extra_quay: 'yes',
      herb_plate: 'none',
    });
    expect(r.issues).toEqual([]);
    expect(r.items[1]).toEqual({ kcal: 930, protein_g: 30, carb_g: 125, fat_g: 31, sugar_g: 10, fiber_g: 2, sodium_mg: 1600 });
    expect(r.items[0]).toEqual({ kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0, sugar_g: 0, fiber_g: 0, sodium_mg: 0 });
    expect(r.applied.map((a) => [a.questionId, a.optionId, a.itemIndex, a.isDefault])).toEqual([
      ['bowl_size', 'large', 1, false],
      ['extra_quay', 'yes', 1, false],
      ['herb_plate', 'none', 0, false],
    ]);
    expect(clarificationsForItem(r.applied, 1)).toHaveLength(2);
  });

  it('unanswered questions use the default option, or change nothing', () => {
    const r = applyClarifications(items, [bowlSize, quay], {});
    expect(r.items[1]!.kcal).toBe(550);
    expect(r.applied).toEqual([
      { questionId: 'bowl_size', optionId: 'medium', itemIndex: 1, delta: {}, isDefault: true },
    ]);
  });

  it('never makes a nutrient negative', () => {
    const r = applyClarifications([{ kcal: 80, carb_g: 10 }], [bowlSize], { bowl_size: 'small' });
    expect(r.items[0]).toMatchObject({ kcal: 0, carb_g: 0 });
  });

  it('uses at most 3 questions and reports the rest', () => {
    const extra: ClarificationQuestion = { id: 'q4', options: [{ id: 'a', delta: { kcal: 999 } }] };
    const r = applyClarifications(items, [bowlSize, quay, herbs, extra], { q4: 'a' });
    expect(MAX_CLARIFYING_QUESTIONS).toBe(3);
    expect(r.items[1]!.kcal).toBe(550);
    expect(r.issues).toEqual([{ code: 'question_over_limit', questionId: 'q4' }]);
  });

  it('reports unknown question / option ids and invalid item indexes', () => {
    const badIndex: ClarificationQuestion = { ...quay, id: 'bad_index', itemIndex: 7 };
    const r = applyClarifications(items, [bowlSize, badIndex], {
      bowl_size: 'gigantic',
      bad_index: 'yes',
      nope: 'x',
    });
    expect(r.issues).toEqual(
      expect.arrayContaining([
        { code: 'unknown_question', questionId: 'nope' },
        { code: 'unknown_option', questionId: 'bowl_size' },
        { code: 'invalid_item_index', questionId: 'bad_index' },
      ]),
    );
    expect(r.items[1]!.kcal).toBe(780); // invalid index falls back to the main item
  });

  it('reports no_items when there is nothing to adjust', () => {
    const r = applyClarifications([], [quay], { extra_quay: 'yes' });
    expect(r.items).toEqual([]);
    expect(r.issues).toEqual([{ code: 'no_items', questionId: 'extra_quay' }]);
  });

  it('portion scaling happens after the answers', () => {
    const r = applyClarifications(items, [bowlSize], { bowl_size: 'large' });
    expect(scaleNutrients(r.items[1]!, 0.5).kcal).toBe(350);
  });

  it('does not mutate the input', () => {
    const copy = JSON.parse(JSON.stringify(items));
    applyClarifications(items, [bowlSize], { bowl_size: 'large' });
    expect(items).toEqual(copy);
  });
});

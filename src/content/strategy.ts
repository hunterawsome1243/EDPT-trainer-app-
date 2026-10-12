import type { LessonSection } from './lessons/types'
import { EXAM, SECONDS_PER_QUESTION } from './reference'

const spq = Math.round(SECONDS_PER_QUESTION)

/** The guide adapts its guessing advice to the scoring model the user selected in Settings. */
export function strategySections(guessingPenalty: boolean = EXAM.guessingPenalty): LessonSection[] {
  return [
    {
      heading: 'The pacing plan',
      paragraphs: [
        `With about ${EXAM.questionCount} items in ${EXAM.timeLimitMinutes} minutes you have roughly ${spq} seconds per item. Nobody solves every item in ${spq} seconds; the plan is to bank the easy ones fast so the hard ones get the time they need.`,
        'Set checkpoints: at one quarter of the time you should be a quarter of the way through, and so on. If you fall behind a checkpoint, skip more aggressively until you catch up. Spending three minutes on one item costs you four or five easier items later.',
      ],
      bullets: ['Checkpoint every 15 minutes', 'Easy item: under 30 seconds', 'Normal item: about 45 seconds', 'Hard item: 90 seconds, then guess and move on'],
    },
    {
      heading: 'When to skip',
      paragraphs: [
        'Skip the moment you realise you have no rule after one full pass of your routine. Mark it, choose a provisional answer if the test does not allow returning, and move on. Come back only after the last item if time remains. The practice modes here train the reflex of leaving an item without regret.',
      ],
    },
    {
      heading: 'Elimination',
      paragraphs: [
        'Distractors are built from predictable mistakes: the wrong direction, one step too many, the intermediate value, the reversed ratio. When you cannot find the rule, you can often still remove two options because they are obviously those mistakes, and a guess from three is worth taking.',
      ],
    },
    {
      heading: 'Guessing',
      paragraphs: [
        guessingPenalty
          ? 'The scoring model selected in Settings subtracts a fraction for wrong answers. Guess only when you can eliminate at least one option; leave an item blank when every option looks equally likely.'
          : 'Under the scoring model selected in Settings there is no penalty for wrong answers, so never leave an item blank. If time is nearly up, fill in every remaining item with the same letter. You can change the scoring model in Settings; this advice updates with it.',
        'Whatever the real policy turns out to be, confirm it on test day from the instructions you are given.',
      ],
    },
    {
      heading: 'Mental-math shortcuts',
      paragraphs: ['A calculator is not allowed. These shortcuts cover most of what the arithmetic items need.'],
      bullets: [
        'Percent: build from 10%, 5% and 1%.',
        'Multiply by 5: multiply by 10 and halve. Multiply by 25: multiply by 100 and quarter.',
        'Multiply by 11: add the digits between them (23 × 11 = 253).',
        'Squares near 50: 52² = 2500 + 2×2×50 + 4 = 2704.',
        'Divide by 4: halve twice. Divide by 8: halve three times.',
        'Fractions to know: 1/8 = 12.5%, 1/6 ≈ 16.7%, 1/3 ≈ 33.3%, 3/8 = 37.5%, 5/8 = 62.5%.',
      ],
    },
    {
      heading: 'Reading figures quickly',
      paragraphs: ['Run the attribute list (shape, count, rotation, fill, size, position) in the same order every time so nothing is missed. Say each change as a short phrase. Eliminate any option that violates even one rule.'],
    },
    {
      heading: 'Test-day logistics',
      paragraphs: [
        'Sleep the night before matters more than a last hour of study. Arrive early with your ID. Scratch paper is normally provided; use it for differences and alphabet positions instead of holding them in your head. Write the alphabet with positions at the top of your scratch paper before the first letter item.',
        'During the test, breathe out slowly when you notice your pace rising; a calm 45 seconds beats a frantic 30.',
      ],
    },
    {
      heading: 'The week before',
      paragraphs: ['Taper. Take your last full simulation three or four days out, spend the remaining days on spaced review of missed rules and short mental-math drills, and do nothing heavy the day before.'],
    },
  ]
}

export const STRATEGY_TITLE = 'Test strategy'

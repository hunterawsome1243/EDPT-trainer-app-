import type { Lesson } from './types'

export const arithmeticLesson: Lesson = {
  type: 'arithmetic',
  title: 'Arithmetic reasoning',
  intro:
    'Word problems on the EDPT are not hard mathematics. They test whether you can translate a sentence into one or two operations and carry them out without a calculator in well under a minute. Speed comes from recognising the problem type instantly and from mental-math shortcuts, not from cleverness.',
  sections: [
    {
      heading: 'Translate, then compute',
      paragraphs: [
        'Read the last sentence first: it tells you what the answer is (a price, a time, a count). Then pull the numbers from the body and write the one-line expression before doing any arithmetic. "of" means multiply, "per" means divide, "more than" means add, "fewer than" means subtract from the other quantity.',
      ],
    },
    {
      heading: 'Percentages without a calculator',
      paragraphs: [
        'Build any percentage from 10%, 5% and 1%. 10% of 240 is 24, so 5% is 12 and 1% is 2.4; 35% is 24 + 24 + 24 + 12 = 84. For increases multiply by 1.xx; for decreases multiply by 0.xx. Successive percentages multiply: 20% off then 10% tax is × 0.8 × 1.1, not −10%.',
      ],
    },
    {
      heading: 'Ratios and averages are "parts" problems',
      paragraphs: [
        'A ratio of 3:5 means 8 parts. Divide the total by 8 to get one part, then multiply. An average times the count gives the total; work with totals when a value is missing. Consecutive integers are symmetric around their average, so divide the sum by the count to find the middle one.',
      ],
    },
    {
      heading: 'Rates',
      paragraphs: [
        'Distance = rate × time. Cover the quantity you want and the triangle gives the formula. For two people working together, add their rates (jobs per hour), never their times. Shortcut: if alone they take a and b hours, together they take ab ÷ (a + b).',
      ],
    },
    {
      heading: 'Conversions and time',
      paragraphs: ['Know the factors cold: 60 (minutes, seconds), 12 (inches), 3 (feet in a yard), 24 (hours), 100 (cm), 1024 (KB, MB, GB). For elapsed time, add hours first, then minutes, carrying 60 into the hour and switching a.m./p.m. at 12.'],
    },
  ],
  examples: [
    { stem: 'A $120 item is 25% off, then 10% tax is added. Final price?', steps: ['25% off → × 0.75 = 90.', '10% tax → × 1.1 = 99.', 'Not 120 × 0.85 = 102; the tax applies to the reduced price.'], answer: '$99' },
    { stem: 'Two pumps fill a tank alone in 6 and 3 hours. Together?', steps: ['Rates: 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2 tank per hour.', 'Time = 2 hours. Shortcut: 6×3 ÷ (6+3) = 18/9 = 2.'], answer: '2 hours' },
    { stem: 'The average of five scores is 80. Four are 75, 82, 90, 70. The fifth?', steps: ['Total needed: 80 × 5 = 400.', 'Known: 75 + 82 + 90 + 70 = 317.', '400 − 317 = 83.'], answer: '83' },
  ],
  checklist: [
    'Read the question sentence first; name the unit of the answer.',
    'Write the expression before computing.',
    'Percent: build from 10% / 5% / 1%.',
    'Ratio or average: find one part or the total first.',
    'Rate: D = R × T; work problems add rates.',
    'Estimate first; if the options are far apart, estimation alone picks the answer.',
  ],
  traps: [
    'Answering the intermediate value (the discount, the change, the part) instead of what was asked.',
    'Averaging two times in a work problem.',
    '"A has 5 fewer than B" set up backward.',
    'Carrying 100 minutes into an hour instead of 60.',
    'Applying two percentages by adding them.',
  ],
  rules: [
    { id: 'percent-of', summary: 'Percent of a quantity.' },
    { id: 'percent-change', summary: 'Increase or decrease by a percent.' },
    { id: 'ratio-share', summary: 'Split a total in a ratio.' },
    { id: 'average', summary: 'Find an average or a missing value from one.' },
    { id: 'rate-distance', summary: 'Speed, distance and time.' },
    { id: 'work-rate', summary: 'Two workers together.' },
    { id: 'unit-conversion', summary: 'Minutes, inches, feet, hours, KB/MB.' },
    { id: 'solve-x', summary: 'One-step or two-step linear equations.' },
    { id: 'age', summary: 'Ages now and in the future.' },
    { id: 'discount', summary: 'Sale price with discount and tax.' },
    { id: 'fraction-of', summary: 'Fraction of a quantity and the remainder.' },
    { id: 'consecutive', summary: 'Sums of consecutive integers.' },
    { id: 'time-elapsed', summary: 'Clock arithmetic.' },
    { id: 'simplify-ratio', summary: 'Reduce a ratio to lowest terms.' },
  ],
}

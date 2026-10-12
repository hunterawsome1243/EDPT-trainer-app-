import type { Lesson } from './types'

export const numberSequenceLesson: Lesson = {
  type: 'number-sequence',
  title: 'Number sequences',
  intro:
    'Number-series items give you five to seven numbers and ask for the next one or a missing one. They are the fastest points on the test once you have a routine, because almost every series is built from a short list of rules. Your job is to run that list quickly and stop as soon as one fits.',
  sections: [
    {
      heading: 'The differences routine',
      paragraphs: [
        'Write the gap between each pair of neighbours under the series. Most questions are solved right there: if the gaps are all the same, add it once more; if the gaps are themselves a simple series (growing by 1, growing by 2, doubling), continue that series and add.',
        'If the first differences look random, take the differences of the differences. A constant second difference means a quadratic rule such as squares, triangular numbers, or a growing step.',
      ],
    },
    {
      heading: 'When gaps make no sense',
      paragraphs: [
        'Two patterns are woven together more often than you would think. Read every other term: positions 1, 3, 5 form one series and positions 2, 4, 6 form another. Each is usually trivial on its own.',
        'If terms grow very fast, stop subtracting and start dividing. A constant quotient means multiply again. If dividing gives nearly-constant quotients with a small leftover, the rule is "multiply, then add a constant".',
      ],
    },
    {
      heading: 'Number families to recognise on sight',
      paragraphs: ['A handful of famous sequences appear often enough to be worth memorising. Recognising them saves the whole routine.'],
      bullets: [
        'Squares: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400',
        'Cubes: 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000',
        'Primes: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97',
        'Triangular: 1, 3, 6, 10, 15, 21, 28, 36, 45, 55 (differences go up by 1)',
        'Fibonacci-style: each term is the sum of the previous two (the starting pair can be anything)',
        'Powers of 2: 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024',
      ],
    },
    {
      heading: 'Blank in the middle',
      paragraphs: [
        'Harder items hide a middle term. Find the rule from the terms on either side of the blank, then check it against the far ends. Working from both directions catches a wrong rule immediately.',
      ],
    },
  ],
  examples: [
    { stem: '3, 7, 15, 31, 63, __', steps: ['Differences: 4, 8, 16, 32. They double.', 'Next difference is 64, so 63 + 64 = 127.', 'Check with the multiply-add rule: each term is 2× the previous + 1. 2×63 + 1 = 127. Both agree.'], answer: '127' },
    { stem: '2, 9, 4, 11, 6, 13, __', steps: ['Gaps zig-zag: +7, −5, +7, −5, +7, so the next move is −5.', 'Or read alternate terms: 2, 4, 6, … and 9, 11, 13, … The next term belongs to the first series: 8.'], answer: '8' },
    { stem: '5, 8, 13, 20, 29, __', steps: ['Differences: 3, 5, 7, 9. They grow by 2.', 'Next difference is 11, so 29 + 11 = 40.', 'Notice each term is n² + 4 (1+4, 4+4, 9+4, …), another way to see it.'], answer: '40' },
  ],
  checklist: [
    'Write the first differences.',
    'Constant? Add it. Growing steadily? Continue the growth.',
    'Random-looking? Try every other term, then try dividing.',
    'Large numbers? Check squares, cubes, powers of 2, and "multiply then add".',
    'Odd numbers only with no clear gaps? Suspect primes.',
    'Verify the rule against every term before answering.',
  ],
  traps: [
    'Stopping one term early or late when the blank is in the middle.',
    'Picking the option equal to the last difference instead of the next term.',
    'Treating a geometric series as arithmetic and choosing a number that is far too small.',
    'Picking the next odd number in a prime series (9, 15, 21, 25, 27 are not prime).',
  ],
  rules: [
    { id: 'arithmetic', summary: 'Constant difference between terms.' },
    { id: 'geometric', summary: 'Constant ratio between terms.' },
    { id: 'increasing-step', summary: 'Differences grow by a fixed amount.' },
    { id: 'squares', summary: 'Perfect squares or cubes, possibly shifted by a constant.' },
    { id: 'fibonacci', summary: 'Each term is the sum of the previous two.' },
    { id: 'alternating-ops', summary: 'Two operations alternate (for example +7, −4).' },
    { id: 'interleaved', summary: 'Two independent series woven together.' },
    { id: 'multiply-add', summary: 'Previous term × m, then + k.' },
    { id: 'primes', summary: 'Consecutive primes, or every second prime.' },
    { id: 'position-rule', summary: 'Term depends on its position n, e.g. n(n+1).' },
    { id: 'digit-rule', summary: 'Previous term plus the sum (or product) of its digits.' },
    { id: 'triangular', summary: 'Triangular numbers; differences increase by 1.' },
  ],
}

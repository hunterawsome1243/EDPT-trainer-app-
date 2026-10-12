import type { Lesson } from './types'

export const letterSequenceLesson: Lesson = {
  type: 'letter-sequence',
  title: 'Letter sequences',
  intro:
    'Letter series are number series in disguise. Convert each letter to its position (A=1 … Z=26), and every trick from the number-sequence module applies. The only new ideas are wraparound (after Z comes A) and the fact that a term can contain several letters that follow separate rules.',
  sections: [
    {
      heading: 'Know the alphabet positions cold',
      paragraphs: [
        'Counting on your fingers costs ten seconds per item. Memorise a few anchors and count from the nearest one: A=1, E=5, J=10, O=15, T=20, Z=26. Also know the pairs that add to 27 (A–Z, B–Y, C–X, D–W, E–V, M–N) because mirror patterns use them.',
      ],
      bullets: ['A1 B2 C3 D4 E5 F6 G7 H8 I9 J10 K11 L12 M13', 'N14 O15 P16 Q17 R18 S19 T20 U21 V22 W23 X24 Y25 Z26'],
    },
    {
      heading: 'Single letters',
      paragraphs: [
        'Write the gap between neighbours. A constant gap, a growing gap, or a gap that zig-zags (forward then back) covers most items. When the gaps look random, read every other letter.',
        'Backward series read like countdowns (Y, V, S, P). When a series crosses Z or A, keep counting as if the alphabet were a circle: after Z comes A, before A comes Z.',
      ],
    },
    {
      heading: 'Groups of letters',
      paragraphs: [
        'When each term has two or three letters, treat each position as its own series. In AB, DE, GH the first letters go A, D, G (+3) and the second letters go B, E, H (+3). In AZ, BY, CX the first letters go forward while the second letters go backward.',
        'Some groups also change length: A, BB, CCC, DDDD adds one repeat per term. Count the letters as well as reading them.',
      ],
    },
    {
      heading: 'Mixed letters and numbers',
      paragraphs: ['Terms like C3, F5, I7 are two series side by side. Solve the letter rule and the number rule separately, then combine.'],
    },
  ],
  examples: [
    { stem: 'B, E, H, K, __', steps: ['Positions 2, 5, 8, 11: constant gap of 3.', '11 + 3 = 14, which is N.'], answer: 'N' },
    { stem: 'Z, X, U, Q, __', steps: ['Positions 26, 24, 21, 17: gaps −2, −3, −4.', 'Next gap is −5: 17 − 5 = 12, which is L.'], answer: 'L' },
    { stem: 'AZ, CX, EV, __', steps: ['First letters A, C, E: +2 each, so G next.', 'Second letters Z, X, V: −2 each, so T next.', 'Combine: GT.'], answer: 'GT' },
  ],
  checklist: [
    'Convert to numbers using the anchors A1 E5 J10 O15 T20 Z26.',
    'Single letters: write gaps, then apply the number-series routine.',
    'Multi-letter terms: one series per position.',
    'Watch for wraparound past Z or before A.',
    'Look for the famous sets: vowels A E I O U, mirror pairs that sum to 27.',
  ],
  traps: [
    'Off-by-one errors from counting the starting letter as a step.',
    'Mixing up "3 letters after" (skip 2) with "3 places forward".',
    'Choosing the right letter with the wrong number of repeats.',
    'Forgetting that the series may run backward.',
  ],
  rules: [
    { id: 'constant-skip', summary: 'Same forward step every time.' },
    { id: 'backward', summary: 'Same backward step every time.' },
    { id: 'growing-skip', summary: 'Step increases by a fixed amount.' },
    { id: 'alternating-direction', summary: 'Forward by one amount, back by another.' },
    { id: 'interleaved', summary: 'Two series woven together.' },
    { id: 'pairs', summary: 'Two-letter terms; each position has its own rule (including mirror pairs).' },
    { id: 'triplets', summary: 'Three-letter groups that shift as a block.' },
    { id: 'vowel-consonant', summary: 'The vowel set A E I O U.' },
    { id: 'repeat-count', summary: 'Letter repeated one more time each term.' },
    { id: 'number-letter', summary: 'Letter rule plus number rule side by side.' },
    { id: 'position-shift', summary: 'Steps repeat in a short cycle.' },
  ],
}

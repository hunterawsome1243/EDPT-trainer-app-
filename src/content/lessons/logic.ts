import type { Lesson } from './types'

export const logicLesson: Lesson = {
  type: 'logic',
  title: 'Logical reasoning',
  intro:
    'Logic items give you a few statements and ask what must follow. The trap is that a conclusion can sound reasonable without being forced by the premises. On this test "must be true" means true in every situation that fits the statements, and "cannot be determined" is a real and frequent answer. Learn the small number of valid moves and treat everything else as unproven.',
  sections: [
    {
      heading: 'Draw it',
      paragraphs: [
        '"All A are B" is a small circle inside a big one. "No A are B" is two circles apart. "Some A are B" is two circles overlapping. Draw the premises, then read each option off the picture. If you can draw a picture that fits the premises but makes the option false, the option is not forced.',
      ],
    },
    {
      heading: 'If-then: only two valid moves',
      paragraphs: [
        'From "if P then Q": knowing P gives Q (modus ponens); knowing not-Q gives not-P (modus tollens). Knowing Q tells you nothing about P, and knowing not-P tells you nothing about Q. The statement equivalent to "if P then Q" is its contrapositive "if not Q then not P", never the converse "if Q then P" or the inverse "if not P then not Q".',
      ],
    },
    {
      heading: 'Negations',
      paragraphs: [
        'The opposite of "all are" is "at least one is not", not "none are". The opposite of "none are" is "at least one is". The opposite of "some are" is "none are". The test likes to offer the dramatic opposite as a distractor.',
      ],
    },
    {
      heading: 'Ordering, seating and scheduling',
      paragraphs: [
        'Draw a line or a row of boxes. Start with the clue that fixes an absolute position ("far left", "on Wednesday"), then place everyone else relative to it. Translate "shorter than" and "fewer than" carefully: "A has 5 fewer than B" means B = A + 5. For who-has-what puzzles, draw a grid and cross out impossibilities; a row with one blank left is solved, and that solution eliminates its column for everyone else.',
      ],
    },
    {
      heading: 'Overlapping groups',
      paragraphs: ['Two overlapping circles have four regions: only A, both, only B, neither. Fill "both" first. At least one = A + B − both. Neither = total − (A + B − both).'],
    },
  ],
  examples: [
    { stem: 'All medics are early risers. Some pilots are medics. What must be true?', steps: ['Draw medics inside early risers. Some of the pilots circle overlaps medics.', 'Those pilots are inside early risers, so "some pilots are early risers" is forced.', '"All pilots are early risers" is not forced: the rest of the pilots circle may lie outside.'], answer: 'Some pilots are early risers.' },
    { stem: 'If the alarm sounds, the doors lock. The doors are locked. What follows?', steps: ['This is "Q is true". The rule only runs from P to Q.', 'Doors could be locked for another reason.'], answer: 'Cannot be determined' },
    { stem: '30 airmen: 18 run, 14 lift, 7 do both. How many do neither?', steps: ['At least one = 18 + 14 − 7 = 25.', 'Neither = 30 − 25 = 5.'], answer: '5' },
  ],
  checklist: [
    'Circles for all / no / some; read options off the picture.',
    'If-then: P ⇒ Q and ¬Q ⇒ ¬P only; everything else is undetermined.',
    'Equivalent statement = contrapositive.',
    'Negation of "all" is "at least one is not".',
    'Ordering: anchor first, then chain; grids for matching puzzles.',
    'Overlaps: fill "both" first, subtract it once.',
  ],
  traps: [
    'Reversing an "all" statement.',
    'Treating two "some" statements as about the same people.',
    'Affirming the consequent ("Q, therefore P").',
    'Choosing "none" as the opposite of "all".',
    'Double counting the overlap of two groups.',
  ],
  rules: [
    { id: 'syllogism', summary: 'All / some / no chains.' },
    { id: 'conditional', summary: 'Valid and invalid if-then inferences.' },
    { id: 'ordering', summary: 'Chains of comparisons.' },
    { id: 'seating', summary: 'Positions in a row.' },
    { id: 'sets', summary: 'Two overlapping groups.' },
    { id: 'must-be-true', summary: 'Must, could, or cannot.' },
    { id: 'contrapositive', summary: 'Equivalent conditional statements.' },
    { id: 'schedule', summary: 'Days and relative order.' },
    { id: 'matching', summary: 'Who has which item.' },
    { id: 'numeric-chain', summary: 'More than / fewer than chains.' },
    { id: 'negation', summary: 'Exact negation of a quantified statement.' },
  ],
}

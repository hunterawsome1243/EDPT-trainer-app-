import type { Lesson } from './types'

export const figureLesson: Lesson = {
  type: 'figure',
  title: 'Figure patterns and analogies',
  intro:
    'Figure items show a row of pictures and ask what comes next, or show "A is to B as C is to ?", or ask which picture does not belong. The pictures are simple on purpose. Everything that can change is on a short list, and the test combines two or three of those changes at once. Your job is to name each change in words.',
  sections: [
    {
      heading: 'The attribute list',
      paragraphs: ['Every figure has a handful of attributes. Check each one across the row. Most items change one or two of them; hard items change three.'],
      bullets: [
        'Shape: circle, square, triangle, and so on; sometimes cycling through a fixed order',
        'Count: how many elements are in the cell',
        'Rotation: which way an arrow, triangle or line points',
        'Fill: empty, solid, hatched, dotted; often a repeating cycle',
        'Size: growing or shrinking',
        'Position: an element moving around the corners of the cell',
        'Reflection: a mirror image rather than a rotation',
      ],
    },
    {
      heading: 'Sequences',
      paragraphs: [
        'Say the row aloud: "arrow up, arrow right, arrow down, …" or "one dot, two dots, three dots". If one attribute is constant, ignore it. If an attribute changes, state the rule and apply it once more. Then check every other attribute: a second rule may be running underneath.',
      ],
    },
    {
      heading: 'Analogies',
      paragraphs: [
        'Describe what happened from A to B in a sentence: "it rotated a quarter turn clockwise and filled in". Then do exactly that to C. Do not be distracted by options that look like A or B; the answer should look like C with the change applied.',
      ],
    },
    {
      heading: 'Odd one out',
      paragraphs: [
        'Find the attribute that four of the five figures share. The one that breaks it is the answer. If every figure has a different shape, shape cannot be the deciding attribute; move on to fill, count or rotation.',
      ],
    },
    {
      heading: 'Rotation versus reflection',
      paragraphs: [
        'A rotation turns the figure like a clock hand; a reflection flips it like a page. An arrow pointing up-right becomes down-right under a horizontal-axis flip but up-left under a vertical-axis flip. If a row alternates between two images, suspect a flip. If it marches through four or eight directions, suspect rotation.',
      ],
    },
  ],
  examples: [
    { stem: 'Arrow pointing up, then right, then down. Next?', steps: ['Each cell rotates 90° clockwise.', 'Down rotated 90° clockwise is left.'], answer: 'Arrow pointing left' },
    { stem: 'A: empty square. B: solid square, smaller. C: empty triangle. D = ?', steps: ['From A to B: fill becomes solid and the size shrinks.', 'Apply to C: a solid, smaller triangle.'], answer: 'Small solid triangle' },
    { stem: 'Row: 1 dot, 2 dots, 3 dots, each with an arrow turning 45°. Next?', steps: ['Two rules: count +1 and rotation +45°.', 'Next cell has 4 dots and the arrow turned one more step.'], answer: '4 dots, arrow rotated once more' },
  ],
  checklist: [
    'Run the attribute list: shape, count, rotation, fill, size, position.',
    'Ignore what stays constant; state each change as a rule.',
    'Apply every rule once more; eliminate options that break any one rule.',
    'Analogy: describe A→B in words, apply to C.',
    'Odd one out: what do four of five share?',
  ],
  traps: [
    'Applying only one of two rules.',
    'Rotating the wrong direction.',
    'Confusing a reflection with a rotation.',
    'Choosing a figure that resembles A instead of the transformed C.',
    'Miscounting elements in a crowded cell.',
  ],
  rules: [
    { id: 'rotation', summary: 'Figure turns by a fixed angle each cell.' },
    { id: 'count', summary: 'Number of elements grows by a fixed amount.' },
    { id: 'fill-cycle', summary: 'Shading repeats in a cycle.' },
    { id: 'shape-cycle', summary: 'Shapes repeat in a cycle.' },
    { id: 'size-change', summary: 'Steady growth or shrinkage.' },
    { id: 'add-element', summary: 'One new element added in a fixed order of positions.' },
    { id: 'flip', summary: 'Alternating mirror images.' },
    { id: 'orbit', summary: 'An element moves around the corners.' },
    { id: 'two-rules', summary: 'Rotation and count change together.' },
    { id: 'analogy-rotate', summary: 'A→B is a rotation; apply to C.' },
    { id: 'analogy-fill-size', summary: 'A→B changes fill and/or size.' },
    { id: 'analogy-count', summary: 'A→B adds or removes elements.' },
    { id: 'odd-one-out', summary: 'Four share a property; one does not.' },
  ],
}

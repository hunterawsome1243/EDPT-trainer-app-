import type { Lesson } from './types'

export const verbalLesson: Lesson = {
  type: 'verbal',
  title: 'Reading and verbal reasoning',
  intro:
    'Verbal items come in two forms: word relationships (analogies, meanings, odd word out) and short passages with questions. Neither rewards a huge vocabulary. They reward naming the relationship precisely and reading the passage for its structure rather than its details.',
  sections: [
    {
      heading: 'Analogies: make a sentence',
      paragraphs: [
        'Turn the first pair into a sentence that states the relationship exactly: "a wheel is a part of a car", "a knife is used to cut", "hot is the opposite of cold", "damp is a milder form of soaked". Then plug the third word into the same sentence and see which option completes it. Keep the direction: part : whole is not whole : part.',
      ],
      bullets: ['Synonym and antonym', 'Part to whole', 'Member to category', 'Tool to its use', 'Worker to workplace or tool', 'Degree (mild to intense)'],
    },
    {
      heading: 'Word meaning and odd word out',
      paragraphs: [
        'For a meaning question, recall a sentence you have heard the word in and test each option there. Watch prefixes: in-, un-, dis- usually negate; re- repeats; pre- comes before. For odd-one-out, find the category that fits all but one; the unfamiliar word is not automatically the odd one.',
      ],
    },
    {
      heading: 'Passages: read for structure',
      paragraphs: [
        'Read the first and last sentences first; they usually frame the point. Then read the middle once, noting where numbers, names and causes appear. Main-idea questions want the claim every sentence supports, not a detail. Detail questions have the answer in the text; find the sentence and match it exactly. Inference questions want the option the passage supports without saying outright. Eliminate anything that goes beyond the text.',
      ],
    },
    {
      heading: 'Time management',
      paragraphs: ['A passage with three or four questions is a bargain: one reading pays for several answers. Do not skip passages to save time; skip single items you cannot crack instead.'],
    },
  ],
  examples: [
    { stem: 'pen : write :: ruler : ?', steps: ['Sentence: a pen is used to write.', 'A ruler is used to measure.'], answer: 'measure' },
    { stem: 'MITIGATE', steps: ['"Mitigate the risk" means reduce it.', 'Closest meaning: make less severe.'], answer: 'make less severe' },
    { stem: 'Passage says a team skipped labelling once and later spent days tracing outages. What is implied?', steps: ['The passage links skipping the step to the later cost.', 'Inference: skipping verification caused problems that were hard to diagnose.'], answer: 'Skipping verification led to hard-to-trace problems.' },
  ],
  checklist: [
    'Analogy: say the relationship as a sentence; keep the direction.',
    'Meaning: test options in a sentence you know; check prefixes.',
    'Odd word out: find the category three share.',
    'Passage: first and last sentence first; scan for the keyword in each question.',
    'Inference: reject options that add information not in the text.',
  ],
  traps: [
    'Choosing a word that is related but with the wrong relationship (a synonym where an antonym is needed).',
    'Reversing direction in part-whole analogies.',
    'Choosing a true detail as the main idea.',
    'Choosing a number from the passage that answers a different question.',
  ],
  rules: [
    { id: 'synonym', summary: 'Words with the same meaning.' },
    { id: 'antonym', summary: 'Opposites.' },
    { id: 'part-whole', summary: 'A part and the thing it belongs to.' },
    { id: 'category', summary: 'A member and its category.' },
    { id: 'function', summary: 'A tool and what it does.' },
    { id: 'degree', summary: 'Mild to intense.' },
    { id: 'worker-tool', summary: 'A worker and their tool or place.' },
    { id: 'vocabulary', summary: 'Pick the closest meaning.' },
    { id: 'odd-word', summary: 'Which word does not belong.' },
    { id: 'passage-main', summary: 'Main idea of a passage.' },
    { id: 'passage-detail', summary: 'A fact stated in the passage.' },
    { id: 'passage-inference', summary: 'What the passage implies.' },
  ],
}

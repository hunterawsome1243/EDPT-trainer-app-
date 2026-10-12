import type { Difficulty, RuleFamily } from '../types'
import { makeGenerator, sample, uniqueDistractors } from './common'

/*
 * Reading comprehension and verbal analogy families. Word relationships are
 * drawn from curated lists; passages are templates with randomised facts so
 * the same template yields different detail questions.
 */

type Pair = [string, string]

const SYN: Pair[] = [['big', 'large'], ['quick', 'fast'], ['begin', 'start'], ['happy', 'glad'], ['error', 'mistake'], ['silent', 'quiet'], ['brave', 'courageous'], ['ancient', 'old'], ['precise', 'exact'], ['vacant', 'empty'], ['rapid', 'swift'], ['assist', 'help'], ['sturdy', 'strong'], ['conceal', 'hide'], ['enormous', 'huge'], ['tidy', 'neat']]
const ANT: Pair[] = [['hot', 'cold'], ['up', 'down'], ['expand', 'contract'], ['accept', 'reject'], ['victory', 'defeat'], ['generous', 'stingy'], ['ancient', 'modern'], ['scarce', 'plentiful'], ['rigid', 'flexible'], ['arrive', 'depart'], ['include', 'exclude'], ['visible', 'hidden'], ['brief', 'lengthy'], ['humble', 'arrogant'], ['increase', 'decrease'], ['cautious', 'reckless']]
const PART: Pair[] = [['wheel', 'car'], ['page', 'book'], ['petal', 'flower'], ['key', 'keyboard'], ['branch', 'tree'], ['finger', 'hand'], ['wing', 'airplane'], ['chapter', 'novel'], ['lens', 'camera'], ['blade', 'fan'], ['sleeve', 'jacket'], ['pixel', 'screen'], ['note', 'melody'], ['brick', 'wall']]
const CAT: Pair[] = [['oak', 'tree'], ['hammer', 'tool'], ['sparrow', 'bird'], ['trout', 'fish'], ['copper', 'metal'], ['violin', 'instrument'], ['sonnet', 'poem'], ['python', 'language'], ['tulip', 'flower'], ['beagle', 'dog'], ['Mars', 'planet'], ['oxygen', 'gas'], ['carrot', 'vegetable'], ['sedan', 'car']]
const FUNC: Pair[] = [['knife', 'cut'], ['pen', 'write'], ['scissors', 'snip'], ['lamp', 'illuminate'], ['oven', 'bake'], ['ruler', 'measure'], ['key', 'unlock'], ['broom', 'sweep'], ['needle', 'sew'], ['shovel', 'dig'], ['telescope', 'observe'], ['compass', 'navigate'], ['filter', 'purify'], ['anchor', 'hold']]
const DEG: Pair[] = [['warm', 'hot'], ['cool', 'cold'], ['damp', 'soaked'], ['annoyed', 'furious'], ['glance', 'stare'], ['walk', 'sprint'], ['drizzle', 'downpour'], ['whisper', 'shout'], ['hill', 'mountain'], ['pond', 'ocean'], ['breeze', 'gale'], ['dislike', 'loathe'], ['tired', 'exhausted'], ['smile', 'grin']]
const WORKER: Pair[] = [['pilot', 'aircraft'], ['surgeon', 'scalpel'], ['chef', 'kitchen'], ['author', 'manuscript'], ['farmer', 'tractor'], ['sculptor', 'chisel'], ['teacher', 'classroom'], ['sailor', 'ship'], ['programmer', 'compiler'], ['carpenter', 'saw'], ['judge', 'courtroom'], ['miner', 'pickaxe']]

const VOCAB: [string, string, string[]][] = [
  ['meticulous', 'extremely careful about details', ['careless', 'quick', 'generous']],
  ['redundant', 'no longer needed or duplicated', ['essential', 'urgent', 'loud']],
  ['concise', 'brief and to the point', ['lengthy', 'confusing', 'formal']],
  ['volatile', 'likely to change suddenly', ['stable', 'quiet', 'expensive']],
  ['ambiguous', 'open to more than one meaning', ['clear', 'short', 'ancient']],
  ['verify', 'confirm that something is true', ['invent', 'ignore', 'delay']],
  ['mitigate', 'make less severe', ['worsen', 'announce', 'measure']],
  ['scrutinize', 'examine closely', ['skim', 'praise', 'forget']],
  ['feasible', 'possible to do', ['forbidden', 'imaginary', 'tedious']],
  ['adjacent', 'next to', ['distant', 'above', 'identical']],
  ['deduce', 'reach a conclusion by reasoning', ['guess wildly', 'describe', 'deny']],
  ['imminent', 'about to happen', ['long past', 'unlikely', 'optional']],
  ['tedious', 'long and boring', ['exciting', 'rapid', 'simple']],
  ['anomaly', 'something that deviates from what is normal', ['routine', 'summary', 'repair']],
  ['prudent', 'showing care for the future', ['reckless', 'cheerful', 'wealthy']],
  ['obsolete', 'out of date', ['current', 'fragile', 'secret']],
]

const ODD_SETS: [string[], string, string][] = [
  [['apple', 'pear', 'plum', 'carrot'], 'carrot', 'the others are fruits'],
  [['hammer', 'wrench', 'saw', 'nail'], 'nail', 'the others are tools; a nail is a fastener'],
  [['copper', 'iron', 'oxygen', 'zinc'], 'oxygen', 'the others are metals'],
  [['sprint', 'jog', 'stroll', 'sit'], 'sit', 'the others are ways of moving on foot'],
  [['Monday', 'Friday', 'April', 'Sunday'], 'April', 'the others are days'],
  [['circle', 'square', 'cube', 'triangle'], 'cube', 'the others are flat shapes'],
  [['keyboard', 'mouse', 'monitor', 'processor'], 'processor', 'the others are external peripherals'],
  [['river', 'lake', 'ocean', 'desert'], 'desert', 'the others are bodies of water'],
  [['whisper', 'shout', 'mumble', 'listen'], 'listen', 'the others are ways of speaking'],
  [['second', 'minute', 'metre', 'hour'], 'metre', 'the others measure time'],
  [['Python', 'Java', 'Linux', 'Rust'], 'Linux', 'the others are programming languages'],
  [['violin', 'cello', 'trumpet', 'guitar'], 'trumpet', 'the others are string instruments'],
]

interface PassageTpl {
  build: (rng: import('../types').Rng) => { text: string; questions: { q: string; a: string; wrong: string[]; kind: 'main' | 'detail' | 'inference' }[] }
}

const PASSAGES: PassageTpl[] = [
  {
    build(rng) {
      const n = rng.pick([12, 18, 24, 30])
      const hours = rng.pick([2, 3, 4])
      const site = rng.pick(['Base Alpha', 'the north hangar', 'the training annex'])
      const text = `A network team at ${site} replaced ${n} aging switches over a single weekend. The work was scheduled in ${hours}-hour windows so that no building lost connectivity for more than one window. Technicians reported that the most time-consuming step was not the hardware swap itself but confirming that every port had been labelled and tested afterward. The team lead noted that the labelling step had been skipped during a previous upgrade, which later caused several outages that took days to trace.`
      return {
        text,
        questions: [
          { kind: 'main', q: 'What is the main point of the passage?', a: 'Careful verification after an upgrade prevents costly problems later.', wrong: ['Switch hardware is unreliable and fails often.', `${site} has the largest network on the base.`, 'Upgrades should always be done on weekends.', 'Technicians prefer to work on weekends.'] },
          { kind: 'detail', q: 'How many switches were replaced?', a: String(n), wrong: [String(n + 6), String(n - 6), String(hours), String(n * 2)] },
          { kind: 'detail', q: 'What took the most time?', a: 'Labelling and testing the ports', wrong: ['Swapping the hardware', 'Scheduling the windows', 'Tracing old outages', 'Moving the cables'] },
          { kind: 'inference', q: 'What can be inferred about the previous upgrade?', a: 'Skipping a verification step led to outages that were hard to diagnose.', wrong: ['It replaced more switches than this one.', 'It was completed in less time.', 'It used the same technicians.', 'It took place at a different site.'] },
        ],
      }
    },
  },
  {
    build(rng) {
      const pct = rng.pick([15, 20, 30, 40])
      const weeks = rng.pick([4, 6, 8])
      const text = `Researchers studying study habits tracked two groups preparing for a technical exam over ${weeks} weeks. One group reviewed material in long sessions once a week; the other studied in short daily sessions covering the same content. Although both groups spent equal total time, the daily group answered about ${pct}% more questions correctly on the final assessment. The researchers suggested that repeated short exposures make it easier to retrieve information under time pressure, which matters when a test allows well under a minute per item.`
      return {
        text,
        questions: [
          { kind: 'main', q: 'Which statement best summarises the passage?', a: 'Short, frequent study sessions produced better results than long weekly ones.', wrong: ['Spending more total time studying raises scores.', 'Technical exams should allow more time per item.', 'The two groups studied different material.', 'Weekly sessions are easier to schedule.'] },
          { kind: 'detail', q: 'By roughly how much did the daily group outperform the other?', a: `${pct}%`, wrong: [`${pct + 10}%`, `${pct - 10}%`, `${weeks}%`, `${pct * 2}%`] },
          { kind: 'detail', q: 'How long did the study last?', a: `${weeks} weeks`, wrong: [`${weeks + 2} weeks`, `${weeks - 2} weeks`, `${pct} weeks`, '1 week'] },
          { kind: 'inference', q: 'Why did the researchers think the daily group did better?', a: 'Frequent exposure makes recall faster under time pressure.', wrong: ['The daily group spent more time in total.', 'The weekly group skipped part of the material.', 'The final assessment favoured one group.', 'The daily group was older on average.'] },
        ],
      }
    },
  },
  {
    build(rng) {
      const yr = rng.pick([1950, 1960, 1970])
      const n = rng.pick([3, 4, 5])
      const text = `Early computers of the ${yr}s filled entire rooms and were operated by teams of specialists who fed them instructions on punched cards. A single error in a card could waste hours of machine time, so operators developed strict checking routines: cards were verified by a second person, decks were numbered, and ${n} copies were kept in case a deck was dropped. Many of the habits of modern software practice, such as code review and version control, can be traced to these practical constraints rather than to any theory.`
      return {
        text,
        questions: [
          { kind: 'main', q: 'What is the author’s central claim?', a: 'Modern software practices grew out of practical constraints of early computing.', wrong: ['Early computers were faster than people assume.', 'Punched cards were a poor design.', 'Theory has had no influence on software practice.', 'Operators disliked the checking routines.'] },
          { kind: 'detail', q: 'How many copies of a deck were kept?', a: String(n), wrong: [String(n + 1), String(n - 1), String(n * 2), '10'] },
          { kind: 'detail', q: 'Why were checking routines developed?', a: 'Because one error could waste hours of machine time', wrong: ['Because the machines were too small', 'Because operators were poorly trained', 'Because cards were expensive', 'Because decks were often dropped'] },
          { kind: 'inference', q: 'The passage suggests that code review is most similar to which earlier practice?', a: 'Having a second person verify the cards', wrong: ['Numbering the decks', 'Keeping backup copies', 'Feeding cards into the machine', 'Operating the machine in teams'] },
        ],
      }
    },
  },
  {
    build(rng) {
      const m = rng.pick([6, 9, 12])
      const name = rng.pick(['Harbor', 'Summit', 'Ridge'])
      const text = `The ${name} municipal library extended its weekday hours ${m} months ago after a survey showed that most residents could visit only in the evening. Since the change, visits have increased, but the rise has come almost entirely from people who had never held a library card. Staff attribute this to a related decision: new cards are now issued in under a minute at a self-service kiosk rather than at the front desk, where a short queue had often discouraged first-time visitors.`
      return {
        text,
        questions: [
          { kind: 'main', q: 'What is the passage mainly about?', a: 'Two changes that together increased library use, especially among new visitors.', wrong: ['Why evening visitors prefer self-service kiosks.', 'The history of the library.', 'Why existing card holders visit less often.', 'How to get a library card quickly.'] },
          { kind: 'detail', q: 'When were the hours extended?', a: `${m} months ago`, wrong: [`${m + 3} months ago`, `${m - 3} months ago`, 'Last week', 'Two years ago'] },
          { kind: 'detail', q: 'Where were cards issued before the change?', a: 'At the front desk', wrong: ['At a kiosk', 'Online', 'At city hall', 'At the entrance'] },
          { kind: 'inference', q: 'What does the passage imply about the queue at the front desk?', a: 'It discouraged some people from getting a card at all.', wrong: ['It was longer in the morning.', 'It has since grown.', 'Staff enjoyed working there.', 'It has been removed entirely.'] },
        ],
      }
    },
  },
  {
    build(rng) {
      const yrs = rng.pick([2, 3, 5])
      const text = `For ${yrs} years a small aircraft maintenance unit tracked every tool at the end of each shift using a paper checklist. The process caught missing tools reliably, but filling in the sheets took each crew about twenty minutes. When the unit switched to a scanner that reads a tag on each tool, the end-of-shift count dropped to under two minutes. The unit's supervisor cautioned, however, that the scanner only confirms a tool is in the room, not that it is in the correct drawer, so a brief visual check is still required.`
      return {
        text,
        questions: [
          { kind: 'main', q: 'Which best captures the passage?', a: 'A new scanning system saved time but did not remove the need for a visual check.', wrong: ['Paper checklists are more accurate than scanners.', 'The unit stopped counting tools.', 'Tools often go missing in maintenance units.', 'Scanners should replace every paper process.'] },
          { kind: 'detail', q: 'How long did the paper process take per crew?', a: 'About twenty minutes', wrong: ['Under two minutes', 'About an hour', `${yrs} minutes`, 'About ten minutes'] },
          { kind: 'detail', q: 'How long was the paper system in use?', a: `${yrs} years`, wrong: [`${yrs + 2} years`, `${yrs - 1} years`, 'Two months', 'Six months'] },
          { kind: 'inference', q: 'What limitation of the scanner does the supervisor point out?', a: 'It cannot tell whether a tool is stored in the right place.', wrong: ['It is slower than paper.', 'It misses tools without tags.', 'It requires two people.', 'It is expensive to maintain.'] },
        ],
      }
    },
  },
]

function analogyFamily(id: string, name: string, pairs: Pair[], relation: string, minDifficulty: Difficulty, spot: string, trap: string): RuleFamily {
  return {
    id,
    name,
    minDifficulty,
    build(rng, d) {
      const [p1, p2] = sample(rng, pairs, 2) as [Pair, Pair]
      const reverse = d >= 3 && rng.bool(0.35)
      const [a, b] = reverse ? [p1[1], p1[0]] : p1
      const [c, correct] = reverse ? [p2[1], p2[0]] : p2
      // distractors: words that fit the *same* relation with other partners (plausible), then words from other relations
      const used = new Set([a, b, c, correct])
      const sameRelation = pairs.flat().filter((w) => !used.has(w))
      const otherPool = [...SYN, ...ANT, ...PART, ...CAT, ...FUNC, ...DEG, ...WORKER].flat().filter((w) => !used.has(w))
      const cands = [...sample(rng, sameRelation, 3), ...sample(rng, otherPool, 4)]
      return {
        prompt: 'Complete the analogy.',
        stem: `${a} : ${b} :: ${c} : ?`,
        correct,
        distractors: uniqueDistractors(correct, cands, () => rng.pick(otherPool), d >= 3 ? 4 : 3),
        explanation: {
          pattern: `${a} is to ${b} as ${c} is to ${correct}: ${relation}${reverse ? ' (read in reverse order here)' : ''}.`,
          howToSpot: spot,
          trap,
        },
      }
    },
  }
}

export const VERBAL_FAMILIES: RuleFamily[] = [
  analogyFamily('synonym', 'Synonym analogies', SYN, 'the words mean the same', 1, 'Make a sentence: "big means the same as large". Apply the sentence to the third word.', 'Choosing a word that is merely related rather than a true synonym.'),
  analogyFamily('antonym', 'Antonym analogies', ANT, 'the words are opposites', 1, 'Say the relationship aloud: "hot is the opposite of cold".', 'Picking a synonym of the third word when the relationship is opposition.'),
  analogyFamily('part-whole', 'Part-to-whole analogies', PART, 'the first is a part of the second', 1, 'Ask "is the first a piece of the second?" and keep the direction the same.', 'Reversing the direction (whole : part instead of part : whole).'),
  analogyFamily('category', 'Member-to-category analogies', CAT, 'the first is a kind of the second', 2, 'The sentence "X is a type of Y" should fit both pairs.', 'Choosing another member of the same category instead of the category itself.'),
  analogyFamily('function', 'Tool-to-use analogies', FUNC, 'the first is used to do the second', 2, 'Ask "what is this object for?"', 'Choosing a related object instead of the action it performs.'),
  analogyFamily('degree', 'Degree analogies', DEG, 'the second is a more intense version of the first', 3, 'Both words share a quality; one is stronger. Keep the direction (mild → intense).', 'Picking a synonym of equal strength rather than the more intense word.'),
  analogyFamily('worker-tool', 'Worker-to-workplace analogies', WORKER, 'the first person works with or in the second', 2, 'Think "who uses this?" or "where does this person work?"', 'Choosing something the worker makes rather than what they use.'),
  {
    id: 'vocabulary',
    name: 'Word meaning',
    minDifficulty: 1,
    build(rng, d) {
      const [word, meaning, wrong] = rng.pick(VOCAB)
      const others = VOCAB.filter((v) => v[0] !== word).map((v) => v[1])
      const cands = d <= 2 ? [...wrong, ...sample(rng, others, 2)] : [...sample(rng, others, 3), ...wrong]
      return {
        prompt: 'Choose the closest meaning.',
        stem: word.toUpperCase(),
        correct: meaning,
        distractors: uniqueDistractors(meaning, cands, () => rng.pick(others), d >= 3 ? 4 : 3),
        explanation: {
          pattern: `${word} means "${meaning}".`,
          howToSpot: 'Try substituting each option into a sentence you know the word from. Look for familiar roots and prefixes.',
          trap: 'Picking the exact opposite when a prefix (un-, in-, dis-) is misread.',
        },
      }
    },
  },
  {
    id: 'odd-word',
    name: 'Odd word out',
    minDifficulty: 1,
    build(rng, d) {
      const [words, odd, why] = rng.pick(ODD_SETS)
      const normal = words.filter((w) => w !== odd)
      const extra = d >= 3 ? sample(rng, ODD_SETS.filter((s) => s[1] !== odd).flatMap((s) => s[0].filter((w) => w !== s[1])).filter((w) => !words.includes(w)), 1) : []
      // extra word must belong to the category; we can't guarantee, so only use the 3 normals + repeat not allowed => for d>=3 add a 4th that is deliberately from same set when possible
      const distractors = uniqueDistractors(odd, normal, () => extra[0] ?? rng.pick(normal), 3)
      return {
        prompt: 'Which word does not belong with the others?',
        stem: rng.shuffle(words).join(', '),
        correct: odd,
        distractors,
        explanation: {
          pattern: `${odd} is the odd one out: ${why}.`,
          howToSpot: 'Find the category that fits three of the four. The leftover word is the answer.',
          trap: 'Choosing a word that is merely less familiar rather than one that breaks the category.',
        },
      }
    },
  },
  ...(['main', 'detail', 'inference'] as const).map<RuleFamily>((kind) => ({
    id: `passage-${kind}`,
    name: kind === 'main' ? 'Passage: main idea' : kind === 'detail' ? 'Passage: specific detail' : 'Passage: inference',
    minDifficulty: kind === 'inference' ? 2 : 1,
    build(rng, d) {
      const tpl = rng.pick(PASSAGES)
      const p = tpl.build(rng)
      const qs = p.questions.filter((q) => q.kind === kind)
      const q = rng.pick(qs)
      const filler = p.questions.filter((x) => x !== q).flatMap((x) => [x.a, ...x.wrong])
      return {
        prompt: q.q,
        passage: p.text,
        correct: q.a,
        distractors: uniqueDistractors(q.a, q.wrong, () => rng.pick(filler), d >= 3 ? 4 : 3),
        explanation: {
          pattern: kind === 'main' ? 'The main idea is the claim every sentence supports, not a single detail.' : kind === 'detail' ? 'The answer is stated directly in the passage; find the sentence and match it.' : 'The answer is not stated outright but is the only option the passage supports.',
          howToSpot: kind === 'main' ? 'Read the first and last sentences first; they usually frame the point.' : kind === 'detail' ? 'Scan for the keyword in the question (a number, a name, a place) and read that sentence closely.' : 'Eliminate options that go beyond what the passage says, then choose what remains.',
          trap: kind === 'main' ? 'Choosing a true detail that is too narrow to be the main point.' : 'Choosing a number or fact that appears in the passage but answers a different question.',
        },
      }
    },
  })),
]

export const verbal = makeGenerator('verbal', VERBAL_FAMILIES)

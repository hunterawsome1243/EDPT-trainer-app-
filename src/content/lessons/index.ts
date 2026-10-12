import type { QuestionType } from '../../types'
import type { Lesson } from './types'
import { numberSequenceLesson } from './numberSequence'
import { letterSequenceLesson } from './letterSequence'
import { figureLesson } from './figure'
import { arithmeticLesson } from './arithmetic'
import { logicLesson } from './logic'
import { verbalLesson } from './verbal'

export type { Lesson, LessonSection, WorkedExample } from './types'

export const LESSONS: Record<QuestionType, Lesson> = {
  'number-sequence': numberSequenceLesson,
  'letter-sequence': letterSequenceLesson,
  figure: figureLesson,
  arithmetic: arithmeticLesson,
  logic: logicLesson,
  verbal: verbalLesson,
}

export const LESSON_ORDER: QuestionType[] = ['number-sequence', 'letter-sequence', 'arithmetic', 'figure', 'logic', 'verbal']

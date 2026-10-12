import type { QuestionType } from '../../types'

export interface WorkedExample {
  stem: string
  steps: string[]
  answer: string
}

export interface LessonSection {
  heading: string
  paragraphs: string[]
  /** optional bullet list rendered after the paragraphs */
  bullets?: string[]
}

export interface Lesson {
  type: QuestionType
  title: string
  intro: string
  sections: LessonSection[]
  examples: WorkedExample[]
  /** "How to spot the pattern in 10 seconds" */
  checklist: string[]
  traps: string[]
  /** rule ids covered, with a one-line description each */
  rules: { id: string; summary: string }[]
}

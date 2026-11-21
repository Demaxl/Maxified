import { OTHER_VALUE, asList, asText, otherKey, surveyQuestions } from './survey'
import type { SurveyAnswerValue, SurveyAnswers, SurveyOption, SurveyQuestion } from './survey'

/**
 * Read-only knowledge of every survey version, for the admin dashboard. Validation only
 * ever uses `surveyQuestions`; nothing here is accepted from new submissions.
 */

export type SurveyVersion = 'v1' | 'v2'

const options = (...labels: string[]): SurveyOption[] =>
  labels.map(label => ({
    value: label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, ''),
    label
  }))

/** Questions from the first survey (commit 5167d85) whose ids were later retired. */
export const legacyQuestions: SurveyQuestion[] = [
  {
    id: 'obstacles',
    type: 'multi',
    maxSelections: 2,
    title: 'What is your biggest obstacle right now?',
    allowOther: true,
    options: options(
      'Not knowing what workouts to do',
      'Nutrition confusion',
      'Consistency',
      'Food costs',
      'Limited time',
      'Limited equipment or gym access',
      'Not seeing progress'
    )
  },
  {
    id: 'training_location',
    type: 'single',
    title: 'Where would you train?',
    options: options(
      'Commercial gym',
      'Small or local gym',
      'Home with equipment',
      'Home with little or no equipment',
      'Not sure yet'
    )
  },
  {
    id: 'program_wishlist',
    type: 'multi',
    maxSelections: 3,
    title: 'What would you most want from this program?',
    allowOther: true,
    options: options(
      'Workout plans',
      'Exercise demonstrations',
      'Nutrition guidance',
      'Affordable meal ideas',
      'Calorie and protein guidance',
      'Help deciding whether to bulk, cut, or recomp',
      'Progress trackers',
      'Consistency advice'
    )
  }
]

/**
 * Values the first survey stored under ids the current survey still uses. They are shown
 * as their own buckets, never folded into a current option that may not mean the same.
 */
const legacyOptionLabels: Record<string, Record<string, string>> = {
  experience: { more_than_a_year: 'More than a year (v1 survey)' }
}

/** The order the first survey asked its questions in; ids it shared with v2 are listed too. */
const v1QuestionOrder = [
  'goal',
  'experience',
  'obstacles',
  'training_location',
  'days_per_week',
  'program_wishlist',
  'paid_before',
  'burning_question'
]

/** How the first survey worded the questions it shared with v2. */
const v1Titles: Record<string, string> = {
  goal: 'What is your main fitness goal?',
  experience: 'How long have you been consistently training?',
  paid_before: 'Have you paid for a fitness program, guide, or coaching before?',
  paid_before_details: 'What did you buy, and what was useful or missing?',
  burning_question: 'What\'s one fitness question you wish someone would answer clearly?'
}

const legacyOnlyIds = new Set(legacyQuestions.map(question => question.id))

const questionsById = new Map<string, { question: SurveyQuestion, version: SurveyVersion | 'all' }>([
  ...surveyQuestions.map(question => [question.id, { question, version: 'all' as const }] as const),
  ...legacyQuestions.map(question => [question.id, { question, version: 'v1' as const }] as const)
])

export function findQuestion(questionId: string) {
  return questionsById.get(questionId)?.question
}

export function isLegacyQuestion(questionId: string) {
  return legacyOnlyIds.has(questionId)
}

function humanize(key: string) {
  const text = key.replace(/_+/g, ' ').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : key
}

/** The original label for a stored value; unknown values stay readable rather than failing. */
export function labelFor(questionId: string, value: string) {
  if (value === OTHER_VALUE) {
    return 'Other'
  }

  const question = findQuestion(questionId)

  if (question && question.type !== 'text') {
    const option = question.options.find(item => item.value === value)

    if (option) {
      return option.label
    }
  }

  return legacyOptionLabels[questionId]?.[value] ?? humanize(value)
}

/** All options a question has ever had, current ones first, so filters cover old responses too. */
export function optionsFor(questionId: string, { includeLegacy = true } = {}): SurveyOption[] {
  const question = findQuestion(questionId)
  const current = question && question.type !== 'text' ? [...question.options] : []

  if (question && question.type !== 'text' && question.allowOther) {
    current.push({ value: OTHER_VALUE, label: 'Other' })
  }

  if (!includeLegacy) {
    return current
  }

  const legacy = Object.entries(legacyOptionLabels[questionId] ?? {}).map(([value, label]) => ({ value, label }))

  return [...current, ...legacy]
}

/** Titles for every stored key, including "Other" texts and follow-ups. */
export function titleForKey(key: string, version: SurveyVersion = 'v2') {
  if (version === 'v1' && v1Titles[key]) {
    return v1Titles[key]
  }

  const direct = findQuestion(key)

  if (direct) {
    return direct.title
  }

  if (key.endsWith('__other')) {
    const parent = findQuestion(key.slice(0, -'__other'.length))
    return parent ? `${parent.title} (Other, in their words)` : humanize(key)
  }

  for (const question of [...surveyQuestions, ...legacyQuestions]) {
    if (question.type === 'single' && question.followUp?.id === key) {
      return question.followUp.title
    }
  }

  return humanize(key)
}

export function versionOf(answers: SurveyAnswers): SurveyVersion {
  return Object.keys(answers).some(key => legacyOnlyIds.has(key)) || !('physique' in answers) ? 'v1' : 'v2'
}

export function hasAnswer(value: SurveyAnswerValue | undefined) {
  return Array.isArray(value) ? value.length > 0 : Boolean(asText(value).trim())
}

export type AnswerEntry = {
  key: string
  title: string
  /**
   * Display text, one item per selected choice (labels can contain commas, so they are
   * never joined here); free-text answers are a single item, unchanged.
   */
  value: string[] | null
  /** The stored values, unchanged, for anyone checking the raw data. */
  raw: SurveyAnswerValue | null
  legacy: boolean
}

function displayValue(questionId: string, value: SurveyAnswerValue | undefined) {
  if (!hasAnswer(value)) {
    return null
  }

  const question = findQuestion(questionId)
  const label = (item: string) => !question || question.type === 'text' ? item : labelFor(questionId, item)

  return Array.isArray(value) ? asList(value).map(label) : [label(asText(value))]
}

/**
 * Every answer in survey order: the questions the response's version asked, then any
 * stored key the catalog doesn't know, so nothing saved is ever hidden.
 */
export function answerEntries(answers: SurveyAnswers): AnswerEntry[] {
  const version = versionOf(answers)
  const asked = version === 'v2'
    ? surveyQuestions
    : v1QuestionOrder.map(findQuestion).filter((question): question is SurveyQuestion => Boolean(question))
  const entries: AnswerEntry[] = []
  const seen = new Set<string>()

  const push = (key: string, legacy: boolean, always: boolean) => {
    seen.add(key)

    if (!always && !hasAnswer(answers[key])) {
      return
    }

    entries.push({
      key,
      title: titleForKey(key, version),
      value: displayValue(key, answers[key]),
      raw: answers[key] ?? null,
      legacy
    })
  }

  for (const question of asked) {
    const legacy = isLegacyQuestion(question.id)

    push(question.id, legacy, true)

    if (question.type !== 'text' && question.allowOther) {
      push(otherKey(question.id), legacy, false)
    }

    if (question.type === 'single' && question.followUp) {
      push(question.followUp.id, legacy, false)
    }
  }

  for (const key of Object.keys(answers)) {
    if (!seen.has(key)) {
      push(key, true, false)
    }
  }

  return entries
}

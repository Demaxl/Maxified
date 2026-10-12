export type SurveyOption = {
  value: string
  label: string
}

type SurveyQuestionBase = {
  id: string
  title: string
  helper?: string
  optional?: boolean
}

export type SurveyFollowUp = {
  id: string
  when: string
  title: string
  placeholder?: string
}

export type SurveyQuestion
  = | (SurveyQuestionBase & {
    type: 'single'
    options: SurveyOption[]
    allowOther?: boolean
    followUp?: SurveyFollowUp
  })
  | (SurveyQuestionBase & {
    type: 'multi'
    options: SurveyOption[]
    allowOther?: boolean
    maxSelections?: number
  })
  | (SurveyQuestionBase & {
    type: 'text'
    placeholder?: string
    multiline?: boolean
  })

export type SurveyAnswerValue = string | string[]
export type SurveyAnswers = Record<string, SurveyAnswerValue>

export const OTHER_VALUE = 'other'

const options = (...labels: string[]): SurveyOption[] =>
  labels.map(label => ({
    value: label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, ''),
    label
  }))

/**
 * Eight questions, one per step. Question ids are the storage keys, so renaming one
 * starts a new series rather than rewriting history: responses from earlier versions
 * of the survey keep whatever keys they were saved with.
 */
export const surveyQuestions: SurveyQuestion[] = [
  {
    id: 'goal',
    type: 'single',
    title: 'What is your main fitness goal?',
    allowOther: true,
    options: options(
      'Build muscle',
      'Lose fat',
      'Build muscle and lose fat',
      'Gain weight',
      'Get stronger'
    )
  },
  {
    id: 'experience',
    type: 'single',
    title: 'How long have you been consistently training?',
    options: options(
      'Haven\'t started',
      'Less than 3 months',
      '3–6 months',
      '6–12 months',
      'More than a year'
    )
  },
  {
    id: 'obstacles',
    type: 'multi',
    maxSelections: 2,
    title: 'What is your biggest obstacle right now?',
    helper: 'Choose up to 2.',
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
    id: 'days_per_week',
    type: 'single',
    title: 'How many days per week could you realistically train?',
    options: [
      { value: '2', label: '2 days' },
      { value: '3', label: '3 days' },
      { value: '4', label: '4 days' },
      { value: '5', label: '5 days' },
      { value: '6_plus', label: '6+ days' }
    ]
  },
  {
    id: 'program_wishlist',
    type: 'multi',
    maxSelections: 3,
    title: 'What would you most want from this program?',
    helper: 'Choose up to 3 — this directly shapes what I build.',
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
  },
  {
    id: 'paid_before',
    type: 'single',
    title: 'Have you paid for a fitness program, guide, or coaching before?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ],
    followUp: {
      id: 'paid_before_details',
      when: 'yes',
      title: 'What did you buy, and what was useful or missing?',
      placeholder: 'Optional, but really useful to know.'
    }
  },
  {
    id: 'burning_question',
    type: 'text',
    multiline: true,
    optional: true,
    title: 'What\'s one fitness question you wish someone would answer clearly?',
    helper: 'Optional — leave it blank if nothing comes to mind.',
    placeholder: 'Ask me anything, and I\'ll try to answer it in the program.'
  }
]

export const surveyStepCount = surveyQuestions.length

export const surveyAnswerKeys = surveyQuestions.flatMap((question) => {
  const keys = [question.id]

  if (question.type !== 'text' && question.allowOther) {
    keys.push(otherKey(question.id))
  }

  if (question.type === 'single' && question.followUp) {
    keys.push(question.followUp.id)
  }

  return keys
})

export function otherKey(questionId: string) {
  return `${questionId}__other`
}

export function isQuestionAnswered(question: SurveyQuestion, answers: SurveyAnswers) {
  if (question.optional) {
    return true
  }

  const value = answers[question.id]

  if (question.type === 'multi') {
    const selections = Array.isArray(value) ? value : []

    if (!selections.length) {
      return false
    }

    return !selections.includes(OTHER_VALUE) || Boolean(asText(answers[otherKey(question.id)]).trim())
  }

  if (!asText(value).trim()) {
    return false
  }

  if (question.type === 'single' && value === OTHER_VALUE) {
    return Boolean(asText(answers[otherKey(question.id)]).trim())
  }

  return true
}

export function asText(value: SurveyAnswerValue | undefined) {
  return typeof value === 'string' ? value : ''
}

export function asList(value: SurveyAnswerValue | undefined) {
  return Array.isArray(value) ? value : []
}

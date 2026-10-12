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
 * One question per step. Question ids are the storage keys, so a question whose
 * meaning or options change gets a new id rather than reusing an old one: responses
 * from earlier versions of the survey keep the keys they were saved with, and old and
 * new answers never mix under the same key. Retired ids, for reference when reading
 * older responses: `obstacles`, `training_location`, `program_wishlist`.
 */
export const surveyQuestions: SurveyQuestion[] = [
  {
    id: 'physique',
    type: 'single',
    title: 'Which best describes your current physique?',
    allowOther: true,
    options: options(
      'Skinny',
      'Skinny-fat',
      'Average',
      'Overweight',
      'Muscular but want to get leaner'
    )
  },
  {
    id: 'goal',
    type: 'single',
    title: 'What is your main fitness goal right now?',
    allowOther: true,
    options: options(
      'Build muscle',
      'Lose fat',
      'Build muscle and lose fat',
      'Gain weight',
      'Get stronger',
      'Look more athletic/aesthetic',
      'Improve general health/fitness'
    )
  },
  {
    id: 'experience',
    type: 'single',
    title: 'How long have you been consistently working out?',
    options: [
      // Same value as the earlier survey's "Haven't started", so the two stay comparable.
      { value: 'haven_t_started', label: 'I haven\'t started yet' },
      ...options(
        'Less than 3 months',
        '3–6 months',
        '6–12 months',
        '1–2 years',
        'More than 2 years'
      )
    ]
  },
  {
    id: 'blockers',
    type: 'multi',
    title: 'What\'s the biggest thing stopping you from achieving the physique you want?',
    helper: 'Choose all that apply.',
    allowOther: true,
    options: options(
      'I don\'t know what workouts to do',
      'I don\'t know how to eat for my goal',
      'I struggle with consistency',
      'I don\'t know whether to bulk, cut or maintain',
      'I don\'t know how much protein/calories I need',
      'Healthy/high-protein food is too expensive',
      'I don\'t have enough time',
      'I don\'t have access to a good gym',
      'I struggle to gain weight',
      'I struggle to lose fat',
      'I don\'t see progress despite training',
      'There\'s too much conflicting fitness information online'
    )
  },
  {
    id: 'most_confusing',
    type: 'single',
    title: 'Which part of fitness confuses you the most?',
    allowOther: true,
    options: options(
      'Training/workout programming',
      'Nutrition',
      'Calories/macros',
      'Supplements',
      'Bulking/cutting',
      'Progressive overload',
      'Recovery/sleep',
      'Staying consistent',
      'Tracking progress'
    )
  },
  {
    id: 'already_tried',
    type: 'text',
    multiline: true,
    optional: true,
    title: 'What have you already tried to achieve your fitness goal?',
    placeholder: 'Programs, diets, apps, anything — what did you try, and how did it go?'
  },
  {
    id: 'consistency_breakers',
    type: 'single',
    title: 'What usually causes you to stop being consistent?',
    allowOther: true,
    options: options(
      'Lack of motivation',
      'Not seeing results',
      'School/work',
      'Cost',
      'Diet is difficult to maintain',
      'Workouts take too long',
      'I don\'t know whether what I\'m doing is working',
      'Injuries/discomfort'
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
    id: 'usual_training_location',
    type: 'single',
    title: 'Where do you usually train?',
    options: options(
      'Commercial gym',
      'Small/local gym',
      'Home with equipment',
      'Home with little/no equipment',
      'I don\'t currently train'
    )
  },
  {
    id: 'guide_wishlist',
    type: 'multi',
    maxSelections: 5,
    title: 'What would you most want included in a fitness guide?',
    helper: 'Choose up to 5.',
    allowOther: true,
    options: options(
      'Complete workout programs',
      'Exercise tutorials',
      'How to build muscle',
      'How to lose fat',
      'How to go from skinny-fat to muscular',
      'How to bulk without getting too fat',
      'How to cut without losing muscle',
      'Meal plans',
      'Nigerian meal ideas',
      'Affordable high-protein foods',
      'Calorie/protein calculation',
      'Supplements',
      'Progress tracking',
      'Staying consistent/motivated',
      'Mistakes to avoid',
      'My personal transformation/process'
    )
  },
  {
    id: 'burning_question',
    type: 'text',
    multiline: true,
    optional: true,
    title: 'What\'s one fitness question you wish someone would just give you a straightforward answer to?',
    placeholder: 'Ask me anything, and I\'ll try to answer it in the guide.'
  },
  {
    id: 'one_result',
    type: 'text',
    multiline: true,
    optional: true,
    title: 'If you could achieve ONE fitness result over the next 6–12 months, what would it be?',
    placeholder: 'Be as specific as you like.'
  },
  {
    id: 'info_sources',
    type: 'single',
    title: 'Where do you currently get most of your fitness information?',
    allowOther: true,
    options: options(
      'TikTok',
      'Instagram',
      'YouTube',
      'X/Twitter',
      'Friends',
      'Personal trainer',
      'Fitness websites/blogs',
      'I don\'t really consume fitness content'
    )
  },
  {
    id: 'paid_before',
    type: 'single',
    title: 'Have you ever paid for a fitness program, guide or coaching before?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' }
    ],
    followUp: {
      id: 'paid_before_details',
      when: 'yes',
      title: 'What did you buy, and was it worth it? Why or why not?',
      placeholder: 'Optional, but really useful to know.'
    }
  },
  {
    id: 'price_expectation',
    type: 'text',
    optional: true,
    title: 'How much would you realistically consider paying for a detailed fitness guide that included workout programs, nutrition guidance, meal ideas and progress-tracking resources?',
    placeholder: 'Your honest answer, in any currency.'
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

/** Rejects choices the question doesn't offer, such as a value from an older version of it. */
export function hasKnownChoices(question: SurveyQuestion, answers: SurveyAnswers) {
  const value = answers[question.id]

  if (question.type === 'text' || value === undefined) {
    return true
  }

  const allowed = new Set(question.options.map(option => option.value))

  if (question.allowOther) {
    allowed.add(OTHER_VALUE)
  }

  if (question.type === 'multi') {
    return Array.isArray(value) && value.every(choice => allowed.has(choice))
  }

  return typeof value === 'string' && allowed.has(value)
}

export function asText(value: SurveyAnswerValue | undefined) {
  return typeof value === 'string' ? value : ''
}

export function asList(value: SurveyAnswerValue | undefined) {
  return Array.isArray(value) ? value : []
}

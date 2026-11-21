import { breakdown, ranked } from './aggregate'
import { labelFor } from '../survey-catalog'
import type { AnalyticsRow, Breakdown, PriorityTier, TopicPriority } from './types'

/**
 * How the suggested content priority is worked out. Every number here is a judgement call,
 * not a fact about the audience: edit freely, and the dashboard shows whatever is set.
 */
export const priorityConfig = {
  /** Relative importance of each signal. Signals without enough data are left out and the rest re-weighted. */
  weights: {
    /** Share of respondents who asked for the topic, relative to the most requested topic. */
    demand: 0.6,
    /** How widespread the struggles the topic addresses are, relative to the most common struggle. */
    struggle: 0.25,
    /** In how many physique segments the topic makes the top list. */
    breadth: 0.15
  },
  /** Minimum score for each tier; anything lower is "low signal". */
  thresholds: {
    core: 0.65,
    supporting: 0.45,
    optional: 0.25
  },
  /** Below this many respondents to the topic question, every topic is capped at "optional". */
  minSample: 30,
  /** Topics picked by fewer respondents than this are always "low signal". */
  minCount: 3,
  /** "Top list" for the breadth signal. */
  topN: 5,
  /** Physique segments smaller than this are left out of the breadth signal. */
  minSegmentSize: 10,
  /**
   * Which `blockers` answers each `guide_wishlist` topic addresses. Topics with no entry
   * get no struggle signal rather than a guessed one.
   */
  topicStruggles: {
    complete_workout_programs: ['i_don_t_know_what_workouts_to_do', 'i_don_t_see_progress_despite_training'],
    exercise_tutorials: ['i_don_t_know_what_workouts_to_do'],
    how_to_build_muscle: ['i_struggle_to_gain_weight', 'i_don_t_see_progress_despite_training'],
    how_to_lose_fat: ['i_struggle_to_lose_fat'],
    how_to_go_from_skinny_fat_to_muscular: ['i_don_t_know_whether_to_bulk_cut_or_maintain', 'i_struggle_to_lose_fat'],
    how_to_bulk_without_getting_too_fat: ['i_don_t_know_whether_to_bulk_cut_or_maintain', 'i_struggle_to_gain_weight'],
    how_to_cut_without_losing_muscle: ['i_don_t_know_whether_to_bulk_cut_or_maintain', 'i_struggle_to_lose_fat'],
    meal_plans: ['i_don_t_know_how_to_eat_for_my_goal'],
    nigerian_meal_ideas: ['i_don_t_know_how_to_eat_for_my_goal', 'healthy_high_protein_food_is_too_expensive'],
    affordable_high_protein_foods: ['healthy_high_protein_food_is_too_expensive', 'i_don_t_know_how_much_protein_calories_i_need'],
    calorie_protein_calculation: ['i_don_t_know_how_much_protein_calories_i_need', 'i_don_t_know_how_to_eat_for_my_goal'],
    progress_tracking: ['i_don_t_see_progress_despite_training'],
    staying_consistent_motivated: ['i_struggle_with_consistency'],
    mistakes_to_avoid: ['there_s_too_much_conflicting_fitness_information_online', 'i_don_t_see_progress_despite_training']
  } as Record<string, string[]>
}

export type PriorityConfig = typeof priorityConfig

export const TOPIC_QUESTION = 'guide_wishlist'
export const STRUGGLE_QUESTION = 'blockers'
export const SEGMENT_QUESTION = 'physique'

function tierFor(score: number, config: PriorityConfig): PriorityTier {
  if (score >= config.thresholds.core) {
    return 'core'
  }

  if (score >= config.thresholds.supporting) {
    return 'supporting'
  }

  return score >= config.thresholds.optional ? 'optional' : 'low_signal'
}

export function prioritiseTopics(rows: AnalyticsRow[], config: PriorityConfig = priorityConfig) {
  const topics = breakdown(rows, TOPIC_QUESTION)
  const struggles = breakdown(rows, STRUGGLE_QUESTION)
  const maxTopicPct = Math.max(0, ...topics.items.map(item => item.pct))
  const maxStrugglePct = Math.max(0, ...struggles.items.map(item => item.pct))

  const segmentTops: Set<string>[] = []
  const segmentValues = new Set(rows.map(row => row.answers[SEGMENT_QUESTION]).filter((value): value is string => typeof value === 'string' && Boolean(value)))

  for (const value of segmentValues) {
    const segment: Breakdown = breakdown(rows.filter(row => row.answers[SEGMENT_QUESTION] === value), TOPIC_QUESTION)

    if (segment.answered >= config.minSegmentSize) {
      segmentTops.push(new Set(ranked(segment.items).filter(item => item.count > 0).slice(0, config.topN).map(item => item.value)))
    }
  }

  const priorities = new Map<string, TopicPriority>()

  for (const topic of topics.items) {
    const reasons: string[] = []
    const demand = maxTopicPct ? topic.pct / maxTopicPct : 0

    const related = (config.topicStruggles[topic.value] ?? []).map(value => ({
      value,
      label: labelFor(STRUGGLE_QUESTION, value),
      pct: struggles.items.find(item => item.value === value)?.pct ?? 0
    }))
    const struggle = related.length && struggles.answered && maxStrugglePct
      ? Math.max(...related.map(item => item.pct)) / maxStrugglePct
      : null

    const breadth = segmentTops.length
      ? segmentTops.filter(top => top.has(topic.value)).length / segmentTops.length
      : null

    const parts: [number | null, number][] = [
      [demand, config.weights.demand],
      [struggle, config.weights.struggle],
      [breadth, config.weights.breadth]
    ]
    const used = parts.filter((part): part is [number, number] => part[0] !== null)
    const weightTotal = used.reduce((sum, [, weight]) => sum + weight, 0)
    const score = weightTotal ? used.reduce((sum, [value, weight]) => sum + value * weight, 0) / weightTotal : 0

    let tier = tierFor(score, config)

    if (struggle === null) {
      reasons.push(related.length ? 'No struggle data in this selection' : 'Not mapped to a struggle')
    }

    if (breadth === null) {
      reasons.push(`No physique segment has ${config.minSegmentSize}+ respondents yet`)
    }

    if (topic.count < config.minCount) {
      tier = 'low_signal'
      reasons.push(`Picked by fewer than ${config.minCount} respondents`)
    } else if (topics.answered < config.minSample && (tier === 'core' || tier === 'supporting')) {
      tier = 'optional'
      reasons.push(`Capped: fewer than ${config.minSample} respondents answered this question`)
    }

    priorities.set(topic.value, {
      tier,
      score,
      components: { demand, struggle, breadth },
      relatedStruggles: related,
      reasons
    })
  }

  return { topics, priorities }
}

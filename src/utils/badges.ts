// ============================================================================
// SYSTÈME DE BADGES - Spix App
// ============================================================================

import type { Badge, BadgeId, Entry } from '../types';
import { isSportEntryType } from '../constants/values';

// Définitions des badges
export const BADGE_DEFINITIONS: Record<BadgeId, Omit<Badge, 'unlockedAt'>> = {
  first_workout: {
    id: 'first_workout',
    name: 'badges.first_workout.name',
    description: 'badges.first_workout.description',
    icon: '🎯',
  },
  streak_7: {
    id: 'streak_7',
    name: 'badges.streak_7.name',
    description: 'badges.streak_7.description',
    icon: '🔥',
  },
  streak_30: {
    id: 'streak_30',
    name: 'badges.streak_30.name',
    description: 'badges.streak_30.description',
    icon: '💪',
  },
  workouts_10: {
    id: 'workouts_10',
    name: 'badges.workouts_10.name',
    description: 'badges.workouts_10.description',
    icon: '⭐',
  },
  workouts_50: {
    id: 'workouts_50',
    name: 'badges.workouts_50.name',
    description: 'badges.workouts_50.description',
    icon: '🌟',
  },
  workouts_100: {
    id: 'workouts_100',
    name: 'badges.workouts_100.name',
    description: 'badges.workouts_100.description',
    icon: '👑',
  },
  runner_10km: {
    id: 'runner_10km',
    name: 'badges.runner_10km.name',
    description: 'badges.runner_10km.description',
    icon: '🏃',
  },
  runner_50km: {
    id: 'runner_50km',
    name: 'badges.runner_50km.name',
    description: 'badges.runner_50km.description',
    icon: '🥇',
  },
  consistent_month: {
    id: 'consistent_month',
    name: 'badges.consistent_month.name',
    description: 'badges.consistent_month.description',
    icon: '📅',
  },
};

// Vérifier quels badges sont débloqués
export function checkBadges(
  entries: Entry[],
  currentStreak: number,
  bestStreak: number,
  weeklyGoalsMet: number // Nombre de semaines consécutives avec objectif atteint
): BadgeId[] {
  const unlockedBadges: BadgeId[] = [];
  
  const sportEntries = entries.filter(e => isSportEntryType(e.type));
  const runEntries = entries.filter(e => e.type === 'run');
  
  const totalWorkouts = sportEntries.length;
  const totalRunDistance = runEntries.reduce((sum, e) => {
    if (e.type === 'run') return sum + e.distanceKm;
    return sum;
  }, 0);

  // Première séance
  if (totalWorkouts >= 1) {
    unlockedBadges.push('first_workout');
  }

  // Streaks
  if (currentStreak >= 7 || bestStreak >= 7) {
    unlockedBadges.push('streak_7');
  }
  if (currentStreak >= 30 || bestStreak >= 30) {
    unlockedBadges.push('streak_30');
  }

  // Nombre de séances
  if (totalWorkouts >= 10) {
    unlockedBadges.push('workouts_10');
  }
  if (totalWorkouts >= 50) {
    unlockedBadges.push('workouts_50');
  }
  if (totalWorkouts >= 100) {
    unlockedBadges.push('workouts_100');
  }

  // Distance course
  if (totalRunDistance >= 10) {
    unlockedBadges.push('runner_10km');
  }
  if (totalRunDistance >= 50) {
    unlockedBadges.push('runner_50km');
  }

  // Objectifs hebdo
  if (weeklyGoalsMet >= 4) {
    unlockedBadges.push('consistent_month');
  }

  return unlockedBadges;
}

// Obtenir les badges avec leur état
export function getBadgesWithState(unlockedIds: BadgeId[]): Badge[] {
  return Object.values(BADGE_DEFINITIONS).map(badge => ({
    ...badge,
    unlockedAt: unlockedIds.includes(badge.id) ? new Date().toISOString() : undefined,
  }));
}

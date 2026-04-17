// ============================================================================
// GAMIFICATION STORE - Système XP, Niveaux et Quêtes
// Version complètement refaite pour fiabilité
// ============================================================================

import i18next from 'i18next';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid/non-secure';
import { zustandStorage } from '../storage';
import { getWeek, getYear, isThisWeek } from 'date-fns';
import { storeLogger } from '../utils/logger';
import { 
    MAX_GAMIFICATION_HISTORY_ENTRIES, 
    STORAGE_KEYS,
    XP_MULTIPLIER_PER_LEVEL,
    XP_PER_WORKOUT,
} from '../constants/values';
import type { Entry, HomeWorkoutEntry, RunEntry, BeatSaberEntry, CustomSportEntry } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type QuestType = 'exercises' | 'workouts' | 'distance' | 'duration';

export interface Quest {
    id: string;
    description: string;
    target: number;
    current: number;
    rewardXp: number;
    completed: boolean;
    type: QuestType;
    weekId: string;
}

export interface GamificationLog {
    id: string;
    date: string;
    amount: number;
    reason: string;
    reasonKey?: string;
    reasonParams?: Record<string, unknown>;
    type: 'xp_gain' | 'xp_loss' | 'level_up' | 'level_down' | 'quest_complete';
    entryId?: string; // Lien vers l'entrée qui a généré cet XP
}

export interface QuestTotals {
    exercises: number;
    workouts: number;
    duration: number;
    distance: number;
}

export interface GamificationState {
    // État
    xp: number;
    level: number;
    rank: string;
    quests: Quest[];
    history: GamificationLog[];
    lastQuestWeek?: string;
    lastSeenXp?: number;
    lastSeenLevel?: number;

    // Actions principales - appelées par appStore
    processEntryAdded: (entry: Entry) => void;
    processEntryDeleted: (entry: Entry) => void;
    processEntryUpdated: (oldEntry: Entry, newEntry: Entry) => void;
    
    // Actions internes
    addXp: (amount: number, reason: string, entryId?: string, reasonKey?: string, reasonParams?: Record<string, unknown>) => void;
    removeXpForEntry: (entryId: string) => void;
    
    // Quêtes
    syncQuestsWithEntries: (entries: Entry[]) => void;
    generateWeeklyQuests: () => void;
    checkAndRefreshQuests: () => void;
    
    // Utilitaires
    updateLastSeen: () => void;
    recalculateFromEntries: (entries: Entry[]) => void;
    restoreFromBackup: (data: { xp: number; level: number; history: GamificationLog[]; quests: Quest[] }) => void;
    clearHistory: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Calcul du rang basé sur le niveau */
const getRank = (level: number): string => {
    if (level < 5) return i18next.t('gamification.ranks.novice');
    if (level < 10) return i18next.t('gamification.ranks.apprentice');
    if (level < 20) return i18next.t('gamification.ranks.intermediate');
    if (level < 30) return i18next.t('gamification.ranks.advanced');
    if (level < 50) return i18next.t('gamification.ranks.expert');
    return i18next.t('gamification.ranks.master');
};

/** XP requis pour passer au niveau suivant */
const getXpForNextLevel = (level: number): number => level * XP_MULTIPLIER_PER_LEVEL;

/** Vérifie si une entrée est un sport */
const isSportEntry = (entry: Entry): boolean => {
    return ['home', 'run', 'beatsaber', 'custom'].includes(entry.type);
};

/** Génère une description pour l'historique basée sur l'entrée */
const getReasonForEntry = (entry: Entry): { key: string; text: string } => {
    switch (entry.type) {
        case 'home':
            return {
                key: 'gamification.history.entry.home',
                text: i18next.t('gamification.history.entry.home'),
            };
        case 'run':
            return {
                key: 'gamification.history.entry.run',
                text: i18next.t('gamification.history.entry.run'),
            };
        case 'beatsaber':
            return {
                key: 'gamification.history.entry.beatsaber',
                text: i18next.t('gamification.history.entry.beatsaber'),
            };
        case 'custom':
            return {
                key: 'gamification.history.entry.custom',
                text: i18next.t('gamification.history.entry.custom'),
            };
        default:
            return {
                key: 'gamification.history.entry.generic',
                text: i18next.t('gamification.history.entry.generic'),
            };
    }
};

/** Traduire une description de quête (utile lorsque la langue change) */
const translateQuestDescription = (quest: Quest): string => {
    const key = `gamification.quests.${quest.type}.${quest.target}`;
    const translated = i18next.t(key);
    // Si la traduction n'existe pas, conserver l'ancienne description
    return translated === key ? quest.description : translated;
};

/** Calcule l'XP gagné pour une entrée donnée */
export const calculateXpForEntry = (entry: Entry): number => {
    switch (entry.type) {
        case 'home': {
            const homeEntry = entry as HomeWorkoutEntry;
            let xp = XP_PER_WORKOUT.home;
            // Bonus pour durée longue (>30 min = +10 XP)
            if (homeEntry.durationMinutes && homeEntry.durationMinutes > 30) {
                xp += 10;
            }
            // Bonus pour beaucoup de reps (>100 = +15 XP)
            if (homeEntry.totalReps && homeEntry.totalReps > 100) {
                xp += 15;
            }
            return xp;
        }
        case 'run': {
            const runEntry = entry as RunEntry;
            let xp = XP_PER_WORKOUT.run;
            // Bonus par km
            xp += Math.floor(runEntry.distanceKm) * XP_PER_WORKOUT.runPerKm;
            // Bonus pour longue durée (>45 min = +10 XP)
            if (runEntry.durationMinutes > 45) {
                xp += 10;
            }
            return xp;
        }
        case 'beatsaber': {
            const bsEntry = entry as BeatSaberEntry;
            let xp = XP_PER_WORKOUT.beatsaber;
            // Bonus par tranche de 5 minutes
            xp += Math.floor(bsEntry.durationMinutes / 5) * XP_PER_WORKOUT.beatSaberPer5Min;
            return xp;
        }
        case 'custom': {
            const customEntry = entry as CustomSportEntry;
            let xp = 25; // Base XP pour sport custom
            // Bonus durée
            if (customEntry.durationMinutes && customEntry.durationMinutes > 30) {
                xp += 10;
            }
            // Bonus distance
            if (customEntry.distanceKm && customEntry.distanceKm > 0) {
                xp += Math.floor(customEntry.distanceKm) * 3;
            }
            return xp;
        }
        default:
            return 0; // Meals et measures ne donnent pas d'XP
    }
};

/** Calcule les totaux pour les quêtes basés sur les entrées de cette semaine */
export const calculateQuestTotals = (entries: Entry[]): QuestTotals => {
    const totals: QuestTotals = { exercises: 0, workouts: 0, duration: 0, distance: 0 };
    
    // Filtrer uniquement les entrées de cette semaine
    const thisWeekEntries = entries.filter(e => {
        try {
            return isThisWeek(new Date(e.date), { weekStartsOn: 1 });
        } catch (error) {
            if (__DEV__) {
                console.warn('[GamificationStore] Failed to parse entry date for quest totals', error);
            }
            return false;
        }
    });

    thisWeekEntries.forEach(entry => {
        switch (entry.type) {
            case 'home': {
                const homeEntry = entry as HomeWorkoutEntry;
                totals.workouts += 1;
                if (homeEntry.totalReps) totals.exercises += homeEntry.totalReps;
                if (homeEntry.durationMinutes) totals.duration += homeEntry.durationMinutes;
                break;
            }
            case 'run': {
                const runEntry = entry as RunEntry;
                totals.workouts += 1;
                totals.duration += runEntry.durationMinutes || 0;
                totals.distance += runEntry.distanceKm || 0;
                break;
            }
            case 'beatsaber': {
                const bsEntry = entry as BeatSaberEntry;
                totals.workouts += 1;
                totals.duration += bsEntry.durationMinutes || 0;
                break;
            }
            case 'custom': {
                const customEntry = entry as CustomSportEntry;
                totals.workouts += 1;
                if (customEntry.durationMinutes) totals.duration += customEntry.durationMinutes;
                if (customEntry.distanceKm) totals.distance += customEntry.distanceKm;
                if (customEntry.totalReps) totals.exercises += customEntry.totalReps;
                break;
            }
        }
    });

    return totals;
};

/** Génère l'ID de semaine actuelle */
const getCurrentWeekId = (): string => {
    const now = new Date();
    const weekNum = getWeek(now, { weekStartsOn: 1 });
    const yearNum = getYear(now);
    return `${yearNum}-W${weekNum.toString().padStart(2, '0')}`;
};

// ============================================================================
// STORE
// ============================================================================

let languageListenerRegistered = false;

export const useGamificationStore = create<GamificationState>()(
    persist(
        (set, get) => {
            if (!languageListenerRegistered) {
                languageListenerRegistered = true;

                const refreshLanguage = () => {
                    const state = get();
                    if (!state) return;

                    const { quests = [], level } = state;
                    set({
                        quests: quests.map(q => ({ ...q, description: translateQuestDescription(q) })),
                        rank: getRank(level),
                    });
                };

                i18next.on('languageChanged', refreshLanguage);
                // Apply translations immediately on store init (useful when restoring persisted state)
                refreshLanguage();
            }

            return {
                // État initial
                xp: 0,
                level: 1,
                rank: getRank(1),
                quests: [],
                history: [],
                lastQuestWeek: undefined,
                lastSeenXp: 0,
                lastSeenLevel: 1,

                // ================================================================
                // ACTIONS PRINCIPALES - Appelées par appStore
                // ================================================================

                processEntryAdded: (entry: Entry) => {
                    if (!isSportEntry(entry)) return;

                    const xpGained = calculateXpForEntry(entry);
                    if (xpGained > 0) {
                        const reason = getReasonForEntry(entry);
                        get().addXp(xpGained, reason.text, entry.id, reason.key);
                    }

                    storeLogger.debug('Processed entry added', { entryId: entry.id, xpGained });
                },

                processEntryDeleted: (entry: Entry) => {
                    if (!isSportEntry(entry)) return;

                    get().removeXpForEntry(entry.id);
                    storeLogger.debug('Processed entry deleted', { entryId: entry.id });
                },

                processEntryUpdated: (oldEntry: Entry, newEntry: Entry) => {
                    if (!isSportEntry(oldEntry) && !isSportEntry(newEntry)) return;

                    // Si les deux sont des sports, recalculer la différence
                    if (isSportEntry(oldEntry) && isSportEntry(newEntry)) {
                        const oldXp = calculateXpForEntry(oldEntry);
                        const newXp = calculateXpForEntry(newEntry);

                        if (newXp !== oldXp) {
                            // Retirer l'ancien XP et ajouter le nouveau
                            get().removeXpForEntry(oldEntry.id);
                            if (newXp > 0) {
                                const reason = getReasonForEntry(newEntry);
                                get().addXp(newXp, reason.text, newEntry.id, reason.key);
                            }
                        }
                    } else if (isSportEntry(oldEntry)) {
                        // L'ancienne était un sport, la nouvelle non
                        get().removeXpForEntry(oldEntry.id);
                    } else if (isSportEntry(newEntry)) {
                        // La nouvelle est un sport, l'ancienne non
                        const xpGained = calculateXpForEntry(newEntry);
                        if (xpGained > 0) {
                            const reason = getReasonForEntry(newEntry);
                            get().addXp(xpGained, reason.text, newEntry.id, reason.key);
                        }
                    }

                    storeLogger.debug('Processed entry updated', { entryId: newEntry.id });
                },

                // ================================================================
                // GESTION XP
                // ================================================================

                addXp: (amount: number, reason: string, entryId?: string, reasonKey?: string, reasonParams?: Record<string, unknown>) => {
                    if (amount <= 0) return;

                    const { xp, level, history } = get();
                    let newXp = xp + amount;
                    let newLevel = level;

                    // Créer l'entrée d'historique pour le gain
                    const newHistoryEntries: GamificationLog[] = [{
                        id: nanoid(),
                        date: new Date().toISOString(),
                        amount,
                        reason,
                        reasonKey,
                        reasonParams,
                        type: 'xp_gain',
                        entryId,
                    }];

                    // Vérifier level up (peut être multiple)
                    while (newXp >= getXpForNextLevel(newLevel)) {
                        newXp -= getXpForNextLevel(newLevel);
                        newLevel += 1;

                        newHistoryEntries.push({
                            id: nanoid(),
                            date: new Date().toISOString(),
                            amount: 0,
                            reason: i18next.t('gamification.history.levelUp', { level: newLevel }),
                            reasonKey: 'gamification.history.levelUp',
                            reasonParams: { level: newLevel },
                            type: 'level_up',
                        });
                    }

                    const newHistory = [...newHistoryEntries, ...history]
                        .slice(0, MAX_GAMIFICATION_HISTORY_ENTRIES);

                    set({
                        xp: newXp,
                        level: newLevel,
                        rank: getRank(newLevel),
                        history: newHistory,
                    });

                    storeLogger.debug('XP added', { amount, newXp, newLevel, entryId });
                },

                removeXpForEntry: (entryId: string) => {
                    const { xp, level, history } = get();

                    // Trouver tous les gains XP liés à cette entrée
                    const relatedGains = history.filter(h => 
                        h.entryId === entryId && h.type === 'xp_gain' && h.amount > 0
                    );

                    if (relatedGains.length === 0) {
                        storeLogger.debug('No XP found for entry', { entryId });
                        return;
                    }

                    // Calculer le total à retirer
                    const totalToRemove = relatedGains.reduce((sum, h) => sum + h.amount, 0);
                    
                    let newXp = xp - totalToRemove;
                    let newLevel = level;

                    // Gérer la descente de niveau si nécessaire
                    const newHistoryEntries: GamificationLog[] = [];
                    
                    while (newXp < 0 && newLevel > 1) {
                        newLevel -= 1;
                        newXp += getXpForNextLevel(newLevel);
                        
                        newHistoryEntries.push({
                            id: nanoid(),
                            date: new Date().toISOString(),
                            amount: 0,
                            reason: i18next.t('gamification.history.levelDown', { level: newLevel }),
                            reasonKey: 'gamification.history.levelDown',
                            reasonParams: { level: newLevel },
                            type: 'level_down',
                        });
                    }

                    // S'assurer qu'on ne descend pas sous 0
                    if (newXp < 0) newXp = 0;

                    // Ajouter l'entrée de retrait
                    newHistoryEntries.unshift({
                        id: nanoid(),
                        date: new Date().toISOString(),
                        amount: -totalToRemove,
                        reason: i18next.t('gamification.history.entryDeleted'),
                        reasonKey: 'gamification.history.entryDeleted',
                        type: 'xp_loss',
                        entryId,
                    });

                    // Filtrer les anciens gains de l'historique et ajouter les nouveaux
                    const filteredHistory = history.filter(h => h.entryId !== entryId);
                    const newHistory = [...newHistoryEntries, ...filteredHistory]
                        .slice(0, MAX_GAMIFICATION_HISTORY_ENTRIES);

                    set({
                        xp: newXp,
                        level: newLevel,
                        rank: getRank(newLevel),
                        history: newHistory,
                    });

                    storeLogger.debug('XP removed for entry', { entryId, totalRemoved: totalToRemove, newXp, newLevel });
                },

                // ================================================================
                // QUÊTES
                // ================================================================

                syncQuestsWithEntries: (entries: Entry[]) => {
                    const { quests } = get();
                    const totals = calculateQuestTotals(entries);
                    
                    let hasChanges = false;
                    const questsToComplete: Quest[] = [];

                    const updatedQuests = quests.map(quest => {
                        const newTotal = totals[quest.type] || 0;
                        const newCurrent = Math.min(newTotal, quest.target);
                        const wasCompleted = quest.completed;
                        const isNowCompleted = newCurrent >= quest.target;

                        // Détecter nouvelle complétion
                        if (isNowCompleted && !wasCompleted) {
                            questsToComplete.push({ ...quest, current: newCurrent, completed: true });
                        }

                        if (newCurrent !== quest.current || isNowCompleted !== wasCompleted) {
                            hasChanges = true;
                        }

                        return {
                            ...quest,
                            current: newCurrent,
                            completed: isNowCompleted,
                        };
                    });

                    if (hasChanges) {
                        set({ quests: updatedQuests });
                    }

                    // Ajouter XP pour les quêtes nouvellement complétées
                    const { addXp } = get();
                    questsToComplete.forEach(quest => {
                        const reasonKey = 'gamification.history.questCompleted';
                        addXp(
                            quest.rewardXp,
                            i18next.t(reasonKey, { description: quest.description }),
                            undefined,
                            reasonKey,
                            { description: quest.description }
                        );
                    });

                    if (questsToComplete.length > 0) {
                        storeLogger.debug('Quests completed', { count: questsToComplete.length });
                    }
                },

                generateWeeklyQuests: () => {
                    const weekId = getCurrentWeekId();
                    
                    // Pool de quêtes
                    const questPool: Record<QuestType, Array<{ description: string; target: number; rewardXp: number }>> = {
                        exercises: [
                            { description: i18next.t('gamification.quests.exercises.50'), target: 50, rewardXp: 50 },
                            { description: i18next.t('gamification.quests.exercises.100'), target: 100, rewardXp: 100 },
                            { description: i18next.t('gamification.quests.exercises.150'), target: 150, rewardXp: 150 },
                        ],
                        workouts: [
                            { description: i18next.t('gamification.quests.workouts.2'), target: 2, rewardXp: 75 },
                            { description: i18next.t('gamification.quests.workouts.3'), target: 3, rewardXp: 100 },
                            { description: i18next.t('gamification.quests.workouts.4'), target: 4, rewardXp: 125 },
                        ],
                        duration: [
                            { description: i18next.t('gamification.quests.duration.30'), target: 30, rewardXp: 40 },
                            { description: i18next.t('gamification.quests.duration.60'), target: 60, rewardXp: 75 },
                            { description: i18next.t('gamification.quests.duration.90'), target: 90, rewardXp: 100 },
                        ],
                        distance: [
                            { description: i18next.t('gamification.quests.distance.3'), target: 3, rewardXp: 50 },
                            { description: i18next.t('gamification.quests.distance.5'), target: 5, rewardXp: 80 },
                            { description: i18next.t('gamification.quests.distance.10'), target: 10, rewardXp: 120 },
                        ],
                    };

                    // Sélection basée sur le numéro de semaine pour variété
                    const now = new Date();
                    const seed = getWeek(now, { weekStartsOn: 1 }) + getYear(now);
                    
                    const selectQuest = (type: QuestType): Quest => {
                        const pool = questPool[type];
                        const index = (seed + type.charCodeAt(0)) % pool.length;
                        const template = pool[index];
                        return {
                            id: `quest-${type}-${weekId}`,
                            type,
                            description: template.description,
                            target: template.target,
                            rewardXp: template.rewardXp,
                            current: 0,
                            completed: false,
                            weekId,
                        };
                    };

                    const newQuests: Quest[] = [
                        selectQuest('exercises'),
                        selectQuest('workouts'),
                        selectQuest('duration'),
                    ];

                    // Ajouter quête distance 50% du temps
                    if (seed % 2 === 0) {
                        newQuests.push(selectQuest('distance'));
                    }

                    set({ quests: newQuests, lastQuestWeek: weekId });
                    storeLogger.debug('Weekly quests generated', { weekId, count: newQuests.length });
                },

                checkAndRefreshQuests: () => {
                    const { lastQuestWeek, generateWeeklyQuests } = get();
                    const currentWeekId = getCurrentWeekId();

                    if (lastQuestWeek !== currentWeekId) {
                        generateWeeklyQuests();
                    }
                },

                // ================================================================
                // UTILITAIRES
                // ================================================================

                updateLastSeen: () => {
                    const { xp, level } = get();
                    set({ lastSeenXp: xp, lastSeenLevel: level });
                },

                recalculateFromEntries: (entries: Entry[]) => {
                    // Reset et recalcule tout depuis zéro
                    const sportEntries = entries.filter(isSportEntry);
                    
                    // Calculer le total XP
                    let totalXp = 0;
                    const newHistory: GamificationLog[] = [];

                    sportEntries.forEach(entry => {
                        const entryXp = calculateXpForEntry(entry);
                        if (entryXp > 0) {
                            totalXp += entryXp;
                            const entryReason = getReasonForEntry(entry);
                            newHistory.push({
                                id: nanoid(),
                                date: entry.createdAt,
                                amount: entryXp,
                                reason: entryReason.text,
                                reasonKey: entryReason.key,
                                type: 'xp_gain',
                                entryId: entry.id,
                            });
                        }
                    });

                    // Calculer le niveau
                    let newLevel = 1;
                    let remainingXp = totalXp;
                    while (remainingXp >= getXpForNextLevel(newLevel)) {
                        remainingXp -= getXpForNextLevel(newLevel);
                        newLevel += 1;
                    }

                    // Régénérer les quêtes
                    const currentWeekId = getCurrentWeekId();

                    set({
                        xp: remainingXp,
                        level: newLevel,
                        rank: getRank(newLevel),
                        history: newHistory.slice(0, MAX_GAMIFICATION_HISTORY_ENTRIES),
                        lastSeenXp: remainingXp,
                        lastSeenLevel: newLevel,
                        lastQuestWeek: undefined, // Force la régénération
                    });

                    // Régénérer les quêtes et synchro
                    get().checkAndRefreshQuests();
                    get().syncQuestsWithEntries(entries);

                    storeLogger.info('Gamification recalculated from scratch', { 
                        totalXp, 
                        level: newLevel, 
                        entriesProcessed: sportEntries.length 
                    });
                },

                restoreFromBackup: (data) => {
                    const safeData = data ?? ({} as Partial<{ xp: number; level: number; history: GamificationLog[]; quests: Quest[] }>);
                    set({
                        xp: safeData.xp ?? 0,
                        level: safeData.level ?? 1,
                        rank: getRank(safeData.level ?? 1),
                        history: safeData.history ?? [],
                        quests: safeData.quests ?? [],
                        lastSeenXp: safeData.xp ?? 0,
                        lastSeenLevel: safeData.level ?? 1,
                    });
                },

                clearHistory: () => {
                    set({ history: [] });
                },
            };
        },
        {
            name: STORAGE_KEYS.gamificationStore,
            storage: createJSONStorage(() => zustandStorage),
        }
    )
);

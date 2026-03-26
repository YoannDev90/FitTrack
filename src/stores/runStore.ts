// ============================================================================
// RUN STORE - Zustand store for run tracking state
// ============================================================================

import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

export interface LatLng {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type SegmentType = 'run' | 'walk' | 'rest';

export interface RunSegment {
  type: SegmentType;
  distanceKm?: number;
  durationMinutes?: number;
  targetPaceSecPerKm?: number;
  label: string;
  emoji: string;
}

export type PlanType = 'interval' | 'long_run';

export interface RunPlan {
  planType?: PlanType;
  targetDistanceKm?: number;
  targetDurationMinutes?: number;
  targetPaceSecPerKm?: number;
  coachingIntervalKm?: number;
  coachingIntervalMinutes?: number;
  coachingContext?: string;
  segments?: RunSegment[];
  points?: string[];
  summary: string;
}

export interface RunState {
  mode: 'simple' | 'ai' | null;
  status: 'idle' | 'running' | 'paused' | 'finished';
  plan: RunPlan | null;
  coords: LatLng[];
  distanceKm: number;
  elapsedSeconds: number;
  currentPaceSecPerKm: number;
  avgPaceSecPerKm: number;
  lastCoachingDistanceKm: number;
  lastCoachingTimestamp: number;
  isLoadingCoach: boolean;
  lastCoachMessage: string | null;
  currentAiConversation: AiMessage[];
  currentSegmentIndex: number;
  lastMotivationDistanceKm: number;
  lastMotivationTimestamp: number;
  triggeredMilestones: number[];
  initialPosition: LatLng | null;

  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  finish: () => void;
  reset: () => void;
  setMode: (mode: 'simple' | 'ai') => void;
  appendPosition: (pos: LatLng) => void;
  setCoords: (coords: LatLng[]) => void;
  setPlan: (plan: RunPlan) => void;
  setLastCoachMessage: (msg: string) => void;
  setIsLoadingCoach: (v: boolean) => void;
  appendAiMessage: (msg: AiMessage) => void;
  setElapsedSeconds: (s: number) => void;
  setDistanceKm: (d: number) => void;
  setCurrentPaceSecPerKm: (p: number) => void;
  setAvgPaceSecPerKm: (p: number) => void;
  updateCoachingCheckpoint: (distanceKm: number, timestamp: number) => void;
  setCurrentSegmentIndex: (i: number) => void;
  updateMotivationCheckpoint: (distanceKm: number, timestamp: number) => void;
  addTriggeredMilestone: (m: number) => void;
  setInitialPosition: (pos: LatLng) => void;
}

// ============================================================================
// STORE
// ============================================================================

export const useRunStore = create<RunState>((set) => ({
  mode: null,
  status: 'idle',
  plan: null,
  coords: [],
  distanceKm: 0,
  elapsedSeconds: 0,
  currentPaceSecPerKm: 0,
  avgPaceSecPerKm: 0,
  lastCoachingDistanceKm: 0,
  lastCoachingTimestamp: 0,
  isLoadingCoach: false,
  lastCoachMessage: null,
  currentAiConversation: [],
  currentSegmentIndex: 0,
  lastMotivationDistanceKm: 0,
  lastMotivationTimestamp: 0,
  triggeredMilestones: [],
  initialPosition: null,

  start: () => set({ status: 'running' }),
  pause: () => set({ status: 'paused' }),
  resume: () => set({ status: 'running' }),
  finish: () => set({ status: 'finished' }),

  reset: () => set({
    mode: null,
    status: 'idle',
    plan: null,
    coords: [],
    distanceKm: 0,
    elapsedSeconds: 0,
    currentPaceSecPerKm: 0,
    avgPaceSecPerKm: 0,
    lastCoachingDistanceKm: 0,
    lastCoachingTimestamp: 0,
    isLoadingCoach: false,
    lastCoachMessage: null,
    currentAiConversation: [],
    currentSegmentIndex: 0,
    lastMotivationDistanceKm: 0,
    lastMotivationTimestamp: 0,
    triggeredMilestones: [],
    initialPosition: null,
  }),

  setMode: (mode) => set({ mode }),
  appendPosition: (pos) => set((state) => ({ coords: [...state.coords, pos] })),
  setCoords: (coords) => set({ coords }),
  setPlan: (plan) => set({ plan }),
  setLastCoachMessage: (msg) => set({ lastCoachMessage: msg }),
  setIsLoadingCoach: (v) => set({ isLoadingCoach: v }),
  appendAiMessage: (msg) => set((state) => ({
    currentAiConversation: [...state.currentAiConversation, msg],
  })),
  setElapsedSeconds: (s) => set({ elapsedSeconds: s }),
  setDistanceKm: (d) => set({ distanceKm: d }),
  setCurrentPaceSecPerKm: (p) => set({ currentPaceSecPerKm: p }),
  setAvgPaceSecPerKm: (p) => set({ avgPaceSecPerKm: p }),
  updateCoachingCheckpoint: (distanceKm, timestamp) => set({
    lastCoachingDistanceKm: distanceKm,
    lastCoachingTimestamp: timestamp,
  }),
  setCurrentSegmentIndex: (i) => set({ currentSegmentIndex: i }),
  updateMotivationCheckpoint: (distanceKm, timestamp) => set({
    lastMotivationDistanceKm: distanceKm,
    lastMotivationTimestamp: timestamp,
  }),
  addTriggeredMilestone: (m) => set((state) => ({
    triggeredMilestones: [...state.triggeredMilestones, m],
  })),
  setInitialPosition: (pos) => set({ initialPosition: pos }),
}));

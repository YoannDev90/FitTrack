// repCounter/types.ts

export type ExerciseType = 'pushups' | 'situps' | 'squats' | 'jumping_jacks' | 'plank' | 'elliptical' | 'run' | 'run_ai';
export type DetectionMode = 'sensor' | 'camera' | 'manual';
export type CameraFacing = 'front' | 'side';
export type TutorialStep = 'select' | 'position' | 'ready' | 'counting' | 'done';
export type EllipticalCalibrationPhase =
    | 'none' | 'intro' | 'get_ready' | 'still' | 'still_done'
    | 'pedaling' | 'complete' | 'start_moving' | 'moving'
    | 'start_stopping' | 'stopping' | 'done';

export interface ExerciseConfig {
    id: ExerciseType;
    name: string;
    icon: string;
    color: string;
    instructionKey?: string;
    cameraInstructionKey?: string;
    manualInstructionKey?: string;
    instruction?: string;
    cameraInstruction?: string;
    threshold: number;
    axis: 'x' | 'y' | 'z';
    cooldown: number;
    supportsCameraMode: boolean;
    supportsManualMode?: boolean;
    requiresCalibration?: boolean;
    preferredCameraView: CameraFacing;
    isTimeBased?: boolean;
    keepGoingIntervalSeconds?: number;
    isNavigational?: boolean; // Exercise that navigates to a separate screen (e.g. run)
    experimental?: boolean; // Shows a beta badge on the exercise tile
}

export interface RepCounterState {
    step: TutorialStep;
    selectedExercise: ExerciseConfig | null;
    isTracking: boolean;
    repCount: number;
    elapsedTime: number;
    detectionMode: DetectionMode;
    currentPhase: 'up' | 'down' | 'neutral';
    motivationalMessage: { text: string; emoji: string } | null;
    aiFeedback: string | null;
    isPlankActive: boolean;
    plankSeconds: number;
    showNewRecord: boolean;
    personalBest: number;
    isEllipticalActive: boolean;
    ellipticalSeconds: number;
    ellipticalCalibrationPhase: EllipticalCalibrationPhase;
    showExitModal: boolean;
    workoutSaved: boolean;
}

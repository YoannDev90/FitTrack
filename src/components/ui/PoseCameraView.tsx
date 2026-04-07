// ============================================================================
// POSE CAMERA VIEW - Camera with MediaPipe Pose Detection
// Uses react-native-mediapipe-posedetection with react-native-vision-camera
// ============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Platform,
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
} from 'react-native-vision-camera';
import {
    usePoseDetection,
    RunningMode,
    Delegate,
    KnownPoseLandmarks,
    type PoseDetectionResultBundle,
} from 'react-native-mediapipe-posedetection';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Line } from 'react-native-svg';

import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores';
import { 
    ExerciseType, 
    PoseLandmarks,
    countRepsFromPose,
    resetExerciseState,
    isPoseValidForExercise,
    detectPlankPosition,
    detectEllipticalMovement,
    type RepEventMetadata,
    type PlankDebugInfo,
    type EllipticalState,
} from '../../utils/poseDetection';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Skeleton connections for visualization (indices from KnownPoseLandmarks)
const SKELETON_CONNECTIONS: [number, number][] = [
    // Torso
    [KnownPoseLandmarks.leftShoulder, KnownPoseLandmarks.rightShoulder],
    [KnownPoseLandmarks.leftShoulder, KnownPoseLandmarks.leftHip],
    [KnownPoseLandmarks.rightShoulder, KnownPoseLandmarks.rightHip],
    [KnownPoseLandmarks.leftHip, KnownPoseLandmarks.rightHip],
    // Left arm
    [KnownPoseLandmarks.leftShoulder, KnownPoseLandmarks.leftElbow],
    [KnownPoseLandmarks.leftElbow, KnownPoseLandmarks.leftWrist],
    // Right arm
    [KnownPoseLandmarks.rightShoulder, KnownPoseLandmarks.rightElbow],
    [KnownPoseLandmarks.rightElbow, KnownPoseLandmarks.rightWrist],
    // Left leg
    [KnownPoseLandmarks.leftHip, KnownPoseLandmarks.leftKnee],
    [KnownPoseLandmarks.leftKnee, KnownPoseLandmarks.leftAnkle],
    // Right leg
    [KnownPoseLandmarks.rightHip, KnownPoseLandmarks.rightKnee],
    [KnownPoseLandmarks.rightKnee, KnownPoseLandmarks.rightAnkle],
];

const isLandmarkPoint = (value: unknown): value is PoseLandmarks[number] => {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<PoseLandmarks[number]>;
    return (
        typeof candidate.x === 'number' &&
        typeof candidate.y === 'number' &&
        typeof candidate.z === 'number'
    );
};

const normalizeLandmarksCandidate = (candidate: unknown): PoseLandmarks | null => {
    if (!Array.isArray(candidate) || candidate.length === 0) return null;

    if (isLandmarkPoint(candidate[0])) {
        return candidate as PoseLandmarks;
    }

    const firstPose = candidate[0];
    if (Array.isArray(firstPose) && firstPose.length > 0 && isLandmarkPoint(firstPose[0])) {
        return firstPose as PoseLandmarks;
    }

    return null;
};

const extractPoseLandmarks = (result: PoseDetectionResultBundle | Record<string, unknown>): PoseLandmarks | null => {
    const payload = result as Record<string, any>;
    const candidates = [
        payload?.results?.[0]?.landmarks,
        payload?.results?.[0]?.poseLandmarks,
        payload?.landmarks,
        payload?.poseLandmarks,
    ];

    for (const candidate of candidates) {
        const landmarks = normalizeLandmarksCandidate(candidate);
        if (landmarks && landmarks.length >= 33) {
            return landmarks;
        }
    }

    return null;
};

interface PoseCameraViewProps {
    facing?: 'front' | 'back';
    showDebugOverlay?: boolean;
    exerciseType?: ExerciseType;
    onRepDetected?: (newCount: number, feedback?: string, repEvent?: RepEventMetadata) => void;
    onPoseDetected?: (landmarks: PoseLandmarks | null) => void;
    onPlankStateChange?: (isInPlank: boolean, confidence: number, debugInfo?: PlankDebugInfo) => void;
    onEllipticalStateChange?: (state: EllipticalState) => void;
    onCameraReady?: () => void;
    onModelReady?: () => void;
    currentCount?: number;
    style?: any;
    isActive?: boolean;
    debugPlank?: boolean;
}

export const PoseCameraView: React.FC<PoseCameraViewProps> = ({
    facing = 'front', // Use front camera by default
    showDebugOverlay = false,
    exerciseType = 'squats',
    onRepDetected,
    onPoseDetected,
    onPlankStateChange,
    onEllipticalStateChange,
    onCameraReady,
    onModelReady,
    currentCount = 0,
    style,
    isActive = true,
    debugPlank = false,
}) => {
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice(facing);
    const [isReady, setIsReady] = useState(false);
    const [currentPose, setCurrentPose] = useState<PoseLandmarks | null>(null);
    const [cameraLayout, setCameraLayout] = useState({ width: 1, height: 1 });
    const [poseStatus, setPoseStatus] = useState<'detecting' | 'pose' | 'no-pose'>('detecting');
    const { t } = useTranslation();
    const useLitePoseModel = useAppStore((state) => state.settings.useLitePoseModel ?? false);
    const modelName = Platform.OS === 'android' && useLitePoseModel
        ? 'pose_landmarker_lite.task'
        : 'pose_landmarker_full.task';
    
    const countRef = useRef(currentCount);
    const exerciseTypeRef = useRef(exerciseType);
    const modelReadyRef = useRef(false);

    const markModelReady = useCallback(() => {
        if (modelReadyRef.current) return;
        modelReadyRef.current = true;
        onModelReady?.();
    }, [onModelReady]);

    // Update refs when props change
    useEffect(() => {
        countRef.current = currentCount;
    }, [currentCount]);

    // Track previous exercise type to only reset on actual change
    const prevExerciseTypeRef = useRef<ExerciseType | undefined>(undefined);
    
    useEffect(() => {
        // Only reset state when actually changing exercise type (not on initial mount for same type)
        if (prevExerciseTypeRef.current !== undefined && prevExerciseTypeRef.current !== exerciseType) {
            resetExerciseState(exerciseType);
        }
        exerciseTypeRef.current = exerciseType;
        prevExerciseTypeRef.current = exerciseType;
    }, [exerciseType]);

    // Track previous plank state to detect changes
    const prevPlankStateRef = useRef<boolean>(false);

    // Pose detection using MediaPipe
    const poseDetection = usePoseDetection(
        {
            onResults: useCallback((result: PoseDetectionResultBundle) => {
                try {
                    markModelReady();

                    // Handle both payload variants from the native module:
                    // - result.results[0].landmarks[0]
                    // - result.landmarks[0]
                    const landmarks = extractPoseLandmarks(result);
                    
                    const hasValidLandmarks = !!landmarks && landmarks.length >= 33;
                    const currentExerciseType = exerciseTypeRef.current ?? 'squats';
                    const poseIsValid = hasValidLandmarks && isPoseValidForExercise(landmarks, currentExerciseType);
                    
                    if (poseIsValid && landmarks) {
                        setCurrentPose(landmarks);
                        setPoseStatus('pose');
                        onPoseDetected?.(landmarks);

                        // Handle plank exercise separately
                        if (exerciseTypeRef.current === 'plank') {
                            const plankState = detectPlankPosition(landmarks, debugPlank);
                            // Notify on state change or always if debug mode
                            if (plankState.isInPlankPosition !== prevPlankStateRef.current || debugPlank) {
                                if (plankState.isInPlankPosition !== prevPlankStateRef.current) {
                                    prevPlankStateRef.current = plankState.isInPlankPosition;
                                    if (plankState.isInPlankPosition) {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    }
                                }
                                onPlankStateChange?.(plankState.isInPlankPosition, plankState.confidence, plankState.debugInfo);
                            }
                        } else if (exerciseTypeRef.current === 'elliptical') {
                            // Handle elliptical exercise - detect head movement
                            const ellipticalState = detectEllipticalMovement(landmarks);
                            onEllipticalStateChange?.(ellipticalState);
                        } else if (exerciseTypeRef.current) {
                            // Count reps for other exercises
                            const repResult = countRepsFromPose(
                                landmarks, 
                                exerciseTypeRef.current, 
                                countRef.current
                            );
                            
                            if (repResult.count > countRef.current) {
                                countRef.current = repResult.count;
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onRepDetected?.(repResult.count, repResult.feedback, repResult.repEvent);
                            }
                        }
                    } else {
                        setCurrentPose(null);
                        setPoseStatus('no-pose');
                        onPoseDetected?.(null);
                        
                        // If no pose detected during plank, consider it as "not in plank"
                        if (exerciseTypeRef.current === 'plank' && prevPlankStateRef.current) {
                            prevPlankStateRef.current = false;
                            onPlankStateChange?.(false, 0);
                        }
                    }
                } catch (error) {
                    console.error('[PoseCamera] Error processing pose results:', error);
                    setPoseStatus('no-pose');
                }
            }, [onPoseDetected, onRepDetected, onPlankStateChange, onEllipticalStateChange, markModelReady, debugPlank]),
            onError: useCallback((error: any) => {
                console.error('[PoseCamera] Detection error:', error.message);
                setPoseStatus('no-pose');
            }, []),
        },
        RunningMode.LIVE_STREAM,
        modelName,
        {
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            delegate: Delegate.GPU,
            mirrorMode: facing === 'front' ? 'mirror-front-only' : 'no-mirror',
        }
    );

    // Request permission on mount
    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    // Notify pose detection when device changes
    useEffect(() => {
        if (device) {
            poseDetection.cameraDeviceChangeHandler(device);
        }
    }, [device, poseDetection.cameraDeviceChangeHandler]);

    // Handle camera ready
    const handleCameraReady = useCallback(() => {
        setIsReady(true);
        onCameraReady?.();
        markModelReady();
    }, [onCameraReady, markModelReady]);

    // Handle layout change
    const handleLayout = useCallback((event: any) => {
        const { width, height } = event.nativeEvent.layout;
        setCameraLayout({ width, height });
        poseDetection.cameraViewLayoutChangeHandler(event);
    }, [poseDetection.cameraViewLayoutChangeHandler]);

    // Render skeleton overlay
    const renderSkeletonOverlay = () => {
        if (!currentPose || !showDebugOverlay) return null;

        const { width, height } = cameraLayout;

        // Transform landmark coordinates based on camera orientation
        // MediaPipe returns normalized coords [0-1], we need to map to view coords
        // For front camera in portrait mode, we may need to swap/mirror coordinates
        const transformPoint = (landmark: { x: number; y: number }) => {
            // The landmarks from MediaPipe are already in the correct orientation
            // Just mirror X for front camera (selfie mode)
            const x = facing === 'front' ? width * (1 - landmark.x) : width * landmark.x;
            const y = height * landmark.y;
            return { x, y };
        };

        return (
            <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${width} ${height}`}>
                {/* Draw skeleton lines */}
                {SKELETON_CONNECTIONS.map(([startIdx, endIdx], index) => {
                    const start = currentPose[startIdx];
                    const end = currentPose[endIdx];
                    
                    if (!start || !end) return null;
                    if ((start.visibility ?? 1) < 0.5 || (end.visibility ?? 1) < 0.5) return null;

                    const startPoint = transformPoint(start);
                    const endPoint = transformPoint(end);

                    return (
                        <Line
                            key={`line-${index}`}
                            x1={startPoint.x}
                            y1={startPoint.y}
                            x2={endPoint.x}
                            y2={endPoint.y}
                            stroke={Colors.cta}
                            strokeWidth={3}
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* Draw landmark points */}
                {currentPose.map((landmark, index) => {
                    if (!landmark || (landmark.visibility ?? 1) < 0.5) return null;

                    const point = transformPoint(landmark);

                    return (
                        <Circle
                            key={`point-${index}`}
                            cx={point.x}
                            cy={point.y}
                            r={5}
                            fill={Colors.cta}
                            stroke="#fff"
                            strokeWidth={2}
                        />
                    );
                })}
            </Svg>
        );
    };

    // No permission
    if (!hasPermission) {
        return (
            <View style={[styles.container, style]}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>
                        {t('repCounter.cameraPermissionRequired')}
                    </Text>
                    <TouchableOpacity 
                        style={styles.permissionButton}
                        onPress={requestPermission}
                    >
                        <Text style={styles.permissionButtonText}>
                            {t('repCounter.allowCamera')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // No device
    if (!device) {
        return (
            <View style={[styles.container, style]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.cta} />
                    <Text style={styles.loadingText}>{t('repCounter.cameraSearching')}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, style]} onLayout={handleLayout}>
            {isActive && (
                <Camera
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={isActive}
                    frameProcessor={poseDetection.frameProcessor}
                    onStarted={handleCameraReady}
                    onError={(error) => console.error('[PoseCamera] Camera error:', error)}
                    onOutputOrientationChanged={poseDetection.cameraOrientationChangedHandler}
                    pixelFormat="rgb"
                    photo={true}
                />
            )}

            {/* Skeleton overlay */}
            {renderSkeletonOverlay()}

            {/* Status indicator */}
            {showDebugOverlay && (
                <View style={styles.statusContainer}>
                    <View style={[
                        styles.statusDot,
                        { backgroundColor: poseStatus === 'pose' ? Colors.success : 
                                          poseStatus === 'no-pose' ? Colors.error : Colors.warning }
                    ]} />
                    <Text style={styles.statusText}>
                        {poseStatus === 'pose' ? t('repCounter.pose.detected') : 
                         poseStatus === 'no-pose' ? t('repCounter.pose.noPose') : t('repCounter.pose.detecting')}
                    </Text>
                </View>
            )}

            {/* Loading overlay */}
            {!isReady && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.cta} />
                    <Text style={styles.loadingText}>{t('common.loading')}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    permissionText: {
        fontSize: FontSize.lg,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    permissionButton: {
        backgroundColor: Colors.cta,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    permissionButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: FontSize.md,
        color: Colors.muted,
        marginTop: Spacing.md,
    },
    statusContainer: {
        position: 'absolute',
        top: Spacing.md,
        left: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: Spacing.sm,
    },
    statusText: {
        fontSize: FontSize.sm,
        color: Colors.text,
    },
});

export default PoseCameraView;

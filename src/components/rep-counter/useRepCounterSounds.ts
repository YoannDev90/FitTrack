// ============================================================================
// USE REP COUNTER SOUNDS - Hook for managing rep counter audio
// ============================================================================

import { useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';

/**
 * Hook that manages all sound effects for the rep counter
 * Provides memoized play functions for each sound type
 */
export function useRepCounterSounds() {
    const repSound = useAudioPlayer(require('../../../assets/rep.mp3'));
    const keepGoingSound = useAudioPlayer(require('../../../assets/keepgoing.mp3'));
    const secondsSound = useAudioPlayer(require('../../../assets/seconds.mp3'));
    const newRecordSound = useAudioPlayer(require('../../../assets/new-record.mp3'));
    const finishedSound = useAudioPlayer(require('../../../assets/finished.mp3'));

    const logSoundError = useCallback((label: string, error: unknown) => {
        if (__DEV__) {
            console.warn(`[RepCounterSounds] ${label} failed`, error);
        }
    }, []);

    const playRepSound = useCallback(() => {
        try {
            repSound.seekTo(0);
            repSound.play();
        } catch (error) {
            logSoundError('rep', error);
        }
    }, [logSoundError, repSound]);

    const playKeepGoingSound = useCallback(() => {
        try {
            keepGoingSound.seekTo(0);
            keepGoingSound.play();
        } catch (error) {
            logSoundError('keep-going', error);
        }
    }, [keepGoingSound, logSoundError]);

    const playSecondsSound = useCallback(() => {
        try {
            secondsSound.seekTo(0);
            secondsSound.play();
        } catch (error) {
            logSoundError('seconds', error);
        }
    }, [logSoundError, secondsSound]);

    const playNewRecordSound = useCallback(() => {
        try {
            newRecordSound.seekTo(0);
            newRecordSound.play();
        } catch (error) {
            logSoundError('new-record', error);
        }
    }, [logSoundError, newRecordSound]);

    const playFinishedSound = useCallback(() => {
        try {
            finishedSound.seekTo(0);
            finishedSound.play();
        } catch (error) {
            logSoundError('finished', error);
        }
    }, [finishedSound, logSoundError]);

    return {
        playRepSound,
        playKeepGoingSound,
        playSecondsSound,
        playNewRecordSound,
        playFinishedSound,
    };
}

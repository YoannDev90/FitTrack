import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

let activePlayer: AudioPlayer | null = null;
let audioModeConfigured = false;

const ensureAudioMode = async (): Promise<void> => {
    if (audioModeConfigured) return;

    await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'duckOthers',
        allowsRecording: false,
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
    });

    audioModeConfigured = true;
};

const releaseActivePlayer = (): void => {
    if (!activePlayer) return;

    const playerToRelease = activePlayer;
    activePlayer = null;

    try {
        playerToRelease.remove();
    } catch {
        // Ignore release errors to keep playback resilient.
    }
};

export const playSessionEndSound = async (): Promise<void> => {
    try {
        await ensureAudioMode();
        releaseActivePlayer();

        const player = createAudioPlayer(require('../../../assets/finished.mp3'), {
            updateInterval: 150,
            downloadFirst: true,
            keepAudioSessionActive: true,
        });

        activePlayer = player;
        player.loop = false;
        let playbackStarted = false;

        const tryStartPlayback = (isLoaded: boolean): void => {
            if (playbackStarted || !isLoaded || activePlayer?.id !== player.id) {
                return;
            }

            playbackStarted = true;
            player.currentTime = 0;
            player.play();
        };

        const subscription = player.addListener('playbackStatusUpdate', (status) => {
            tryStartPlayback(status.isLoaded);

            if (!status.didJustFinish) {
                return;
            }

            subscription.remove();

            if (activePlayer?.id === player.id) {
                activePlayer = null;
            }

            try {
                player.remove();
            } catch {
                // Ignore cleanup errors after playback completion.
            }
        });

        tryStartPlayback(player.isLoaded);
    } catch {
        releaseActivePlayer();
    }
};

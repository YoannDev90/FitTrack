import React from 'react';
import { router } from 'expo-router';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { type SocialChallengeProgress } from '../../../services/supabase/social';
import { AddFriendSheet } from './AddFriendSheet';
import { ChallengeDetailsSheet } from './ChallengeDetailsSheet';
import { CreateChallengeSheet } from './CreateChallengeSheet';
import { ShareWorkoutSheet } from './ShareWorkoutSheet';
import type { SearchResult, ShareableWorkoutItem } from './types';

interface SocialHubSheetsProps {
    challengeSheetRef: React.RefObject<TrueSheet | null>;
    shareWorkoutSheetRef: React.RefObject<TrueSheet | null>;
    challengeDetailsSheetRef: React.RefObject<TrueSheet | null>;
    addFriendSheetRef: React.RefObject<TrueSheet | null>;
    challengeTitle: string;
    onChangeChallengeTitle: (value: string) => void;
    challengeGoalType: any;
    onChangeChallengeGoalType: (value: any) => void;
    challengeGoalTarget: string;
    onChangeChallengeGoalTarget: (value: string) => void;
    challengeDurationDays: string;
    onChangeChallengeDurationDays: (value: string) => void;
    friendOptionsForChallenge: any[];
    selectedFriendIdsForChallenge: string[];
    onToggleFriendForChallenge: (friendId: string) => void;
    isCreatingChallenge: boolean;
    onCreateChallenge: () => void | Promise<void>;
    createChallengeLabels: any;
    shareableWorkouts: ShareableWorkoutItem[];
    isSharingWorkoutId: string | null;
    onShareWorkout: (workout: ShareableWorkoutItem) => void | Promise<void>;
    shareWorkoutLabels: any;
    searchQuery: string;
    onChangeSearchQuery: (value: string) => void;
    isSearching: boolean;
    searchError: string | null;
    searchResults: SearchResult[];
    onSendRequest: (userId: string) => void | Promise<void>;
    addFriendLabels: any;
    selectedChallengeForDetails: SocialChallengeProgress | null;
    selectedChallengeContributions: any[];
    profileId?: string;
    onDeleteChallenge: (challenge: SocialChallengeProgress) => void;
    onOpenChallengesTab: () => void;
    challengeDetailsLabels: any;
}

export function SocialHubSheets({
    challengeSheetRef,
    shareWorkoutSheetRef,
    challengeDetailsSheetRef,
    addFriendSheetRef,
    challengeTitle,
    onChangeChallengeTitle,
    challengeGoalType,
    onChangeChallengeGoalType,
    challengeGoalTarget,
    onChangeChallengeGoalTarget,
    challengeDurationDays,
    onChangeChallengeDurationDays,
    friendOptionsForChallenge,
    selectedFriendIdsForChallenge,
    onToggleFriendForChallenge,
    isCreatingChallenge,
    onCreateChallenge,
    createChallengeLabels,
    shareableWorkouts,
    isSharingWorkoutId,
    onShareWorkout,
    shareWorkoutLabels,
    searchQuery,
    onChangeSearchQuery,
    isSearching,
    searchError,
    searchResults,
    onSendRequest,
    addFriendLabels,
    selectedChallengeForDetails,
    selectedChallengeContributions,
    profileId,
    onDeleteChallenge,
    onOpenChallengesTab,
    challengeDetailsLabels,
}: SocialHubSheetsProps) {
    return (
        <>
            <CreateChallengeSheet
                sheetRef={challengeSheetRef}
                title={challengeTitle}
                onChangeTitle={onChangeChallengeTitle}
                goalType={challengeGoalType}
                onChangeGoalType={onChangeChallengeGoalType}
                goalTarget={challengeGoalTarget}
                onChangeGoalTarget={onChangeChallengeGoalTarget}
                durationDays={challengeDurationDays}
                onChangeDurationDays={onChangeChallengeDurationDays}
                friendOptions={friendOptionsForChallenge}
                selectedFriendIds={selectedFriendIdsForChallenge}
                onToggleFriendId={onToggleFriendForChallenge}
                isCreating={isCreatingChallenge}
                onCreate={onCreateChallenge}
                labels={createChallengeLabels}
            />

            <ShareWorkoutSheet
                sheetRef={shareWorkoutSheetRef}
                workouts={shareableWorkouts}
                isSharingWorkoutId={isSharingWorkoutId}
                onShareWorkout={onShareWorkout}
                labels={shareWorkoutLabels}
            />

            <AddFriendSheet
                sheetRef={addFriendSheetRef}
                searchQuery={searchQuery}
                onChangeSearchQuery={onChangeSearchQuery}
                isSearching={isSearching}
                searchError={searchError}
                searchResults={searchResults}
                onSendRequest={onSendRequest}
                labels={addFriendLabels}
            />

            <ChallengeDetailsSheet
                sheetRef={challengeDetailsSheetRef}
                challenge={selectedChallengeForDetails}
                contributions={selectedChallengeContributions}
                profileId={profileId}
                onPressAddSession={() => {
                    challengeDetailsSheetRef.current?.dismiss();
                    router.push('/workout' as never);
                }}
                onPressOpenChallenges={() => {
                    challengeDetailsSheetRef.current?.dismiss();
                    onOpenChallengesTab();
                }}
                onPressDeleteOrLeave={(challenge) => {
                    challengeDetailsSheetRef.current?.dismiss();
                    onDeleteChallenge(challenge);
                }}
                labels={challengeDetailsLabels}
            />
        </>
    );
}

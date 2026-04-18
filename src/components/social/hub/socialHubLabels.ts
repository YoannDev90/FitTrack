type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function getTopTabLabels(t: TranslateFn) {
    return {
        home: t('socialHub.topTabs.home'),
        challenges: t('socialHub.topTabs.challenges'),
        friends: t('socialHub.topTabs.friends'),
        leaderboard: t('socialHub.topTabs.leaderboard'),
    };
}

export function getHomeTabLabels(t: TranslateFn) {
    return {
        challenge: {
            sectionTitle: t('socialHub.challenge.sectionTitle'),
            swipeHint: t('socialHub.challenge.swipeHint'),
            noParticipants: t('socialHub.challenge.noParticipants'),
            details: t('socialHub.challenge.details'),
            addSession: t('socialHub.challenge.addSession'),
            finishedLabel: t('socialHub.challenge.finishedLabel'),
            winnerLabel: (name: string) => t('socialHub.challenge.winnerLabel', { name }),
            drawLabel: (count: number) => t('socialHub.challenge.drawLabel', { count }),
            finishReasonLabel: (reason: string) => t(`socialHub.challenge.finishReasons.${reason}`),
            daysRemaining: (count: number) => t('socialHub.challenge.daysRemaining', { count }),
            goalLabel: (goalType: string) => t(`socialHub.challenge.goalTypes.${goalType}`),
        },
        feed: {
            sectionTitle: t('socialHub.feed.sectionTitle'),
            emptyTitle: t('socialHub.feed.emptyTitle'),
            emptySubtitle: t('socialHub.feed.emptySubtitle'),
            like: t('socialHub.feed.likeAction'),
            liked: t('socialHub.feed.likedAction'),
            sending: t('socialHub.feed.likeSending'),
            likedBy: (names: string, extra: number) => t('socialHub.feed.likedBy', {
                names,
                extra: extra > 0 ? ` +${extra}` : '',
            }),
            justNow: t('socialHub.feed.time.justNow'),
            minutesAgo: (count: number) => t('socialHub.feed.time.minutesAgo', { count }),
            hoursAgo: (count: number) => t('socialHub.feed.time.hoursAgo', { count }),
            daysAgo: (count: number) => t('socialHub.feed.time.daysAgo', { count }),
        },
        cards: {
            shareTitle: t('socialHub.cards.shareTitle'),
            shareSubtitle: t('socialHub.cards.shareSubtitle'),
            challengeTitle: t('socialHub.cards.challengeTitle'),
            challengeSubtitle: t('socialHub.cards.challengeSubtitle'),
        },
        loading: t('common.loading'),
    };
}

export function getChallengesTabLabels(t: TranslateFn) {
    return {
        pageTitle: t('socialHub.pages.challenges.title'),
        pageSubtitle: t('socialHub.pages.challenges.subtitle'),
        createChallenge: t('socialHub.pages.challenges.create'),
        noChallengesTitle: t('socialHub.pages.challenges.emptyTitle'),
        noChallengesSubtitle: t('socialHub.pages.challenges.emptySubtitle'),
        participantsLabel: t('socialHub.pages.challenges.participantsLabel'),
        progressLabel: t('socialHub.pages.challenges.progressLabel'),
        detailsLabel: t('socialHub.challenge.details'),
        addSession: t('socialHub.challenge.addSession'),
        finishedLabel: t('socialHub.challenge.finishedLabel'),
        winnerLabel: (name: string) => t('socialHub.challenge.winnerLabel', { name }),
        drawLabel: (count: number) => t('socialHub.challenge.drawLabel', { count }),
        finishReasonLabel: (reason: string) => t(`socialHub.challenge.finishReasons.${reason}`),
        rankLabel: (rank: number) => t('socialHub.challenge.rankLabel', { rank }),
        pastChallengesTitle: (count: number) => t('socialHub.pages.challenges.pastTitle', { count }),
        showPastChallenges: t('socialHub.pages.challenges.showPast'),
        hidePastChallenges: t('socialHub.pages.challenges.hidePast'),
        deleteChallenge: t('socialHub.challenge.deleteAction'),
        leaveChallenge: t('socialHub.challenge.leaveAction'),
        deletingChallenge: t('socialHub.challenge.deletingAction'),
        daysRemaining: (count: number) => t('socialHub.challenge.daysRemaining', { count }),
        goalLabel: (goalType: string) => t(`socialHub.challenge.goalTypes.${goalType}`),
    };
}

export function getFriendsTabLabels(t: TranslateFn, isHydratingFriendsTab: boolean) {
    return {
        pageTitle: t('socialHub.pages.friends.title'),
        pageSubtitle: isHydratingFriendsTab ? t('common.loading') : t('socialHub.pages.friends.subtitle'),
        addFriend: t('socialHub.friends.addFriend'),
        invite: t('socialHub.friends.invite'),
        searchPlaceholder: t('socialHub.friends.searchPlaceholder'),
        pendingTitle: (count: number) => t('social.pendingRequestsTitle', { count }),
        myFriendsTitle: (count: number) => t('social.myFriends', { count }),
        accept: t('common.confirm'),
        decline: t('common.cancel'),
        remove: t('common.delete'),
        noFriendsTitle: t('socialHub.friends.emptyTitle'),
        noFriendsSubtitle: t('socialHub.friends.emptySubtitle'),
        noRequests: t('socialHub.pages.friends.noRequests'),
        badgeFriend: t('socialHub.friends.badgeFriend'),
        badgePending: t('socialHub.friends.badgePending'),
        addAction: t('socialHub.friends.addAction'),
        meBadge: t('socialHub.friends.meBadge'),
        workoutsWeek: (count: number) => t('socialHub.friends.workoutsWeek', { count }),
        xpSuffix: t('socialHub.friends.xpSuffix'),
    };
}

export function getLeaderboardTabLabels(t: TranslateFn, isHydratingLeaderboardTab: boolean) {
    return {
        pageTitle: t('socialHub.pages.leaderboard.title'),
        pageSubtitle: isHydratingLeaderboardTab ? t('common.loading') : t('socialHub.pages.leaderboard.subtitle'),
        friendsTab: t('social.friends'),
        globalTab: t('social.global'),
        loadingGlobal: t('socialHub.pages.leaderboard.loadingGlobal'),
        emptyFriends: t('social.emptyLeaderboardFriends'),
        emptyGlobal: t('social.emptyLeaderboardGlobal'),
        workoutsWeek: (count: number) => t('socialHub.friends.workoutsWeek', { count }),
        meBadge: t('socialHub.friends.meBadge'),
        xpSuffix: t('socialHub.friends.xpSuffix'),
    };
}

export function getCreateChallengeLabels(t: TranslateFn) {
    return {
        title: t('socialHub.challenge.sheet.title'),
        subtitle: t('socialHub.challenge.sheet.subtitle'),
        placeholderTitle: t('socialHub.challenge.sheet.placeholderTitle'),
        placeholderTarget: t('socialHub.challenge.sheet.placeholderTarget'),
        placeholderDuration: t('socialHub.challenge.sheet.placeholderDuration'),
        cancel: t('common.cancel'),
        create: t('socialHub.challenge.sheet.create'),
        creating: t('socialHub.challenge.sheet.creating'),
        workouts: t('socialHub.challenge.goalTypes.workouts'),
        distance: t('socialHub.challenge.goalTypes.distance'),
        duration: t('socialHub.challenge.goalTypes.duration'),
        xp: t('socialHub.challenge.goalTypes.xp'),
        friendsTitle: t('socialHub.challenge.sheet.friendsTitle'),
        noFriends: t('socialHub.challenge.sheet.noFriends'),
    };
}

export function getShareWorkoutLabels(t: TranslateFn) {
    return {
        title: t('socialHub.shareWorkout.sheetTitle'),
        subtitle: t('socialHub.shareWorkout.sheetSubtitle'),
        emptyTitle: t('socialHub.shareWorkout.emptyTitle'),
        emptySubtitle: t('socialHub.shareWorkout.emptySubtitle'),
        shareAction: t('socialHub.shareWorkout.shareAction'),
        sharingAction: t('socialHub.shareWorkout.sharingAction'),
    };
}

export function getAddFriendLabels(t: TranslateFn) {
    return {
        title: t('socialHub.friends.sheetTitle'),
        subtitle: t('socialHub.friends.sheetSubtitle'),
        searchPlaceholder: t('socialHub.friends.searchPlaceholder'),
        badgeFriend: t('socialHub.friends.badgeFriend'),
        badgePending: t('socialHub.friends.badgePending'),
        addAction: t('socialHub.friends.addAction'),
        emptyTitle: t('socialHub.friends.searchEmptyTitle'),
        emptySubtitle: t('socialHub.friends.searchEmptySubtitle'),
        minCharsHint: t('socialHub.friends.searchHint'),
    };
}

export function getChallengeDetailsLabels(t: TranslateFn) {
    return {
        title: t('socialHub.challenge.detailsSheet.title'),
        activeSubtitle: t('socialHub.challenge.detailsSheet.activeSubtitle'),
        finishedSubtitle: t('socialHub.challenge.detailsSheet.finishedSubtitle'),
        close: t('common.close'),
        openChallenges: t('socialHub.challenge.detailsSheet.openChallenges'),
        addSession: t('socialHub.challenge.addSession'),
        participantsTitle: t('socialHub.challenge.detailsSheet.participantsTitle'),
        statsTitle: t('socialHub.challenge.detailsSheet.statsTitle'),
        targetLabel: t('socialHub.challenge.detailsSheet.targetLabel'),
        progressLabel: t('socialHub.challenge.detailsSheet.progressLabel'),
        participantsLabel: t('socialHub.challenge.detailsSheet.participantsLabel'),
        rankTitle: t('socialHub.challenge.detailsSheet.rankTitle'),
        contributionsTitle: t('socialHub.challenge.detailsSheet.contributionsTitle'),
        contributionsEmpty: t('socialHub.challenge.detailsSheet.contributionsEmpty'),
        finishedLabel: t('socialHub.challenge.finishedLabel'),
        winnerLabel: (name: string) => t('socialHub.challenge.winnerLabel', { name }),
        drawLabel: (count: number) => t('socialHub.challenge.drawLabel', { count }),
        finishReasonLabel: (reason: string) => t(`socialHub.challenge.finishReasons.${reason}`),
        deleteChallenge: t('socialHub.challenge.deleteAction'),
        leaveChallenge: t('socialHub.challenge.leaveAction'),
    };
}

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { GlassCard } from '../../ui';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { FeedViewItem } from './types';

interface FeedSectionProps {
    items: FeedViewItem[];
    isSendingLikeForId: string | null;
    onSendLike: (item: FeedViewItem) => void;
    onRefresh: () => void;
    error?: string | null;
    labels: {
        sectionTitle: string;
        refresh: string;
        emptyTitle: string;
        emptySubtitle: string;
        like: string;
        sending: string;
        justNow: string;
        minutesAgo: (count: number) => string;
        hoursAgo: (count: number) => string;
        daysAgo: (count: number) => string;
    };
}

function relativeTimeLabel(dateIso: string, labels: FeedSectionProps['labels']): string {
    const created = new Date(dateIso).getTime();
    const now = Date.now();
    const delta = Math.max(0, Math.floor((now - created) / 1000));

    if (delta < 60) return labels.justNow;
    if (delta < 3600) return labels.minutesAgo(Math.floor(delta / 60));
    if (delta < 86400) return labels.hoursAgo(Math.floor(delta / 3600));
    return labels.daysAgo(Math.floor(delta / 86400));
}

export function FeedSection({
    items,
    isSendingLikeForId,
    onSendLike,
    onRefresh,
    error,
    labels,
}: FeedSectionProps) {
    return (
        <View>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{labels.sectionTitle}</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Text style={styles.sectionLink}>{labels.refresh}</Text>
                </TouchableOpacity>
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <GlassCard style={styles.feedCard}>
                {items.length === 0 ? (
                    <View style={styles.emptyFeed}>
                        <Text style={styles.emptyTitle}>{labels.emptyTitle}</Text>
                        <Text style={styles.emptySubtitle}>{labels.emptySubtitle}</Text>
                    </View>
                ) : (
                    items.map((item, index) => (
                        <View key={item.id} style={[styles.feedRow, index < items.length - 1 && styles.feedRowBorder]}>
                            <View style={styles.feedAvatar}>
                                <Text style={styles.feedAvatarText}>{item.actorName.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={styles.feedContent}>
                                <Text style={styles.feedTitle}>{item.title}</Text>
                                <Text style={styles.feedDetail}>{item.detail}</Text>
                                <View style={styles.feedFooter}>
                                    <Text style={styles.feedTime}>{relativeTimeLabel(item.createdAt, labels)}</Text>
                                    {item.isWorkoutShare && (
                                        <TouchableOpacity
                                            style={styles.feedLikeBtn}
                                            onPress={() => onSendLike(item)}
                                            disabled={isSendingLikeForId === item.id}
                                        >
                                            <Heart size={14} color={Colors.cta} />
                                            <Text style={styles.feedLikeText}>
                                                {isSendingLikeForId === item.id ? labels.sending : labels.like}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </GlassCard>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    sectionLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    sectionLink: {
        color: Colors.violet,
        fontSize: FontSize.sm,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSize.xs,
        marginBottom: Spacing.xs,
    },
    feedCard: {
        padding: Spacing.md,
    },
    feedRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
    },
    feedRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.overlayWhite08,
    },
    feedAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.overlayTeal20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    feedAvatarText: {
        color: Colors.teal,
        fontWeight: FontWeight.bold,
    },
    feedContent: {
        flex: 1,
    },
    feedTitle: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    feedDetail: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    feedFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.xs,
    },
    feedTime: {
        color: Colors.muted2,
        fontSize: 11,
    },
    feedLikeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    feedLikeText: {
        color: Colors.cta,
        fontSize: 11,
        fontWeight: FontWeight.semibold,
    },
    emptyFeed: {
        paddingVertical: Spacing.md,
        gap: Spacing.xs,
    },
    emptyTitle: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    emptySubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
    },
});

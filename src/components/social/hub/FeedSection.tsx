import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Heart, X } from 'lucide-react-native';
import { GlassCard } from '../../ui';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { FeedViewItem } from './types';

interface FeedSectionProps {
    items: FeedViewItem[];
    isSendingLikeForId: string | null;
    isDeletingItemId: string | null;
    onSendLike: (item: FeedViewItem) => void;
    onDeleteItem: (item: FeedViewItem) => void;
    error?: string | null;
    labels: {
        sectionTitle: string;
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
    isDeletingItemId,
    onSendLike,
    onDeleteItem,
    error,
    labels,
}: FeedSectionProps) {
    return (
        <View>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{labels.sectionTitle}</Text>
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
                                <View style={styles.feedTitleRow}>
                                    <Text style={styles.feedTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.feedTime}>{relativeTimeLabel(item.createdAt, labels)}</Text>
                                </View>

                                <Text style={styles.feedDetail} numberOfLines={2}>{item.detail}</Text>

                                <View style={styles.feedActionsRow}>
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

                                    {item.canDelete && (
                                        <TouchableOpacity
                                            onPress={() => onDeleteItem(item)}
                                            disabled={isDeletingItemId === item.id}
                                            style={styles.feedDeleteBtn}
                                        >
                                            <X size={12} color={Colors.error} />
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
        color: Colors.text,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSize.xs,
        marginBottom: Spacing.xs,
    },
    feedCard: {
        padding: 0,
        borderRadius: BorderRadius.xxl,
    },
    feedRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.sm,
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
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
        backgroundColor: Colors.overlayWhite08,
        alignItems: 'center',
        justifyContent: 'center',
    },
    feedAvatarText: {
        color: Colors.text,
        fontWeight: FontWeight.bold,
    },
    feedContent: {
        flex: 1,
    },
    feedTitle: {
        flex: 1,
        color: Colors.text,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    feedTitleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: Spacing.xs,
    },
    feedDeleteBtn: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.overlayError10,
        borderWidth: 1,
        borderColor: Colors.overlayError20,
    },
    feedDetail: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        marginTop: 2,
        lineHeight: 15,
    },
    feedActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: Spacing.xs,
        marginTop: Spacing.xs,
    },
    feedTime: {
        color: Colors.muted2,
        fontSize: 10,
    },
    feedLikeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    feedLikeText: {
        color: Colors.cta,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
    },
    emptyFeed: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.sm,
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

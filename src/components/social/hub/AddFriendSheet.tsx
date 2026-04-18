import React from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, UserPlus, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { SearchResult } from './types';

interface AddFriendSheetProps {
    sheetRef: React.RefObject<TrueSheet | null>;
    searchQuery: string;
    onChangeSearchQuery: (value: string) => void;
    isSearching: boolean;
    searchError: string | null;
    searchResults: SearchResult[];
    onSendRequest: (userId: string) => void;
    labels: {
        title: string;
        subtitle: string;
        searchPlaceholder: string;
        badgeFriend: string;
        badgePending: string;
        addAction: string;
        emptyTitle: string;
        emptySubtitle: string;
        minCharsHint: string;
    };
}

export function AddFriendSheet({
    sheetRef,
    searchQuery,
    onChangeSearchQuery,
    isSearching,
    searchError,
    searchResults,
    onSendRequest,
    labels,
}: AddFriendSheetProps) {
    const insets = useSafeAreaInsets();
    const isSearchReady = searchQuery.trim().length >= 2;

    return (
        <TrueSheet
            ref={sheetRef}
            detents={[0.78]}
            cornerRadius={32}
            backgroundColor={Colors.bg}
            grabber={false}
            scrollable={true}
        >
            <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}> 
                <View style={styles.grabberWrap}>
                    <View style={styles.grabber} />
                </View>

                <View style={styles.headerRow}>
                    <LinearGradient
                        colors={[Colors.overlayTeal15, Colors.overlayViolet12]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerIconWrap}
                    >
                        <Users size={18} color={Colors.info} />
                    </LinearGradient>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.title}>{labels.title}</Text>
                        <Text style={styles.subtitle}>{labels.subtitle}</Text>
                    </View>
                </View>

                <LinearGradient
                    colors={['transparent', Colors.overlayInfo35, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerDivider}
                />

                <View style={styles.searchInputWrap}>
                    <Search size={16} color={Colors.muted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={labels.searchPlaceholder}
                        placeholderTextColor={Colors.muted2}
                        value={searchQuery}
                        onChangeText={onChangeSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                {!isSearchReady ? (
                    <View style={styles.hintWrap}>
                        <Text style={styles.hintText}>{labels.minCharsHint}</Text>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {isSearching && (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color={Colors.cta} />
                                <Text style={styles.loadingText}>{labels.searchPlaceholder}</Text>
                            </View>
                        )}

                        {searchError && <Text style={styles.errorText}>{searchError}</Text>}

                        {!isSearching && !searchError && searchResults.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyTitle}>{labels.emptyTitle}</Text>
                                <Text style={styles.emptySubtitle}>{labels.emptySubtitle}</Text>
                            </View>
                        ) : null}

                        {searchResults.map((user, index) => (
                            <View
                                key={user.id}
                                style={index === 0 ? [styles.searchResultRow, styles.searchResultRowFeatured] : styles.searchResultRow}
                            >
                                <View style={styles.searchResultInfo}>
                                    <Text style={styles.searchResultName}>{user.display_name || user.username}</Text>
                                    <Text style={styles.searchResultSub}>@{user.username}</Text>
                                </View>

                                {user.friendship_status === 'accepted' ? (
                                    <Text style={styles.searchResultBadge}>{labels.badgeFriend}</Text>
                                ) : user.friendship_status === 'pending' ? (
                                    <Text style={styles.searchResultBadge}>{labels.badgePending}</Text>
                                ) : (
                                    <TouchableOpacity style={styles.addResultBtn} onPress={() => onSendRequest(user.id)}>
                                        <UserPlus size={12} color={Colors.cta} />
                                        <Text style={styles.searchResultAction}>{labels.addAction}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}

                        <View style={styles.bottomSpacer} />
                    </ScrollView>
                )}
            </View>
        </TrueSheet>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        gap: Spacing.sm,
    },
    grabberWrap: {
        alignItems: 'center',
        paddingVertical: Spacing.xs,
    },
    grabber: {
        width: 42,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.overlayWhite20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    headerIconWrap: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextWrap: {
        flex: 1,
    },
    title: {
        color: Colors.text,
        fontSize: FontSize.xl,
        fontWeight: FontWeight.extrabold,
        letterSpacing: -0.4,
    },
    subtitle: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
        lineHeight: 16,
    },
    headerDivider: {
        height: 1,
        marginVertical: Spacing.xs,
    },
    searchInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.stroke,
        backgroundColor: Colors.overlayBlack30,
        paddingHorizontal: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: Colors.text,
        fontSize: FontSize.sm,
        paddingVertical: 10,
    },
    hintWrap: {
        paddingVertical: Spacing.sm,
    },
    hintText: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        gap: Spacing.xs,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    loadingText: {
        color: Colors.muted,
        fontSize: FontSize.xs,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSize.xs,
    },
    emptyState: {
        paddingVertical: Spacing.lg,
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
    searchResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayWhite08,
        backgroundColor: Colors.overlayBlack25,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 9,
        gap: Spacing.sm,
    },
    searchResultRowFeatured: {
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
    },
    searchResultInfo: {
        flex: 1,
        gap: 1,
    },
    searchResultName: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    searchResultSub: {
        color: Colors.muted2,
        fontSize: 10,
    },
    searchResultAction: {
        color: Colors.cta,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    searchResultBadge: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        backgroundColor: Colors.overlayWhite08,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    addResultBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
    },
    bottomSpacer: {
        height: Spacing.xl,
    },
});

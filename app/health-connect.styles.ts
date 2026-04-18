import { StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../src/constants';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
    },
    safeArea: {
        flex: 1,
    },
    headerContainer: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        paddingTop: Spacing.sm,
        zIndex: 10,
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    scrollContent: {
        padding: Spacing.md,
    },
    statusText: {
        marginTop: Spacing.md,
        color: Colors.muted,
        fontSize: FontSize.md,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.red100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    errorTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    errorText: {
        fontSize: FontSize.md,
        color: Colors.muted,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },

    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.cta + '40',
        marginBottom: Spacing.lg,
    },
    summaryText: {
        color: Colors.text,
        fontSize: FontSize.md,
    },

    cardContainer: {
        backgroundColor: Colors.cardSolid,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: Colors.stroke,
    },
    cardSkipped: {
        backgroundColor: Colors.gray800,
        borderColor: Colors.gray700,
        opacity: 0.8,
    },
    accentBar: {
        width: 6,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    textSkipped: {
        color: Colors.muted,
        textDecorationLine: 'line-through',
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardMetaText: {
        fontSize: 13,
        color: Colors.muted,
        fontWeight: '500',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: Colors.muted,
    },
    durationBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.overlay,
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 10,
        minWidth: 50,
    },
    durationText: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        lineHeight: 20,
    },
    minText: {
        fontSize: 10,
        color: Colors.muted,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    originalName: {
        fontSize: 12,
        color: Colors.muted,
        marginBottom: 12,
        fontStyle: 'italic',
    },

    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: Colors.stroke,
    },
    typePillInactive: {
        backgroundColor: Colors.transparent,
        borderColor: Colors.stroke,
    },
    typePillLabel: {
        fontSize: 13,
        fontWeight: '600',
    },

    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 10,
    },
    emptyText: {
        color: Colors.muted,
        marginTop: 5,
    },

    bottomBarContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.overlayModal95,
        borderWidth: 1,
        borderColor: Colors.stroke,
    },
    bottomBarLabel: {
        fontSize: 12,
        color: Colors.muted,
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    bottomBarValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },

    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.md,
        marginTop: Spacing.lg,
    },

    weightIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${Colors.emerald}20`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectionIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.stroke,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectionIndicatorActive: {
        backgroundColor: Colors.emerald,
        borderColor: Colors.emerald,
    },

    sportPickerContainer: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl + 20,
    },
    sportPickerTitle: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    sportPickerList: {
        maxHeight: 400,
    },
    sportPickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.xs,
    },
    sportPickerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    sportPickerItemText: {
        fontSize: FontSize.md,
        fontWeight: '500',
        color: Colors.text,
    },
});

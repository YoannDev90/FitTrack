import { StyleSheet } from 'react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../constants';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
    },
    topGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 230,
    },
    bottomGlow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 220,
    },
    topbarWrap: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xs,
    },
    topbar: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    titleBlock: {
        flex: 1,
        gap: 2,
    },
    eyebrowPill: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        marginBottom: 4,
    },
    eyebrowText: {
        color: Colors.cta,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.9,
    },
    topbarActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: 2,
    },
    screenTitle: {
        fontSize: 32,
        fontWeight: FontWeight.extrabold,
        color: Colors.text,
        letterSpacing: -0.7,
    },
    screenSubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    notifButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
        backgroundColor: Colors.overlayBlack25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageContent: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: 2,
    },
    centeredState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
    },
    stateTitle: {
        color: Colors.text,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        textAlign: 'center',
    },
    stateSubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
        textAlign: 'center',
    },
    primaryButton: {
        marginTop: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.cta,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    primaryButtonText: {
        color: Colors.white,
        fontWeight: FontWeight.semibold,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSize.xs,
    },
});

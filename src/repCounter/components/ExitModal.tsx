// repCounter/components/ExitModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RC, SP, RAD, FONT, W } from '@/repCounter/constants';

interface ExitModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export function ExitModal({ visible, onCancel, onConfirm }: ExitModalProps) {
    const { t } = useTranslation();
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={s.overlay}>
                <View style={s.sheet}>
                    {/* Accent bar */}
                    <View style={s.accentBar} />

                    <Text style={s.title}>{t('repCounter.exitConfirm.title')}</Text>
                    <Text style={s.subtitle}>{t('repCounter.exitConfirm.message')}</Text>

                    <View style={s.btns}>
                        <TouchableOpacity onPress={onCancel} style={s.cancelBtn} activeOpacity={0.8}>
                            <Text style={s.cancelText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onConfirm} style={s.confirmBtn} activeOpacity={0.85}>
                            <Text style={s.confirmText}>{t('common.exit')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center', alignItems: 'center', padding: SP.xl,
    },
    sheet: {
        backgroundColor: RC.surfaceUp, borderRadius: RAD.xxxl,
        padding: SP.xxl, width: '100%', maxWidth: 340,
        borderWidth: 1, borderColor: RC.borderUp,
        overflow: 'hidden',
    },
    accentBar: {
        position: 'absolute', top: 0, left: 40, right: 40, height: 2,
        backgroundColor: RC.error, borderRadius: RAD.full,
    },
    title: {
        fontSize: FONT.xl, fontWeight: W.black, color: RC.text,
        textAlign: 'center', marginBottom: SP.sm, marginTop: SP.xs,
    },
    subtitle: {
        fontSize: FONT.md, color: RC.textMuted,
        textAlign: 'center', marginBottom: SP.xxl, lineHeight: 22,
    },
    btns:      { flexDirection: 'row', gap: SP.md },
    cancelBtn: {
        flex: 1, paddingVertical: SP.lg, borderRadius: RAD.lg,
        backgroundColor: RC.overlay, alignItems: 'center',
        borderWidth: 1, borderColor: RC.border,
    },
    cancelText: { fontSize: FONT.md, fontWeight: W.semi, color: RC.text },
    confirmBtn: {
        flex: 1, paddingVertical: SP.lg, borderRadius: RAD.lg,
        backgroundColor: 'rgba(239,68,68,0.15)', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)',
    },
    confirmText: { fontSize: FONT.md, fontWeight: W.bold, color: RC.error },
});

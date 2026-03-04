// ============================================================================
// DATE TIME SELECTOR — Sélecteur date + heure avec style premium
// ============================================================================

import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Platform } from 'react-native';
import { FC, FS, FR, FT, FW } from './formStyles';

interface DateTimeSelectorProps {
    enabled: boolean;
    onToggle: () => void;
    customDate: string;       // 'YYYY-MM-DD'
    customTime: string;       // 'HH:mm'
    showDatePicker: boolean;
    showTimePicker: boolean;
    onShowDatePicker: () => void;
    onShowTimePicker: () => void;
    onDateChange: (event: any, date?: Date) => void;
    onTimeChange: (event: any, date?: Date) => void;
}

export function DateTimeSelector({
    enabled,
    onToggle,
    customDate,
    customTime,
    showDatePicker,
    showTimePicker,
    onShowDatePicker,
    onShowTimePicker,
    onDateChange,
    onTimeChange,
}: DateTimeSelectorProps) {

    const customDateAsDate = useMemo(() => {
        const parts = customDate.split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        return new Date();
    }, [customDate]);

    const customTimeAsDate = useMemo(() => {
        const d = new Date();
        const parts = customTime.split(':');
        if (parts.length === 2) d.setHours(parseInt(parts[0]), parseInt(parts[1]));
        return d;
    }, [customTime]);

    const formattedDate = useMemo(() => {
        return format(customDateAsDate, 'dd MMMM yyyy', { locale: fr });
    }, [customDateAsDate]);

    return (
        <View style={st.wrapper}>
            {/* Toggle */}
            <TouchableOpacity style={st.toggle} onPress={onToggle} activeOpacity={0.75}>
                <View style={[st.toggleIcon, enabled && st.toggleIconActive]}>
                    <Calendar size={15} color={enabled ? FC.coral : FC.textMuted} strokeWidth={2.5} />
                </View>
                <Text style={[st.toggleLabel, enabled && st.toggleLabelActive]}>
                    {enabled ? `${formattedDate} · ${customTime}` : "Aujourd'hui"}
                </Text>
                <View style={[st.togglePill, enabled && st.togglePillActive]}>
                    <Text style={[st.togglePillText, enabled && st.togglePillTextActive]}>
                        {enabled ? 'Modifier' : 'Changer la date'}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Pickers */}
            {enabled && (
                <View style={st.pickersRow}>
                    <TouchableOpacity style={st.pickerBtn} onPress={onShowDatePicker} activeOpacity={0.75}>
                        <Calendar size={15} color={FC.coral} strokeWidth={2} />
                        <Text style={st.pickerBtnText}>{formattedDate}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[st.pickerBtn, st.timeBtn]} onPress={onShowTimePicker} activeOpacity={0.75}>
                        <Clock size={15} color={FC.coral} strokeWidth={2} />
                        <Text style={st.pickerBtnText}>{customTime}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {showDatePicker && (
                <DateTimePicker
                    value={customDateAsDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(2020, 0, 1)}
                />
            )}

            {showTimePicker && (
                <DateTimePicker
                    value={customTimeAsDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onTimeChange}
                    is24Hour
                />
            )}
        </View>
    );
}

const st = StyleSheet.create({
    wrapper: {
        marginBottom: FS.xl,
    },
    toggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.sm,
        backgroundColor: FC.overlay,
        borderWidth: 1,
        borderColor: FC.border,
        borderRadius: FR.xl,
        paddingVertical: 12,
        paddingHorizontal: FS.lg,
    },
    toggleIcon: {
        width: 28, height: 28,
        borderRadius: FR.md,
        backgroundColor: FC.surfaceUp,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleIconActive: {
        backgroundColor: FC.coralSoft,
    },
    toggleLabel: {
        flex: 1,
        fontSize: FT.sm,
        fontWeight: FW.med,
        color: FC.textMuted,
    },
    toggleLabelActive: {
        color: FC.text,
        fontWeight: FW.semi,
    },
    togglePill: {
        paddingHorizontal: FS.md,
        paddingVertical: FS.xs,
        borderRadius: FR.pill,
        backgroundColor: FC.surfaceUp,
        borderWidth: 1,
        borderColor: FC.border,
    },
    togglePillActive: {
        backgroundColor: FC.coralSoft,
        borderColor: FC.coralGlow,
    },
    togglePillText: {
        fontSize: FT.xs,
        fontWeight: FW.bold,
        color: FC.textMuted,
        letterSpacing: 0.3,
    },
    togglePillTextActive: {
        color: FC.coral,
    },
    pickersRow: {
        flexDirection: 'row',
        gap: FS.md,
        marginTop: FS.sm,
    },
    pickerBtn: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.sm,
        backgroundColor: FC.surfaceUp,
        borderRadius: FR.lg,
        borderWidth: 1,
        borderColor: FC.coralGlow,
        paddingVertical: 12,
        paddingHorizontal: FS.lg,
    },
    timeBtn: {
        flex: 1,
        justifyContent: 'center',
    },
    pickerBtnText: {
        fontSize: FT.sm,
        fontWeight: FW.semi,
        color: FC.text,
    },
});

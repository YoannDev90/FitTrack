// ============================================================================
// SPORT SUB-FORMS — Run · BeatSaber · Meal · Measure · CustomSport
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { InputField, TextArea } from '../ui';
import { FC, FS, FR, FT, FW, sharedStyles } from './formStyles';
import { useTranslation } from 'react-i18next';
import type { SportConfig } from '../../types';

// ─── Run Form ─────────────────────────────────────────────────────────────────

interface RunFormProps {
    km: string; minutes: string;
    bpmAvg: string; bpmMax: string; cardiacLoad: string;
    onChange: (field: string, v: string) => void;
}

export function RunForm({ km, minutes, bpmAvg, bpmMax, cardiacLoad, onChange }: RunFormProps) {
    const { t } = useTranslation();
    return (
        <View>
            <FieldGroup>
                <InputField label="Distance (km)" placeholder="5.0"
                    value={km} onChangeText={v => onChange('km', v)}
                    keyboardType="decimal-pad" containerStyle={sharedStyles.halfInput} />
                <InputField label={t('addEntry.duration')} placeholder="28"
                    value={minutes} onChangeText={v => onChange('minutes', v)}
                    keyboardType="number-pad" containerStyle={sharedStyles.halfInput} />
            </FieldGroup>

            <SectionDivider label="Cardiaque (optionnel)" />

            <FieldGroup>
                <InputField label="BPM moyen" placeholder="150"
                    value={bpmAvg} onChangeText={v => onChange('bpmAvg', v)}
                    keyboardType="number-pad" containerStyle={sharedStyles.halfInput} />
                <InputField label="BPM max" placeholder="178"
                    value={bpmMax} onChangeText={v => onChange('bpmMax', v)}
                    keyboardType="number-pad" containerStyle={sharedStyles.halfInput} />
            </FieldGroup>

            <InputField label="Charge cardiaque" placeholder="120"
                value={cardiacLoad} onChangeText={v => onChange('cardiacLoad', v)}
                keyboardType="number-pad" />
        </View>
    );
}

// ─── BeatSaber Form ───────────────────────────────────────────────────────────

interface BeatSaberFormProps {
    duration: string; cardiacLoad: string;
    bpmAvg: string; bpmMax: string;
    onChange: (field: string, v: string) => void;
}

export function BeatSaberForm({ duration, cardiacLoad, bpmAvg, bpmMax, onChange }: BeatSaberFormProps) {
    const { t } = useTranslation();
    return (
        <View>
            <FieldGroup>
                <InputField label={t('addEntry.duration')} placeholder="10"
                    value={duration} onChangeText={v => onChange('duration', v)}
                    keyboardType="decimal-pad" containerStyle={sharedStyles.halfInput} />
                <InputField label="Charge cardiaque" placeholder="120"
                    value={cardiacLoad} onChangeText={v => onChange('cardiacLoad', v)}
                    keyboardType="number-pad" containerStyle={sharedStyles.halfInput} />
            </FieldGroup>

            <SectionDivider label="BPM (optionnel)" />

            <FieldGroup>
                <InputField label="BPM moyen" placeholder="140"
                    value={bpmAvg} onChangeText={v => onChange('bpmAvg', v)}
                    keyboardType="number-pad" containerStyle={sharedStyles.halfInput} />
                <InputField label="BPM max" placeholder="165"
                    value={bpmMax} onChangeText={v => onChange('bpmMax', v)}
                    keyboardType="number-pad" containerStyle={sharedStyles.halfInput} />
            </FieldGroup>
        </View>
    );
}

// ─── Meal Form ────────────────────────────────────────────────────────────────

type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface MealFormProps {
    mealTime: MealTime;
    description: string;
    onChangeMealTime: (t: MealTime) => void;
    onChangeDescription: (v: string) => void;
}

const MEAL_OPTIONS: { id: MealTime; emoji: string; labelKey: string; defaultLabel: string }[] = [
    { id: 'breakfast', emoji: '☀️', labelKey: 'addEntry.mealTimes.breakfast', defaultLabel: 'Petit-déj' },
    { id: 'lunch',     emoji: '🌤️', labelKey: 'addEntry.mealTimes.lunch',     defaultLabel: 'Déjeuner' },
    { id: 'dinner',    emoji: '🌙', labelKey: 'addEntry.mealTimes.dinner',    defaultLabel: 'Dîner' },
    { id: 'snack',     emoji: '🍎', labelKey: 'addEntry.mealTimes.snack',     defaultLabel: 'Collation' },
];

export function MealForm({ mealTime, description, onChangeMealTime, onChangeDescription }: MealFormProps) {
    const { t } = useTranslation();
    return (
        <View>
            <Text style={mst.label}>Moment du repas</Text>
            <View style={mst.mealGrid}>
                {MEAL_OPTIONS.map(opt => {
                    const active = mealTime === opt.id;
                    return (
                        <TouchableOpacity
                            key={opt.id}
                            style={[mst.mealBtn, active && mst.mealBtnActive]}
                            onPress={() => onChangeMealTime(opt.id)}
                            activeOpacity={0.75}
                        >
                            <Text style={mst.mealEmoji}>{opt.emoji}</Text>
                            <Text style={[mst.mealBtnText, active && mst.mealBtnTextActive]}>
                                {t(opt.labelKey, opt.defaultLabel)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <TextArea
                label="Ce que tu as mangé"
                placeholder="Ex : pâtes, poulet grillé, yaourt nature…"
                value={description}
                onChangeText={onChangeDescription}
                rows={4}
            />
        </View>
    );
}

const mst = StyleSheet.create({
    label: {
        fontSize: FT.xs,
        fontWeight: FW.black,
        color: FC.textMuted,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
        marginBottom: FS.md,
    },
    mealGrid: {
        flexDirection: 'row',
        gap: FS.sm,
        marginBottom: FS.xl,
    },
    mealBtn: {
        flex: 1,
        alignItems: 'center',
        gap: FS.xs,
        paddingVertical: FS.md,
        borderRadius: FR.xl,
        backgroundColor: FC.overlay,
        borderWidth: 1,
        borderColor: FC.border,
    },
    mealBtnActive: {
        backgroundColor: FC.coralSoft,
        borderColor: FC.coralGlow,
    },
    mealEmoji: {
        fontSize: 20,
    },
    mealBtnText: {
        fontSize: FT.xs,
        fontWeight: FW.bold,
        color: FC.textMuted,
        textAlign: 'center',
    },
    mealBtnTextActive: {
        color: FC.coral,
    },
});

// ─── Measure Form ─────────────────────────────────────────────────────────────

interface MeasureFormProps {
    weight: string; bodyFatPercent: string;
    waist: string; arm: string; hips: string;
    onChange: (field: string, v: string) => void;
}

export function MeasureForm({ weight, bodyFatPercent, waist, arm, hips, onChange }: MeasureFormProps) {
    return (
        <View>
            <SectionDivider label="Corps" />
            <FieldGroup>
                <InputField label="Poids (kg)" placeholder="72.4"
                    value={weight} onChangeText={v => onChange('weight', v)}
                    keyboardType="decimal-pad" containerStyle={sharedStyles.halfInput} />
                <InputField label="% Masse grasse" placeholder="18.5"
                    value={bodyFatPercent} onChangeText={v => onChange('bodyFatPercent', v)}
                    keyboardType="decimal-pad" containerStyle={sharedStyles.halfInput} />
            </FieldGroup>

            <SectionDivider label="Mensurations (cm)" />
            <FieldGroup>
                <InputField label="Tour de taille" placeholder="82"
                    value={waist} onChangeText={v => onChange('waist', v)}
                    keyboardType="decimal-pad" containerStyle={sharedStyles.halfInput} />
                <InputField label="Bras" placeholder="31"
                    value={arm} onChangeText={v => onChange('arm', v)}
                    keyboardType="decimal-pad" containerStyle={sharedStyles.halfInput} />
            </FieldGroup>
            <InputField label="Hanches (cm)" placeholder="94"
                value={hips} onChangeText={v => onChange('hips', v)}
                keyboardType="decimal-pad" />
        </View>
    );
}

// ─── Custom Sport Form ────────────────────────────────────────────────────────

interface CustomSportFormProps {
    sport: SportConfig;
    name: string; duration: string; distance: string;
    bpmAvg: string; bpmMax: string; cardiacLoad: string;
    calories: string; exercises: string; totalReps: string;
    onChange: (field: string, v: string) => void;
}

export function CustomSportForm({
    sport, name, duration, distance,
    bpmAvg, bpmMax, cardiacLoad, calories, exercises, totalReps,
    onChange,
}: CustomSportFormProps) {
    const { t } = useTranslation();
    const tf = sport.trackingFields;

    return (
        <View>
            {/* Sport header */}
            <View style={[cst.sportHeader, { borderColor: sport.color + '30' }]}>
                <View style={[cst.sportIconWrap, { backgroundColor: sport.color + '18' }]}>
                    <Text style={cst.sportEmoji}>{sport.emoji}</Text>
                </View>
                <Text style={[cst.sportName, { color: sport.color }]}>{sport.name}</Text>
            </View>

            <InputField
                label={t('addEntry.sessionName')}
                placeholder={sport.name}
                value={name}
                onChangeText={v => onChange('name', v)}
            />

            {(tf.includes('duration') || tf.includes('distance')) && (
                <FieldGroup>
                    {tf.includes('duration') && (
                        <InputField label={t('settings.sports.fields.duration')} placeholder="30"
                            value={duration} onChangeText={v => onChange('duration', v)}
                            keyboardType="decimal-pad"
                            containerStyle={tf.includes('distance') ? sharedStyles.halfInput : undefined} />
                    )}
                    {tf.includes('distance') && (
                        <InputField label={t('settings.sports.fields.distance')} placeholder="5.0"
                            value={distance} onChangeText={v => onChange('distance', v)}
                            keyboardType="decimal-pad"
                            containerStyle={tf.includes('duration') ? sharedStyles.halfInput : undefined} />
                    )}
                </FieldGroup>
            )}

            {(tf.includes('bpmAvg') || tf.includes('bpmMax')) && (
                <FieldGroup>
                    {tf.includes('bpmAvg') && (
                        <InputField label={t('settings.sports.fields.bpmAvg')} placeholder="140"
                            value={bpmAvg} onChangeText={v => onChange('bpmAvg', v)}
                            keyboardType="number-pad"
                            containerStyle={tf.includes('bpmMax') ? sharedStyles.halfInput : undefined} />
                    )}
                    {tf.includes('bpmMax') && (
                        <InputField label={t('settings.sports.fields.bpmMax')} placeholder="180"
                            value={bpmMax} onChangeText={v => onChange('bpmMax', v)}
                            keyboardType="number-pad"
                            containerStyle={tf.includes('bpmAvg') ? sharedStyles.halfInput : undefined} />
                    )}
                </FieldGroup>
            )}

            {(tf.includes('cardiacLoad') || tf.includes('calories')) && (
                <FieldGroup>
                    {tf.includes('cardiacLoad') && (
                        <InputField label={t('settings.sports.fields.cardiacLoad')} placeholder="120"
                            value={cardiacLoad} onChangeText={v => onChange('cardiacLoad', v)}
                            keyboardType="number-pad"
                            containerStyle={tf.includes('calories') ? sharedStyles.halfInput : undefined} />
                    )}
                    {tf.includes('calories') && (
                        <InputField label={t('settings.sports.fields.calories')} placeholder="350"
                            value={calories} onChangeText={v => onChange('calories', v)}
                            keyboardType="number-pad"
                            containerStyle={tf.includes('cardiacLoad') ? sharedStyles.halfInput : undefined} />
                    )}
                </FieldGroup>
            )}

            {tf.includes('totalReps') && (
                <InputField label={t('settings.sports.fields.totalReps')} placeholder="100"
                    value={totalReps} onChangeText={v => onChange('totalReps', v)}
                    keyboardType="number-pad" />
            )}

            {tf.includes('exercises') && (
                <TextArea
                    label={t('settings.sports.fields.exercises')}
                    placeholder={t('addEntry.exercisesPlaceholder', 'Liste tes exercices…')}
                    value={exercises}
                    onChangeText={v => onChange('exercises', v)}
                    rows={4}
                />
            )}
        </View>
    );
}

const cst = StyleSheet.create({
    sportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.md,
        paddingVertical: FS.md,
        paddingHorizontal: FS.lg,
        backgroundColor: FC.overlay,
        borderRadius: FR.xl,
        borderWidth: 1,
        marginBottom: FS.xl,
    },
    sportIconWrap: {
        width: 48, height: 48,
        borderRadius: FR.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sportEmoji: { fontSize: 26 },
    sportName: {
        fontSize: FT.xl,
        fontWeight: FW.black,
        letterSpacing: -0.4,
    },
});

// ─── Helpers partagés ─────────────────────────────────────────────────────────

/** Rangée 2 colonnes */
export function FieldGroup({ children }: { children: React.ReactNode }) {
    return <View style={{ flexDirection: 'row', gap: FS.md, marginBottom: 0 }}>{children}</View>;
}

/** Séparateur avec label */
export function SectionDivider({ label }: { label: string }) {
    return (
        <View style={sdst.row}>
            <View style={sdst.line} />
            <Text style={sdst.label}>{label}</Text>
            <View style={sdst.line} />
        </View>
    );
}

const sdst = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.md,
        marginVertical: FS.lg,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: FC.border,
    },
    label: {
        fontSize: FT.xs,
        fontWeight: FW.black,
        color: FC.textMuted,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
});

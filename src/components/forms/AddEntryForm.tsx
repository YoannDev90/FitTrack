// ============================================================================
// ADD ENTRY FORM — Orchestrateur principal · Toute la logique métier ici
// ============================================================================

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Alert,
    KeyboardAvoidingView, Platform, TouchableOpacity, Animated,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Check, ChevronDown, Settings, Activity } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { nanoid } from 'nanoid/non-secure';

import { useAppStore, useSportsConfig } from '../../stores';
import type { EntryType, Entry, HomeWorkoutEntry, RunEntry, BeatSaberEntry, MealEntry, MeasureEntry, SportConfig, CustomSportEntry } from '../../types';

import { CategoryScreen }    from './CategoryScreen';
import { WorkoutForm }       from './WorkoutForm';
import { RunForm, BeatSaberForm, MealForm, MeasureForm, CustomSportForm } from './SportForms';
import { DateTimeSelector }  from './DateTimeSelector';
import { ImportModal }       from './ImportModal';
import { FC, FS, FR, FT, FW } from './formStyles';

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryType = 'sport' | 'meal' | 'measure';
type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const MEAL_TIME_LABELS: Record<MealTime, string> = {
    breakfast: '☀️ Petit-déj',
    lunch: '🌤️ Déjeuner',
    dinner: '🌙 Dîner',
    snack: '🍎 Collation',
};

interface Exercise { id: string; name: string; reps: string; sets: string; }

interface AddEntryFormProps {
    onSuccess?: () => void;
    onDismiss?: () => void;
    initialTab?: EntryType;
    prefillExercises?: string;
    includeAbsBlock?: boolean;
    editEntry?: Entry | null;
}

const EXAMPLE_JSON = `{
  "exercises": [
    { "name": "Pompes", "sets": 3, "reps": 12 },
    { "name": "Squats", "sets": 4, "reps": 20 },
    { "name": "Gainage", "sets": 3, "reps": "45s" }
  ],
  "includeAbsBlock": true
}`;

// ─── Helper : parse exercises text → Exercise[] ───────────────────────────────
function parseExercisesText(text: string): Exercise[] {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return [{ id: nanoid(), name: '', reps: '', sets: '3' }];
    return lines.map(line => {
        const m = line.match(/^([^:]+):\s*(\d+)x(.+)$/);
        if (m) return { id: nanoid(), name: m[1].trim(), sets: m[2], reps: m[3].trim() };
        return { id: nanoid(), name: line.trim(), reps: '', sets: '3' };
    });
}

// ─── Helper : format Exercise[] → text ────────────────────────────────────────
function formatExercisesToText(exs: Exercise[]): string {
    return exs.filter(e => e.name.trim()).map(e => `${e.name}: ${e.sets}x${e.reps}`).join('\n');
}

// ─── Tab config ───────────────────────────────────────────────────────────────
const TAB_EMOJI: Record<EntryType, string> = {
    home: '🏋️', run: '🏃', beatsaber: '🎮',
    meal: '🍽️', measure: '📏', custom: '⚡',
};

// ─── Main component ───────────────────────────────────────────────────────────

export function AddEntryForm({
    onSuccess, onDismiss,
    initialTab = 'home',
    prefillExercises = '',
    includeAbsBlock = false,
    editEntry = null,
}: AddEntryFormProps) {
    const { t } = useTranslation();
    const isEdit = editEntry !== null;
    const sportsConfig = useSportsConfig();
    const visibleSports = useMemo(() => sportsConfig.filter((s: SportConfig) => !s.isHidden), [sportsConfig]);

    const initialCategory = useMemo<CategoryType | null>(() => {
        if (!editEntry) return null;
        if (['home', 'run', 'beatsaber', 'custom'].includes(editEntry.type)) return 'sport';
        if (editEntry.type === 'meal') return 'meal';
        if (editEntry.type === 'measure') return 'measure';
        return null;
    }, [editEntry]);

    // ── Navigation flow ─────────────────────────────────────────────────────
    const [hasStarted, setHasStarted]               = useState(isEdit);
    const [selectedCategory, setSelectedCategory]   = useState<CategoryType | null>(initialCategory);
    const [activeTab, setActiveTab]                 = useState<EntryType>(editEntry?.type || initialTab);
    const [sportMenuOpen, setSportMenuOpen]         = useState(false);

    // ── Import modal ────────────────────────────────────────────────────────
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [jsonInput, setJsonInput]                   = useState('');
    const [loading, setLoading]                       = useState(false);

    // ── Date / time ─────────────────────────────────────────────────────────
    const [useCustomDateTime, setUseCustomDateTime] = useState(!!editEntry);
    const [customDate, setCustomDate]               = useState(editEntry?.date || format(new Date(), 'yyyy-MM-dd'));
    const [customTime, setCustomTime]               = useState(editEntry ? format(new Date(editEntry.createdAt), 'HH:mm') : format(new Date(), 'HH:mm'));
    const [showDatePicker, setShowDatePicker]       = useState(false);
    const [showTimePicker, setShowTimePicker]       = useState(false);

    const onDateChange = useCallback((event: any, selected?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selected) setCustomDate(format(selected, 'yyyy-MM-dd'));
    }, []);

    const onTimeChange = useCallback((event: any, selected?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selected) setCustomTime(format(selected, 'HH:mm'));
    }, []);

    // ── Formulaire Home Workout ─────────────────────────────────────────────
    const [homeName, setHomeName]       = useState(() => isEdit && editEntry?.type === 'home' ? (editEntry as HomeWorkoutEntry).name || '' : '');
    const [homeDuration, setHomeDuration] = useState(() => isEdit && editEntry?.type === 'home' ? (editEntry as HomeWorkoutEntry).durationMinutes?.toString() || '' : '');
    const [exercises, setExercises]     = useState<Exercise[]>(() =>
        isEdit && editEntry?.type === 'home'
            ? parseExercisesText((editEntry as HomeWorkoutEntry).exercises)
            : prefillExercises ? parseExercisesText(prefillExercises) : [{ id: nanoid(), name: '', reps: '', sets: '3' }]
    );
    const [withAbsBlock, setWithAbsBlock] = useState(() => isEdit && editEntry?.type === 'home' ? !!(editEntry as HomeWorkoutEntry).absBlock : includeAbsBlock);

    // ── Formulaire Run ──────────────────────────────────────────────────────
    const [runFields, setRunFields] = useState(() => {
        if (isEdit && editEntry?.type === 'run') {
            const e = editEntry as RunEntry;
            return { km: e.distanceKm.toString(), minutes: e.durationMinutes.toString(), bpmAvg: e.bpmAvg?.toString() || '', bpmMax: e.bpmMax?.toString() || '', cardiacLoad: e.cardiacLoad?.toString() || '' };
        }
        return { km: '', minutes: '', bpmAvg: '', bpmMax: '', cardiacLoad: '' };
    });

    // ── Formulaire BeatSaber ────────────────────────────────────────────────
    const [bsFields, setBsFields] = useState(() => {
        if (isEdit && editEntry?.type === 'beatsaber') {
            const e = editEntry as BeatSaberEntry;
            return { duration: e.durationMinutes.toString(), cardiacLoad: e.cardiacLoad?.toString() || '', bpmAvg: e.bpmAvg?.toString() || '', bpmMax: e.bpmMax?.toString() || '' };
        }
        return { duration: '', cardiacLoad: '', bpmAvg: '', bpmMax: '' };
    });

    // ── Formulaire Meal ─────────────────────────────────────────────────────
    const [mealTime, setMealTime]           = useState<MealTime>(() => {
        if (isEdit && editEntry?.type === 'meal') {
            return (Object.entries(MEAL_TIME_LABELS).find(([_, v]) => v === (editEntry as MealEntry).mealName)?.[0] || 'lunch') as MealTime;
        }
        return 'lunch';
    });
    const [mealDescription, setMealDescription] = useState(() => isEdit && editEntry?.type === 'meal' ? (editEntry as MealEntry).description : '');

    // ── Formulaire Measure ──────────────────────────────────────────────────
    const [measureFields, setMeasureFields] = useState(() => {
        if (isEdit && editEntry?.type === 'measure') {
            const e = editEntry as any;
            return { weight: e.weight?.toString() || '', bodyFatPercent: e.bodyFatPercent?.toString() || '', waist: e.waist?.toString() || '', arm: e.arm?.toString() || '', hips: e.hips?.toString() || '' };
        }
        return { weight: '', bodyFatPercent: '', waist: '', arm: '', hips: '' };
    });

    // ── Formulaire Custom Sport ─────────────────────────────────────────────
    const [selectedSportId, setSelectedSportId]   = useState<string | null>(() => {
        if (isEdit && editEntry?.type === 'custom') {
            return (editEntry as CustomSportEntry).sportId;
        }
        if (isEdit && editEntry && ['home', 'run', 'beatsaber'].includes(editEntry.type)) {
            return editEntry.type;
        }
        return null;
    });
    const [customFields, setCustomFields]         = useState({ name: '', duration: '', distance: '', bpmAvg: '', bpmMax: '', cardiacLoad: '', calories: '', exercises: '', totalReps: '' });

    // ── Stores ──────────────────────────────────────────────────────────────
    const { addHomeWorkout, addRun, addBeatSaber, addMeal, addMeasure, addCustomSport, updateEntry } = useAppStore();

    // ── Exercise handlers ───────────────────────────────────────────────────
    const addExercise    = useCallback(() => setExercises(e => [...e, { id: nanoid(), name: '', reps: '', sets: '3' }]), []);
    const removeExercise = useCallback((i: number) => setExercises(e => e.length > 1 ? e.filter((_, idx) => idx !== i) : e), []);
    const updateExercise = useCallback((i: number, field: keyof Exercise, v: string) => {
        setExercises(prev => { const u = [...prev]; u[i] = { ...u[i], [field]: v }; return u; });
    }, []);

    // ── Import JSON ─────────────────────────────────────────────────────────
    const handleImport = useCallback(() => {
        try {
            const data = JSON.parse(jsonInput);
            if (data.exercises && Array.isArray(data.exercises)) {
                setExercises(data.exercises.map((ex: any) => ({ id: nanoid(), name: ex.name || '', reps: String(ex.reps || ''), sets: String(ex.sets || 3) })));
                if (data.includeAbsBlock !== undefined) setWithAbsBlock(data.includeAbsBlock);
                setImportModalVisible(false);
                setJsonInput('');
                Alert.alert(t('addEntry.imported', 'Importé !'), t('addEntry.exercises', { count: exercises.length }));
            } else {
                Alert.alert(t('addEntry.invalid', 'Format invalide'), t('addEntry.invalidJSON', 'Format JSON inattendu'));
            }
        } catch {
            Alert.alert('Erreur', 'JSON invalide');
        }
    }, [jsonInput, exercises.length, t]);

    const copyExample = useCallback(async () => {
        await Clipboard.setStringAsync(EXAMPLE_JSON);
        Alert.alert('Copié !', 'Exemple JSON copié dans le presse-papiers');
    }, []);

    const applySportSelection = useCallback((sportId: string) => {
        const map: Record<string, EntryType> = { home: 'home', run: 'run', beatsaber: 'beatsaber' };
        setSelectedSportId(sportId);
        if (map[sportId]) {
            setActiveTab(map[sportId]);
        } else {
            setActiveTab('custom');
        }
    }, []);

    const selectedSportLabel = useMemo(() => {
        const selected = sportsConfig.find((s: SportConfig) => s.id === selectedSportId);
        return selected?.name || t('addEntry.home', 'Musculation');
    }, [sportsConfig, selectedSportId, t]);

    // ── Navigation flow handlers ─────────────────────────────────────────────
    const handleSelectCategory = useCallback((cat: CategoryType) => {
        if (cat === 'sport') {
            const fallbackSportId = selectedSportId || visibleSports[0]?.id || 'home';
            applySportSelection(fallbackSportId);
            setSelectedCategory('sport');
            setHasStarted(true);
            return;
        }

        if (cat === 'measure') {
            setSelectedCategory('measure');
            setActiveTab('measure');
            setHasStarted(true);
            return;
        }

        setSelectedCategory('meal');
        setActiveTab('meal');
        setHasStarted(true);
    }, [applySportSelection, selectedSportId, visibleSports]);

    const handleRealTimeTracking = useCallback(() => {
        onDismiss?.();
        router.push('/repCounter');
    }, [onDismiss]);

    const handleOpenSportsSettings = useCallback(() => {
        onDismiss?.();
        router.push('/settings/sports');
    }, [onDismiss]);

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        setLoading(true);
        const entryDate = useCustomDateTime ? customDate : undefined;

        try {
            switch (activeTab) {
                case 'home': {
                    const valid = exercises.filter(e => e.name.trim());
                    if (!valid.length) { Alert.alert(t('common.error'), t('addEntry.error.noExercise', 'Ajoute au moins un exercice')); return; }
                    const text = formatExercisesToText(valid);
                    const totalReps = valid.reduce((acc, cur) => acc + (parseInt(cur.sets) * parseInt(cur.reps) || 0), 0);
                    const dur = homeDuration.trim().replace(',', '.');
                    const durMin = dur ? Math.round(parseFloat(dur)) : undefined;
                    if (dur && (!durMin || durMin <= 0)) { Alert.alert(t('common.error'), t('addEntry.durationErrorPositive')); return; }
                    const payload = { name: homeName.trim() || undefined, exercises: text, absBlock: withAbsBlock ? 'Bloc abdos inclus' : undefined, totalReps: totalReps > 0 ? totalReps : undefined, durationMinutes: durMin && durMin > 0 ? durMin : undefined };
                    isEdit && editEntry ? updateEntry(editEntry.id, { ...payload, date: entryDate || editEntry.date }) : addHomeWorkout(payload, entryDate);
                    break;
                }
                case 'run': {
                    const km = parseFloat(runFields.km.replace(',', '.'));
                    const min = Math.round(parseFloat(runFields.minutes.replace(',', '.')));
                    if (isNaN(km) || km <= 0) { Alert.alert('Erreur', 'Distance invalide'); return; }
                    if (isNaN(min) || min <= 0) { Alert.alert(t('common.error'), t('addEntry.durationError')); return; }
                    const payload = { distanceKm: km, durationMinutes: min, avgSpeed: min > 0 ? Math.round((km / (min / 60)) * 10) / 10 : 0, bpmAvg: runFields.bpmAvg ? parseInt(runFields.bpmAvg) : undefined, bpmMax: runFields.bpmMax ? parseInt(runFields.bpmMax) : undefined, cardiacLoad: runFields.cardiacLoad ? parseInt(runFields.cardiacLoad) : undefined };
                    isEdit && editEntry ? updateEntry(editEntry.id, { ...payload, date: entryDate || editEntry.date }) : addRun(payload, entryDate);
                    break;
                }
                case 'beatsaber': {
                    const min = parseFloat(bsFields.duration.replace(',', '.'));
                    if (isNaN(min) || min <= 0) { Alert.alert(t('common.error'), t('addEntry.durationErrorNumber')); return; }
                    const payload = { durationMinutes: Math.max(1, Math.round(min)), cardiacLoad: bsFields.cardiacLoad ? parseInt(bsFields.cardiacLoad) : undefined, bpmAvg: bsFields.bpmAvg ? parseInt(bsFields.bpmAvg) : undefined, bpmMax: bsFields.bpmMax ? parseInt(bsFields.bpmMax) : undefined };
                    isEdit && editEntry ? updateEntry(editEntry.id, { ...payload, date: entryDate || editEntry.date }) : addBeatSaber(payload, entryDate);
                    break;
                }
                case 'meal': {
                    if (!mealDescription.trim()) { Alert.alert('Erreur', 'Décris ce que tu as mangé'); return; }
                    const payload = { mealName: MEAL_TIME_LABELS[mealTime], description: mealDescription.trim() };
                    isEdit && editEntry ? updateEntry(editEntry.id, { ...payload, date: entryDate || editEntry.date }) : addMeal(payload, entryDate);
                    break;
                }
                case 'measure': {
                    const f = measureFields;
                    const w = f.weight.replace(',', '.'), bf = f.bodyFatPercent.replace(',', '.'), ws = f.waist.replace(',', '.'), ar = f.arm.replace(',', '.'), hi = f.hips.replace(',', '.');
                    if (w && isNaN(parseFloat(w))) { Alert.alert(t('common.error'), t('addEntry.weightError')); return; }
                    if (bf && isNaN(parseFloat(bf))) { Alert.alert(t('common.error'), t('addEntry.bodyFatError')); return; }
                    if (!w && !bf && !ws && !ar && !hi) { Alert.alert('Erreur', 'Ajoute au moins une mesure'); return; }
                    const payload = { weight: w ? parseFloat(w) : undefined, bodyFatPercent: bf ? parseFloat(bf) : undefined, waist: ws ? parseFloat(ws) : undefined, arm: ar ? parseFloat(ar) : undefined, hips: hi ? parseFloat(hi) : undefined };
                    isEdit && editEntry ? updateEntry(editEntry.id, { ...payload, date: entryDate || editEntry.date }) : addMeasure(payload, entryDate);
                    break;
                }
                case 'custom': {
                    if (!selectedSportId) { Alert.alert(t('common.error'), 'Aucun sport sélectionné'); return; }
                    const sport = sportsConfig.find((s: SportConfig) => s.id === selectedSportId);
                    if (!sport) { Alert.alert(t('common.error'), 'Sport introuvable'); return; }
                    const tf = sport.trackingFields;
                    const cf = customFields;
                    const customData: any = { sportId: selectedSportId, name: cf.name.trim() || undefined };
                    if (tf.includes('duration') && cf.duration) { const v = Math.round(parseFloat(cf.duration.replace(',', '.'))); if (isNaN(v) || v <= 0) { Alert.alert(t('common.error'), t('addEntry.durationErrorPositive')); return; } customData.durationMinutes = v; }
                    if (tf.includes('distance') && cf.distance) { const v = parseFloat(cf.distance.replace(',', '.')); if (isNaN(v) || v <= 0) { Alert.alert(t('common.error'), 'Distance invalide'); return; } customData.distanceKm = v; }
                    if (tf.includes('bpmAvg') && cf.bpmAvg)     customData.bpmAvg = parseInt(cf.bpmAvg);
                    if (tf.includes('bpmMax') && cf.bpmMax)     customData.bpmMax = parseInt(cf.bpmMax);
                    if (tf.includes('cardiacLoad') && cf.cardiacLoad) customData.cardiacLoad = parseInt(cf.cardiacLoad);
                    if (tf.includes('calories') && cf.calories) customData.calories = parseInt(cf.calories);
                    if (tf.includes('exercises') && cf.exercises) customData.exercises = cf.exercises.trim();
                    if (tf.includes('totalReps') && cf.totalReps) customData.totalReps = parseInt(cf.totalReps);
                    isEdit && editEntry ? updateEntry(editEntry.id, { ...customData, date: entryDate || editEntry.date }) : addCustomSport(customData, entryDate);
                    break;
                }
            }

            // Reset
            setHomeName(''); setHomeDuration('');
            setExercises([{ id: nanoid(), name: '', reps: '', sets: '3' }]);
            setWithAbsBlock(false);
            setRunFields({ km: '', minutes: '', bpmAvg: '', bpmMax: '', cardiacLoad: '' });
            setBsFields({ duration: '', cardiacLoad: '', bpmAvg: '', bpmMax: '' });
            setMealDescription('');
            setMeasureFields({ weight: '', bodyFatPercent: '', waist: '', arm: '', hips: '' });
            setSelectedSportId(null);
            setCustomFields({ name: '', duration: '', distance: '', bpmAvg: '', bpmMax: '', cardiacLoad: '', calories: '', exercises: '', totalReps: '' });
            setUseCustomDateTime(false);
            setCustomDate(format(new Date(), 'yyyy-MM-dd'));
            setCustomTime(format(new Date(), 'HH:mm'));
            setSportMenuOpen(false);
            setHasStarted(false);
            setSelectedCategory(null);

            onSuccess?.();
        } finally {
            setLoading(false);
        }
    }, [activeTab, exercises, homeName, homeDuration, withAbsBlock, runFields, bsFields, mealTime, mealDescription, measureFields, selectedSportId, customFields, useCustomDateTime, customDate, customTime, isEdit, editEntry, addHomeWorkout, addRun, addBeatSaber, addMeal, addMeasure, addCustomSport, updateEntry, sportsConfig, t, onSuccess]);

    // ── Animations ───────────────────────────────────────────────────────────
    const formAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (hasStarted) {
            formAnim.setValue(0);
            Animated.spring(formAnim, { toValue: 1, useNativeDriver: true, tension: 75, friction: 11 }).start();
        }
    }, [hasStarted, activeTab]);

    // ── Render : sélection catégorie ─────────────────────────────────────────
    if (!hasStarted && !selectedCategory) {
        return (
            <View style={st.flowContainer}>
                <CategoryScreen onSelect={handleSelectCategory} />
            </View>
        );
    }

    // ── Render : formulaire ───────────────────────────────────────────────────
    const tabEmoji = TAB_EMOJI[activeTab] || '📝';
    const tabLabel = activeTab === 'custom' && selectedSportId
        ? sportsConfig.find((s: SportConfig) => s.id === selectedSportId)?.name || 'Sport'
        : activeTab === 'home' ? t('addEntry.home', 'Musculation')
        : activeTab === 'run'  ? t('addEntry.run', 'Course')
        : activeTab === 'beatsaber' ? t('addEntry.beatsaber', 'Beat Saber')
        : activeTab === 'meal' ? t('addEntry.meal', 'Repas')
        : t('addEntry.measure', 'Mesures');

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={st.kvContainer}>
            <Animated.View style={[
                st.innerContainer,
                {
                    opacity: formAnim,
                    transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
                },
            ]}>
                {/* Header */}
                <View style={st.header}>
                    <TouchableOpacity
                        style={st.backBtn}
                        onPress={() => {
                            setHasStarted(false);
                            setSelectedCategory(null);
                            setSportMenuOpen(false);
                        }}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft size={18} color={FC.textSub} strokeWidth={2.5} />
                        <Text style={st.backText}>{t('addEntry.back', 'Retour')}</Text>
                    </TouchableOpacity>

                    <View style={st.headerCenter}>
                        <Text style={st.headerEmoji}>{tabEmoji}</Text>
                        <Text style={st.headerTitle}>{tabLabel}</Text>
                    </View>

                    <View style={{ width: 72 }} />
                </View>

                <ScrollView
                    style={st.scroll}
                    contentContainerStyle={st.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {selectedCategory === 'sport' && (
                        <View style={st.sportToolsWrap}>
                            <TouchableOpacity
                                style={st.realtimeHintBtn}
                                onPress={handleRealTimeTracking}
                                activeOpacity={0.75}
                            >
                                <Activity size={14} color={FC.textMuted} strokeWidth={2.4} />
                                <Text style={st.realtimeHintText}>
                                    {t('addEntry.realtimeHint', 'Vous preferez tracker cet exercice ?')}
                                </Text>
                            </TouchableOpacity>

                            <View style={st.sportSelectRow}>
                                <TouchableOpacity
                                    style={st.sportDropdownBtn}
                                    onPress={() => setSportMenuOpen(v => !v)}
                                    activeOpacity={0.75}
                                >
                                    <Text style={st.sportDropdownText} numberOfLines={1}>
                                        {selectedSportLabel}
                                    </Text>
                                    <ChevronDown size={16} color={FC.textSub} strokeWidth={2.2} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={st.sportSettingsBtn}
                                    onPress={handleOpenSportsSettings}
                                    activeOpacity={0.75}
                                >
                                    <Settings size={16} color={FC.textSub} strokeWidth={2.2} />
                                </TouchableOpacity>
                            </View>

                            {sportMenuOpen && (
                                <View style={st.sportDropdownMenu}>
                                    {visibleSports.map((sport) => (
                                        <TouchableOpacity
                                            key={sport.id}
                                            style={[
                                                st.sportDropdownItem,
                                                selectedSportId === sport.id && st.sportDropdownItemActive,
                                            ]}
                                            onPress={() => {
                                                applySportSelection(sport.id);
                                                setSportMenuOpen(false);
                                            }}
                                            activeOpacity={0.75}
                                        >
                                            <Text style={st.sportDropdownItemEmoji}>{sport.emoji}</Text>
                                            <Text
                                                style={[
                                                    st.sportDropdownItemText,
                                                    selectedSportId === sport.id && st.sportDropdownItemTextActive,
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {sport.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Date/heure */}
                    <DateTimeSelector
                        enabled={useCustomDateTime}
                        onToggle={() => setUseCustomDateTime(v => !v)}
                        customDate={customDate}
                        customTime={customTime}
                        showDatePicker={showDatePicker}
                        showTimePicker={showTimePicker}
                        onShowDatePicker={() => setShowDatePicker(true)}
                        onShowTimePicker={() => setShowTimePicker(true)}
                        onDateChange={onDateChange}
                        onTimeChange={onTimeChange}
                    />

                    {/* Formulaire actif */}
                    {activeTab === 'home' && (
                        <WorkoutForm
                            name={homeName} duration={homeDuration}
                            exercises={exercises} withAbsBlock={withAbsBlock}
                            onChangeName={setHomeName} onChangeDuration={setHomeDuration}
                            onAddExercise={addExercise} onRemoveExercise={removeExercise}
                            onUpdateExercise={updateExercise}
                            onToggleAbs={() => setWithAbsBlock(v => !v)}
                            onOpenImport={() => setImportModalVisible(true)}
                        />
                    )}

                    {activeTab === 'run' && (
                        <RunForm
                            {...runFields}
                            onChange={(f, v) => setRunFields(prev => ({ ...prev, [f]: v }))}
                        />
                    )}

                    {activeTab === 'beatsaber' && (
                        <BeatSaberForm
                            {...bsFields}
                            onChange={(f, v) => setBsFields(prev => ({ ...prev, [f]: v }))}
                        />
                    )}

                    {activeTab === 'meal' && (
                        <MealForm
                            mealTime={mealTime} description={mealDescription}
                            onChangeMealTime={setMealTime}
                            onChangeDescription={setMealDescription}
                        />
                    )}

                    {activeTab === 'measure' && (
                        <MeasureForm
                            {...measureFields}
                            onChange={(f, v) => setMeasureFields(prev => ({ ...prev, [f]: v }))}
                        />
                    )}

                    {activeTab === 'custom' && selectedSportId && (() => {
                        const sport = sportsConfig.find((s: SportConfig) => s.id === selectedSportId);
                        return sport ? (
                            <CustomSportForm
                                sport={sport}
                                {...customFields}
                                onChange={(f, v) => setCustomFields(prev => ({ ...prev, [f]: v }))}
                            />
                        ) : null;
                    })()}

                    {/* Bouton submit */}
                    <TouchableOpacity
                        style={st.submitWrap}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.82}
                    >
                        <LinearGradient
                            colors={[FC.coral, FC.coralMid, FC.amber]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={[st.submitGrad, loading && { opacity: 0.65 }]}
                        >
                            <Check size={20} color="#1a0800" strokeWidth={3} />
                            <Text style={st.submitText}>
                                {isEdit ? t('addEntry.update') : t('addEntry.save')}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>

            {/* Import modal */}
            <ImportModal
                visible={importModalVisible}
                jsonInput={jsonInput}
                onChangeJson={setJsonInput}
                onImport={handleImport}
                onCopyExample={copyExample}
                onClose={() => setImportModalVisible(false)}
            />
        </KeyboardAvoidingView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
    flowContainer: {
        flex: 1,
        paddingHorizontal: FS.xl,
        paddingTop: FS.xl,
        paddingBottom: FS.xl,
    },
    kvContainer: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: FS.xl,
        paddingVertical: FS.lg,
        borderBottomWidth: 1,
        borderBottomColor: FC.border,
        marginBottom: FS.xs,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.xs,
        paddingVertical: 7,
        paddingHorizontal: FS.md,
        backgroundColor: FC.overlay,
        borderWidth: 1,
        borderColor: FC.border,
        borderRadius: FR.pill,
    },
    backText: {
        fontSize: FT.sm,
        fontWeight: FW.semi,
        color: FC.textSub,
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.sm,
    },
    headerEmoji: {
        fontSize: 20,
    },
    headerTitle: {
        fontSize: FT.lg,
        fontWeight: FW.black,
        color: FC.text,
        letterSpacing: -0.4,
    },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: FS.xl,
        paddingTop: FS.lg,
        paddingBottom: 50,
    },
    sportToolsWrap: {
        marginBottom: FS.lg,
        gap: FS.sm,
    },
    realtimeHintBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.xs,
        alignSelf: 'flex-start',
        paddingHorizontal: FS.sm,
        paddingVertical: FS.xs,
        borderRadius: FR.md,
        backgroundColor: FC.overlay,
        borderWidth: 1,
        borderColor: FC.border,
    },
    realtimeHintText: {
        fontSize: FT.xs,
        color: FC.textMuted,
        fontWeight: FW.med,
    },
    sportSelectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.sm,
    },
    sportDropdownBtn: {
        flex: 1,
        minHeight: 42,
        borderRadius: FR.lg,
        borderWidth: 1,
        borderColor: FC.border,
        backgroundColor: FC.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: FS.md,
    },
    sportDropdownText: {
        fontSize: FT.sm,
        color: FC.text,
        fontWeight: FW.semi,
        flex: 1,
        marginRight: FS.sm,
    },
    sportSettingsBtn: {
        width: 42,
        height: 42,
        borderRadius: FR.lg,
        borderWidth: 1,
        borderColor: FC.border,
        backgroundColor: FC.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sportDropdownMenu: {
        borderRadius: FR.lg,
        borderWidth: 1,
        borderColor: FC.border,
        backgroundColor: FC.surface,
        overflow: 'hidden',
    },
    sportDropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.sm,
        paddingHorizontal: FS.md,
        paddingVertical: FS.sm,
    },
    sportDropdownItemActive: {
        backgroundColor: FC.overlay,
    },
    sportDropdownItemEmoji: {
        fontSize: 18,
    },
    sportDropdownItemText: {
        flex: 1,
        fontSize: FT.sm,
        color: FC.textSub,
        fontWeight: FW.med,
    },
    sportDropdownItemTextActive: {
        color: FC.text,
        fontWeight: FW.bold,
    },

    // Submit
    submitWrap: {
        marginTop: FS.xxl,
        borderRadius: FR.xxl,
        overflow: 'hidden',
        shadowColor: FC.coral,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    submitGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: FS.md,
        paddingVertical: 18,
    },
    submitText: {
        fontSize: FT.lg,
        fontWeight: FW.black,
        color: '#1a0800',
        letterSpacing: -0.3,
    },
});

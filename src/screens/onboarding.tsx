// ============================================================================
// ONBOARDING SCREEN - Redesign Premium 2026
// ============================================================================

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutLeft,
  FadeInRight,
  ZoomIn,
  Layout,
} from 'react-native-reanimated';
import { useAppStore, useSocialStore } from '../stores';
// Assurez-vous que vos constantes sont bien importées
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Gradients } from '../constants';
import type { FitnessGoal, FitnessLevel } from '../types';
import { Users, Trophy, Sparkles, CheckCircle2 } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- DATA CONSTANTS ---

const GOAL_OPTIONS: { key: FitnessGoal; emoji: string; title: string; desc: string }[] = [
  { key: 'loseWeight', emoji: '🔥', title: 'Perdre du poids', desc: 'Brûler du gras & s\'affiner' },
  { key: 'buildMuscle', emoji: '💪', title: 'Prendre du muscle', desc: 'Gagner en force & volume' },
  { key: 'improveCardio', emoji: '🏃', title: 'Améliorer le cardio', desc: 'Endurance & souffle' },
  { key: 'stayHealthy', emoji: '🧘', title: 'Rester en forme', desc: 'Santé & bien-être quotidien' },
];

const LEVEL_OPTIONS: { key: FitnessLevel; emoji: string; title: string; desc: string }[] = [
  { key: 'beginner', emoji: '🌱', title: 'Débutant', desc: 'Je commence tout juste' },
  { key: 'intermediate', emoji: '⚡', title: 'Intermédiaire', desc: 'Je m\'entraîne parfois' },
  { key: 'advanced', emoji: '🦁', title: 'Avancé', desc: 'Je suis une machine' },
];

// --- COMPONENTS ---

// Indicateur de progression élégant
function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = (current + 1) / total;
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View 
          style={[styles.progressBar, { width: `${progress * 100}%` }]} 
          layout={Layout.springify()}
        />
      </View>
      <Text style={styles.stepIndicator}>{current + 1}/{total}</Text>
    </View>
  );
}

// Bouton principal avec dégradé
interface PrimaryButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  icon?: string;
}

const PrimaryButton = ({ onPress, title, disabled = false, icon }: PrimaryButtonProps) => (
  <TouchableOpacity 
    onPress={onPress} 
    activeOpacity={0.9} 
    disabled={disabled}
    style={[styles.buttonWrapper, disabled && styles.buttonDisabled]}
  >
    <LinearGradient
      colors={disabled ? [Colors.card, Colors.card] : (Gradients.cta || [Colors.teal, Colors.cta])}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.primaryButton}
    >
      <Text style={[styles.primaryButtonText, disabled && styles.buttonTextDisabled]}>
        {title}
      </Text>
      {icon && <Text style={styles.buttonIcon}>{icon}</Text>}
    </LinearGradient>
  </TouchableOpacity>
);

// --- MAIN SCREEN ---

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateSettings, updateWeeklyGoal } = useAppStore();
  const { setSocialEnabled } = useSocialStore();

  // Steps: 0:Welcome, 1:Goal, 2:Level, 3:Frequency, 4:Social, 5:Gamification, 6:Ready
  const [currentStep, setCurrentStep] = useState(0);
  
  // Selection State
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<FitnessLevel | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState(3);
  const [wantsSocial, setWantsSocial] = useState(true);
  const [wantsGamification, setWantsGamification] = useState(true);

  const handleComplete = useCallback(async () => {
    // Update settings with all choices
    await updateSettings({
      onboardingCompleted: true,
      fitnessGoal: selectedGoal || undefined,
      fitnessLevel: selectedLevel || undefined,
      hiddenTabs: {
        tools: true,
        workout: false,
        gamification: !wantsGamification,
      },
    });
    await updateWeeklyGoal(weeklyGoal);
    
    // Enable/disable social features
    try {
      await setSocialEnabled(wantsSocial);
    } catch (error) {
      // Continue onboarding completion even if social preference sync fails remotely.
      if (__DEV__) {
        console.warn('[Onboarding] Failed to sync social preference', error);
      }
    }
    
    router.replace('/');
  }, [selectedGoal, selectedLevel, weeklyGoal, wantsSocial, wantsGamification, updateSettings, updateWeeklyGoal, setSocialEnabled, router]);

  const handleSkip = useCallback(async () => {
    await updateSettings({ onboardingCompleted: true });
    router.replace('/');
  }, [updateSettings, router]);

  const nextStep = () => setCurrentStep(p => p + 1);
  const prevStep = () => setCurrentStep(p => Math.max(0, p - 1));

  // Total steps for progress bar (excluding Welcome and Ready)
  const PROGRESS_STEPS = 5; // Goal, Level, Frequency, Social, Gamification

  // RENDER STEPS
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return <WelcomeStep onNext={nextStep} />;
      case 1: return <GoalStep selected={selectedGoal} onSelect={setSelectedGoal} />;
      case 2: return <LevelStep selected={selectedLevel} onSelect={setSelectedLevel} />;
      case 3: return <FrequencyStep value={weeklyGoal} onChange={setWeeklyGoal} />;
      case 4: return <SocialStep enabled={wantsSocial} onToggle={setWantsSocial} />;
      case 5: return <GamificationStep enabled={wantsGamification} onToggle={setWantsGamification} />;
      case 6: return <ReadyStep onComplete={handleComplete} wantsSocial={wantsSocial} wantsGamification={wantsGamification} />;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background global pour la continuité */}
      <LinearGradient
        colors={[Colors.bg, Colors.bgLayer, Colors.black]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header (sauf sur Welcome & Ready) */}
      {currentStep > 0 && currentStep < 6 && (
        <SafeAreaView edges={['top']} style={styles.header}>
          <TouchableOpacity onPress={prevStep} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <ProgressBar current={currentStep - 1} total={PROGRESS_STEPS} />
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>{t('common.skip') || 'Passer'}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* Contenu principal */}
      <View style={styles.contentContainer}>
        {renderStepContent()}
      </View>

      {/* Footer avec bouton (sauf Welcome & Ready qui ont leurs propres boutons) */}
      {currentStep > 0 && currentStep < 6 && (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <PrimaryButton 
            title={t('common.continue') || "Continuer"} 
            onPress={nextStep}
            disabled={
              (currentStep === 1 && !selectedGoal) ||
              (currentStep === 2 && !selectedLevel)
            }
          />
        </SafeAreaView>
      )}
    </View>
  );
}

// --- STEP 1: WELCOME ---
const WelcomeStep = ({ onNext }: { onNext: () => void }) => (
  <View style={styles.fullScreen}>
    <Image 
      source={require('../assets/onboarding.jpg')}
      alt="Onboarding hero"
      style={StyleSheet.absoluteFillObject}
      resizeMode="cover"
    />
    <LinearGradient
      colors={[Colors.transparent, Colors.overlayBlack60, Colors.bg]}
      locations={[0, 0.4, 1]}
      style={StyleSheet.absoluteFillObject}
    />
    
    <SafeAreaView edges={['bottom']} style={styles.welcomeContent}>
      <Animated.View entering={FadeInDown.delay(300).springify()}>
        <View style={styles.welcomeTag}>
          <Text style={styles.welcomeTagText}>FITNESS APP 2026</Text>
        </View>
        <Text style={styles.welcomeTitle}>Transforme{"\n"}ton corps &{"\n"}ton esprit.</Text>
        <Text style={styles.welcomeSubtitle}>
          L'outil ultime pour suivre tes progrès, rester motivé et atteindre tes objectifs.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.welcomeAction}>
        <PrimaryButton title="Commencer l'aventure" onPress={onNext} icon="➜" />
      </Animated.View>
    </SafeAreaView>
  </View>
);

// --- STEP 2: GOAL ---
const GoalStep = ({ selected, onSelect }: { selected: FitnessGoal | null, onSelect: (g: FitnessGoal) => void }) => (
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
    <Animated.View entering={FadeInDown.delay(100)}>
      <Text style={styles.stepTitle}>Quel est ton{'\n'}objectif principal ?</Text>
      <Text style={styles.stepSubtitle}>Nous adapterons ton expérience en fonction.</Text>
    </Animated.View>

    <View style={styles.gridContainer}>
      {GOAL_OPTIONS.map((option, idx) => {
        const isSelected = selected === option.key;
        return (
          <Animated.View key={option.key} entering={FadeInDown.delay(200 + idx * 50).springify()} style={styles.gridItemWrapper}>
            <Pressable
              onPress={() => onSelect(option.key)}
              style={[styles.card, isSelected && styles.cardSelected]}
            >
              <Text style={styles.cardEmoji}>{option.emoji}</Text>
              <Text style={[styles.cardTitle, isSelected && styles.textSelected]}>{option.title}</Text>
              {isSelected && <View style={styles.checkCircle}><Text style={styles.checkIcon}>✓</Text></View>}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  </ScrollView>
);

// --- STEP 3: LEVEL ---
const LevelStep = ({ selected, onSelect }: { selected: FitnessLevel | null, onSelect: (l: FitnessLevel) => void }) => (
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
    <Animated.View entering={FadeInDown.delay(100)}>
      <Text style={styles.stepTitle}>Ton niveau{'\n'}actuel ?</Text>
      <Text style={styles.stepSubtitle}>Sois honnête, on ne juge pas ici !</Text>
    </Animated.View>

    <View style={styles.listContainer}>
      {LEVEL_OPTIONS.map((option, idx) => {
        const isSelected = selected === option.key;
        return (
          <Animated.View key={option.key} entering={FadeInRight.delay(200 + idx * 100).springify()}>
            <Pressable
              onPress={() => onSelect(option.key)}
              style={[styles.listCard, isSelected && styles.cardSelected]}
            >
              <View style={styles.listIconBg}>
                <Text style={styles.listEmoji}>{option.emoji}</Text>
              </View>
              <View style={styles.listContent}>
                <Text style={[styles.listTitle, isSelected && styles.textSelected]}>{option.title}</Text>
                <Text style={styles.listDesc}>{option.desc}</Text>
              </View>
              <View style={[styles.radioCircle, isSelected && styles.radioSelected]} />
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  </ScrollView>
);

// --- STEP 4: FREQUENCY ---
const FrequencyStep = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => (
  <View style={styles.centerContent}>
    <Animated.View entering={FadeInDown.delay(100)}>
      <Text style={styles.stepTitleCenter}>Objectif{'\n'}Hebdomadaire</Text>
      <Text style={styles.stepSubtitleCenter}>Combien de séances par semaine ?</Text>
    </Animated.View>

    <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.bigNumberContainer}>
      <Text style={styles.bigNumber}>{value}</Text>
      <Text style={styles.bigNumberLabel}>séances</Text>
    </Animated.View>

    <View style={styles.sliderContainer}>
      <View style={styles.frequencyRow}>
        {[1, 2, 3, 4, 5, 6, 7].map((num, idx) => {
          const isSelected = value === num;
          return (
            <Animated.View key={num} entering={FadeInDown.delay(300 + idx * 50)}>
              <Pressable
                onPress={() => onChange(num)}
                style={[styles.freqBtn, isSelected && styles.freqBtnSelected]}
              >
                <Text style={[styles.freqBtnText, isSelected && styles.freqBtnTextSelected]}>{num}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
      <Text style={styles.frequencyHint}>
        {value < 3 ? "Doucement mais sûrement 🌱" : value > 5 ? "Mode Beast activé 🔥" : "L'équilibre parfait 💪"}
      </Text>
    </View>
  </View>
);

// --- STEP 5: SOCIAL ---
const SocialStep = ({ enabled, onToggle }: { enabled: boolean, onToggle: (v: boolean) => void }) => (
  <View style={styles.centerContent}>
    <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.featureIconContainer}>
      <Users size={60} color={enabled ? Colors.cta : Colors.muted} strokeWidth={1.5} />
    </Animated.View>
    
    <Animated.View entering={FadeInDown.delay(300)}>
      <Text style={styles.stepTitleCenter}>Envie de partager{'\n'}tes exploits ?</Text>
      <Text style={styles.stepSubtitleCenter}>
        Connecte-toi avec tes amis, compare vos progressions et encouragez-vous mutuellement !
      </Text>
    </Animated.View>

    <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.toggleContainer}>
      <Pressable
        onPress={() => onToggle(true)}
        style={[styles.toggleOption, enabled && styles.toggleOptionActive]}
      >
        <View style={[styles.toggleIconBg, enabled && styles.toggleIconBgActive]}>
          <Text style={{ fontSize: 24 }}>👥</Text>
        </View>
        <Text style={[styles.toggleTitle, enabled && styles.toggleTitleActive]}>Activer le Social</Text>
        <Text style={styles.toggleDesc}>Classements, amis, encouragements</Text>
        {enabled && <View style={styles.toggleCheck}><Text style={{ fontSize: 12 }}>✓</Text></View>}
      </Pressable>
      
      <Pressable
        onPress={() => onToggle(false)}
        style={[styles.toggleOption, !enabled && styles.toggleOptionActive]}
      >
        <View style={[styles.toggleIconBg, !enabled && styles.toggleIconBgActive]}>
          <Text style={{ fontSize: 24 }}>🔒</Text>
        </View>
        <Text style={[styles.toggleTitle, !enabled && styles.toggleTitleActive]}>Mode Solo</Text>
        <Text style={styles.toggleDesc}>100% privé, sans connexion</Text>
        {!enabled && <View style={styles.toggleCheck}><Text style={{ fontSize: 12 }}>✓</Text></View>}
      </Pressable>
    </Animated.View>

    <Animated.View entering={FadeInDown.delay(500)} style={styles.featureNote}>
      <Text style={styles.featureNoteText}>
        💡 Tu pourras activer cette option plus tard dans les paramètres
      </Text>
    </Animated.View>
  </View>
);

// --- STEP 6: GAMIFICATION ---
const GamificationStep = ({ enabled, onToggle }: { enabled: boolean, onToggle: (v: boolean) => void }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.centerContent}>
    <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.featureIconContainer}>
      <Trophy size={60} color={enabled ? Colors.goldStrong : Colors.muted} strokeWidth={1.5} />
    </Animated.View>
    
    <Animated.View entering={FadeInDown.delay(300)}>
      <Text style={styles.stepTitleCenter}>{t('onboarding.gamification.title')}</Text>
      <Text style={styles.stepSubtitleCenter}>
        {t('onboarding.gamification.subtitle')}
      </Text>
    </Animated.View>

    <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.toggleContainer}>
      <Pressable
        onPress={() => onToggle(true)}
        style={[styles.toggleOption, enabled && styles.toggleOptionActive]}
      >
        <View style={[styles.toggleIconBg, enabled && { backgroundColor: Colors.overlayGold20 }]}> 
          <Text style={{ fontSize: 24 }}>⭐</Text>
        </View>
        <Text style={[styles.toggleTitle, enabled && styles.toggleTitleActive]}>
          {t('onboarding.gamification.progress.title')}
        </Text>
        <Text style={styles.toggleDesc}>
          {t('onboarding.gamification.progress.desc')}
        </Text>
        {enabled && <View style={[styles.toggleCheck, { backgroundColor: Colors.goldStrong }]}><Text style={{ fontSize: 12, color: Colors.black }}>✓</Text></View>}
      </Pressable>
      
      <Pressable
        onPress={() => onToggle(false)}
        style={[styles.toggleOption, !enabled && styles.toggleOptionActive]}
      >
        <View style={[styles.toggleIconBg, !enabled && styles.toggleIconBgActive]}>
          <Text style={{ fontSize: 24 }}>📋</Text>
        </View>
        <Text style={[styles.toggleTitle, !enabled && styles.toggleTitleActive]}>
          {t('onboarding.gamification.simple.title')}
        </Text>
        <Text style={styles.toggleDesc}>
          {t('onboarding.gamification.simple.desc')}
        </Text>
        {!enabled && <View style={styles.toggleCheck}><Text style={{ fontSize: 12 }}>✓</Text></View>}
      </Pressable>
    </Animated.View>

    <Animated.View entering={FadeInDown.delay(500)} style={styles.featureNote}>
      <Text style={styles.featureNoteText}>
        💡 {t('onboarding.gamification.note')}
      </Text>
    </Animated.View>
  </View>
  );
};

// --- STEP 7: READY ---
const ReadyStep = ({ onComplete, wantsSocial, wantsGamification }: { onComplete: () => void, wantsSocial: boolean, wantsGamification: boolean }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.readyContainer}>
      <View style={styles.readyContent}>
        <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.successIcon}>
          <Text style={{ fontSize: 60 }}>🚀</Text>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.readyTitle}>{t('onboarding.ready.title')}</Text>
          <Text style={styles.readyDesc}>
            {t('onboarding.ready.subtitle')}
          </Text>
        </Animated.View>

      <Animated.View entering={FadeInDown.delay(600)} style={styles.readySummary}>
        <View style={styles.readySummaryItem}>
          <View style={[styles.readySummaryIcon, wantsGamification && { backgroundColor: Colors.overlayGold20 }]}> 
            {wantsGamification ? <Trophy size={20} color={Colors.goldStrong} /> : <CheckCircle2 size={20} color={Colors.muted} />}
          </View>
          <Text style={styles.readySummaryText}>
            {wantsGamification ? t('onboarding.ready.progressEnabled') : t('onboarding.ready.simpleMode')}
          </Text>
        </View>
        
        <View style={styles.readySummaryItem}>
          <View style={[styles.readySummaryIcon, wantsSocial && { backgroundColor: Colors.overlayConnected20 }]}> 
            {wantsSocial ? <Users size={20} color={Colors.successStrong} /> : <CheckCircle2 size={20} color={Colors.muted} />}
          </View>
          <Text style={styles.readySummaryText}>
            {wantsSocial ? t('onboarding.ready.socialEnabled') : t('onboarding.ready.soloMode')}
          </Text>
        </View>
      </Animated.View>
    </View>

    <Animated.View entering={FadeInDown.delay(800)} style={styles.readyFooter}>
      <PrimaryButton title={t('onboarding.ready.button')} onPress={onComplete} />
    </Animated.View>
  </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  fullScreen: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, color: Colors.text },
  skipText: { color: Colors.muted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  
  // Progress
  progressContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginHorizontal: Spacing.lg },
  progressTrack: { flex: 1, height: 4, backgroundColor: Colors.overlayWhite10, borderRadius: 2, marginRight: 8 },
  progressBar: { height: '100%', backgroundColor: Colors.cta, borderRadius: 2 },
  stepIndicator: { color: Colors.muted, fontSize: 12, fontWeight: FontWeight.bold },

  // Typography Generals
  stepTitle: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 40,
  },
  stepSubtitle: {
    fontSize: FontSize.lg,
    color: Colors.muted,
    marginBottom: Spacing.xxl,
  },
  stepTitleCenter: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitleCenter: {
    fontSize: FontSize.lg,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  // Welcome Step
  welcomeContent: { flex: 1, padding: Spacing.xxl, justifyContent: 'flex-end' },
  welcomeTag: { 
    backgroundColor: Colors.overlayWhite15,
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8, 
    alignSelf: 'flex-start', 
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.overlayWhite20,
  },
  welcomeTagText: { color: Colors.white, fontWeight: 'bold', fontSize: 10, letterSpacing: 1 },
  welcomeTitle: { fontSize: 48, fontWeight: '900', color: Colors.white, lineHeight: 52, marginBottom: Spacing.md },
  welcomeSubtitle: { fontSize: FontSize.md, color: Colors.textWhite80, lineHeight: 24, marginBottom: Spacing.xxl },
  welcomeAction: { marginBottom: Spacing.lg },

  // Cards & Grid (Goals)
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItemWrapper: { width: (SCREEN_WIDTH - (Spacing.xl * 2) - 12) / 2 },
  card: {
    backgroundColor: Colors.overlayWhite05,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    height: 160,
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: Colors.transparent,
  },
  cardSelected: {
    borderColor: Colors.cta,
    backgroundColor: Colors.overlayWhite08,
  },
  cardEmoji: { fontSize: 32 },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  textSelected: { color: Colors.cta },
  checkCircle: { 
    position: 'absolute', top: 10, right: 10, 
    width: 20, height: 20, borderRadius: 10, 
    backgroundColor: Colors.cta, justifyContent: 'center', alignItems: 'center' 
  },
  checkIcon: { color: Colors.black, fontSize: 10, fontWeight: 'bold' },

  // List (Levels)
  listContainer: { gap: 12 },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlayWhite05,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.overlayWhite05,
  },
  listIconBg: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.overlayWhite05,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  listEmoji: { fontSize: 24 },
  listContent: { flex: 1 },
  listTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 2 },
  listDesc: { fontSize: FontSize.sm, color: Colors.muted },
  radioCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.muted,
  },
  radioSelected: {
    borderColor: Colors.cta,
    backgroundColor: Colors.cta,
  },

  // Frequency
  bigNumberContainer: { alignItems: 'center', marginVertical: Spacing.xl },
  bigNumber: { fontSize: 96, fontWeight: '900', color: Colors.cta, lineHeight: 100 },
  bigNumberLabel: { fontSize: FontSize.xl, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 2 },
  sliderContainer: { alignItems: 'center' },
  frequencyRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: Spacing.lg },
  freqBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.overlayWhite05,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.transparent,
  },
  freqBtnSelected: { backgroundColor: Colors.cta },
  freqBtnText: { color: Colors.muted, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  freqBtnTextSelected: { color: Colors.cozyWarmDarkText },
  frequencyHint: { color: Colors.cta, fontSize: FontSize.sm, fontWeight: FontWeight.medium },

  // Feature Steps (Social & Gamification)
  featureIconContainer: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.overlayWhite05,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xl,
    alignSelf: 'center',
    borderWidth: 1, borderColor: Colors.overlayWhite10,
  },
  toggleContainer: { gap: 12, marginTop: Spacing.md },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlayWhite03,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.transparent,
    gap: Spacing.md,
  },
  toggleOptionActive: {
    borderColor: Colors.cta,
    backgroundColor: Colors.overlayWhite06,
  },
  toggleIconBg: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.overlayWhite05,
    justifyContent: 'center', alignItems: 'center',
  },
  toggleIconBgActive: {
    backgroundColor: Colors.overlayCozyWarm40,
  },
  toggleTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  toggleTitleActive: { color: Colors.cta },
  toggleDesc: { fontSize: FontSize.xs, color: Colors.muted, position: 'absolute', bottom: 16, left: 84 },
  toggleCheck: {
    position: 'absolute', top: 12, right: 12,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.cta, justifyContent: 'center', alignItems: 'center',
  },
  featureNote: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.overlayWhite03,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.overlayWhite05,
  },
  featureNoteText: { fontSize: FontSize.sm, color: Colors.muted, textAlign: 'center' },

  // Ready Step
  readyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  readyContent: { alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' },
  successIcon: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: Colors.overlayWhite05,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.overlayWhite10,
  },
  readyTitle: { fontSize: 36, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  readyDesc: { fontSize: FontSize.md, color: Colors.muted, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl },
  readySummary: { gap: 12, width: '100%' },
  readySummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlayWhite03,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  readySummaryIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.overlayWhite05,
    justifyContent: 'center', alignItems: 'center',
  },
  readySummaryText: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  readyFooter: { width: '100%', paddingBottom: Spacing.xl },

  // Footer Actions
  footer: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.lg },
  buttonWrapper: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  primaryButton: {
    paddingVertical: 18,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  primaryButtonText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.cozyWarmDarkText, marginRight: 8 },
  buttonIcon: { fontSize: 18, color: Colors.cozyWarmDarkText },
  buttonDisabled: { opacity: 0.5 },
  buttonTextDisabled: { color: Colors.overlayWhite30 },
});

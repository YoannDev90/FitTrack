// ============================================================================
// SETTINGS - LANGUAGE SUB-SCREEN
// ============================================================================

import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Languages } from 'lucide-react-native';
import { GlassCard } from '../../src/components/ui';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants';
import { LANGUAGES, changeLanguage, getCurrentLanguage, type LanguageCode } from '../../src/i18n';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(getCurrentLanguage());

  const handleLanguageChange = useCallback(async (lang: LanguageCode) => {
    await changeLanguage(lang);
    setCurrentLanguage(lang);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[Colors.overlayMint16, Colors.transparent]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.delay(50)} style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.eyebrow}>{t('settings.eyebrow', 'SPIX')}</Text>
            <Text style={styles.screenTitle}>{t('settings.language')}</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <Languages size={18} color={Colors.mint} />
          </View>
        </Animated.View>

        {/* Language Options */}
        <GlassCard style={styles.languageCard}>
          {(Object.entries(LANGUAGES) as [LanguageCode, typeof LANGUAGES[LanguageCode]][]).map(([code, lang], index) => (
            <Animated.View 
              key={code}
              entering={FadeInDown.delay(100 + index * 50).springify()}
            >
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  currentLanguage === code && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageChange(code)}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageName,
                  currentLanguage === code && styles.languageNameActive,
                ]}>
                  {lang.nativeName}
                </Text>
                {currentLanguage === code && (
                  <View style={styles.languageCheck}>
                    <Check size={16} color={Colors.white} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
              {index < Object.keys(LANGUAGES).length - 1 && (
                <View style={styles.divider} />
              )}
            </Animated.View>
          ))}
        </GlassCard>

        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.stroke,
  },
  headerTitleWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.overlayMint28,
    backgroundColor: Colors.overlayMint12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Language Card
  languageCard: {
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.overlayWhite10,
    backgroundColor: Colors.overlayPanel82,
  },

  // Language Option
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  languageOptionActive: {
    backgroundColor: `${Colors.teal}15`,
  },
  languageFlag: {
    fontSize: 28,
  },
  languageName: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  languageNameActive: {
    fontWeight: FontWeight.bold,
    color: Colors.teal,
  },
  languageCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.stroke,
    marginHorizontal: Spacing.md,
  },
});

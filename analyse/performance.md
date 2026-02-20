Performance
Rapport d'analyse
605 problèmes
322

Potentially unwaited promise
38x
floating-promise

This async function is not awaited - errors will be ignored
updateSettings({ weightReminderEnabled: false });

app/settings/notifications.tsx:206
updateEntry(editEntry.id, { ...data, date: entryDate || e...

src/components/forms/AddEntryForm.tsx:528
patchHealthConnect(rootDir);

scripts/ci-build.js:239
export async function getBadgeCount(): Promise<number> {

src/services/notifications/index.ts:481
updateSettings({ mealReminders: currentReminders });

app/settings/notifications.tsx:155
fetchGlobalLeaderboard();

app/social.tsx:438
updateSettings({ pollinationConnected: false });

app/settings/labs.tsx:134
updateSettings({ pollinationConnected: connected });

app/settings/labs.tsx:52
updateSettings({

app/settings/notifications.tsx:193
updateSettings({ pollinationConnected: true });

app/pollination-callback.tsx:44
export async function getProfile(userId: string): Promise...

src/services/supabase/social.ts:83
fetchFriendsLeaderboard();

app/social.tsx:439
updateSettings({ pollinationConnected: true });

app/settings/labs.tsx:72
updateSettings({ ploppyOnboardingShown: true });

src/components/ui/PloppyOnboardingModal.tsx:29
fetchGlobalLeaderboard(),

app/social.tsx:509
updateJsonFile(path.join(rootDir, VERSION_FILE), o => { o...

scripts/ci-build.js:284
export async function getMyProfile(): Promise<Profile | n...

src/services/supabase/social.ts:96
export async function updateProfile(updates: ProfileUpdat...

src/services/supabase/social.ts:102
fetchFriendsLeaderboard(),

app/social.tsx:510
updateEntry(editEntry.id, {

src/components/forms/AddEntryForm.tsx:401
id: record.metadata?.id || `hc-weight-${new Date(record.t...

src/services/healthConnect/index.ts:206
export async function getCurrentUser() {

src/services/supabase/social.ts:77
updateEntry(editEntry.id, {

src/components/forms/AddEntryForm.tsx:437
updateSettings({ ploppyEnabled: true });

src/components/ui/PloppyOnboardingModal.tsx:40
startTime.setDate(startTime.getDate() - daysBack);

src/services/healthConnect/index.ts:192
updateSettings({ mealReminders: currentReminders });

app/settings/notifications.tsx:123
fetchFriends(),

app/social.tsx:511
export async function getRecentWeights(daysBack: number =...

src/services/healthConnect/index.ts:183
updateEntry(editEntry.id, {

src/components/forms/AddEntryForm.tsx:469
updateSettings({ ploppyEnabled: true });

src/components/sheets/PloppySettingsSheet.tsx:59
updateSettings({ ploppyEnabled: false, pollinationConnect...

src/components/sheets/PloppySettingsSheet.tsx:106
async function getHealthConnectModule() {

src/services/healthConnect/index.ts:12
export async function getProductByBarcode(barcode: string...

src/services/openfoodfacts/index.ts:98
updateEntry(editEntry.id, {

src/components/forms/AddEntryForm.tsx:493
.update(updates)

src/services/supabase/social.ts:109
updateSettings({ mealReminders: currentReminders });

app/settings/notifications.tsx:139
updateSettings({ ploppyEnabled: true, pollinationConnecte...

src/components/sheets/PloppySettingsSheet.tsx:77
export async function getRecentBodyFat(daysBack: number =...

src/services/healthConnect/index.ts:226

Array lookup in loop
12x
inefficient-collection-ops

Using .includes()/.indexOf()/.find() in a loop is O(n²)
(e.name?.toLowerCase().includes(exercise.name.toLowerCase...

app/progress.tsx:456
{selectedCategories.includes(option.value) && (

src/components/ui/ExportModal.tsx:236
if (error.message?.includes('FIS_AUTH_ERROR') && attempt ...

src/services/notifications/index.ts:134
trackingFields.includes(id) && { color }

app/settings/sports.tsx:373
selectedCategories.includes(option.value) && styles.categ...

src/components/ui/ExportModal.tsx:232
selectedCategories.includes(option.value) && styles.categ...

src/components/ui/ExportModal.tsx:225
distanceKm: sportConfig?.trackingFields.includes('distanc...

app/health-connect.tsx:620
const sportConfig = sportsConfig.find(s => s.id === worko...

app/health-connect.tsx:615
trackingFields.includes(id) && {

app/settings/sports.tsx:360
const matchingBodyFat = rawBodyFat.find(bf => {

app/health-connect.tsx:512
color={trackingFields.includes(id) ? color : Colors.muted}

app/settings/sports.tsx:369
e.exercises.toLowerCase().includes(`${exercise.id.toLower...

app/progress.tsx:455

Code inatteignable
199x
unreachable-code

Ce code ne sera jamais execute
};

app/index.tsx:53
connected: true,

src/services/pollination/index.ts:111
<View style={[styles.container, containerStyle]}>

src/components/ui/InputField.tsx:28
playRepSound,

src/components/rep-counter/useRepCounterSounds.ts:65
<View style={[styles.scoreBadge, { backgroundColor: getNu...

app/barcode-scanner.tsx:142
}, [t]);

src/components/rep-counter/useEllipticalCalibration.ts:53
if (subscriptionRef.current) {

src/components/rep-counter/useSensorDetection.ts:114
} catch (error) {

src/services/pollination/index.ts:108
<SafeAreaView style={styles.container} edges={['top']}>

app/settings/legal.tsx:61
<Animated.View entering={FadeIn.delay(delay)}>

app/settings/developer.tsx:81
<Animated.View entering={FadeInDown.delay(delay).springif...

app/settings/notifications.tsx:46
calibrationPhase,

src/components/rep-counter/useEllipticalCalibration.ts:213
roundedTime,

src/services/sessionRecovery.ts:148
<TouchableOpacity

src/components/ui/Button.tsx:98
<SafeAreaView style={styles.container} edges={['top']}>

app/barcode-scanner.tsx:174
<SafeAreaView style={styles.container}>

src/components/ErrorBoundary.tsx:81
km: e.distanceKm.toString(),

src/components/forms/AddEntryForm.tsx:175
},

src/storage/mmkv.ts:80
success: true,

src/services/imageUpload/index.ts:127
<>

app/workout.tsx:158
} catch (error) {

src/services/openfoodfacts/index.ts:169
<Modal

src/components/ui/CustomAlertModal.tsx:101
<Animated.View entering={FadeInDown.delay(delay).springif...

app/settings/data.tsx:56
};

src/services/sessionRecovery.ts:174
},

src/stores/appStore.ts:470
<Animated.View

app/health-connect.tsx:196
<SafeAreaView style={styles.container} edges={['top']}>

app/settings/data.tsx:235
<View style={{ width: size, height: size, justifyContent:...

app/gamification.tsx:53
<SafeAreaView style={styles.container} edges={['top']}>

app/settings/labs.tsx:142
<TrueSheet

src/components/sheets/PloppySettingsSheet.tsx:121
} catch (error) {

src/services/pollination/index.ts:48
};

app/health-connect.tsx:177
<View style={{ width: size, height: size, justifyContent:...

app/rep-counter.tsx:222
<View style={styles.container}>

src/components/ui/SegmentedControl.tsx:21
}, [entry, t]);

src/components/ui/WorkoutCard.tsx:81
<TouchableOpacity onPress={onPress} activeOpacity={0.8}>

src/components/ui/WorkoutCard.tsx:87
<SafeAreaView style={styles.container} edges={['top']}>

app/terms-of-service.tsx:97
<SafeAreaView style={styles.container} edges={['top', 'bo...

app/pollination-callback.tsx:73
exportedAt: new Date().toISOString(),

src/components/ui/ExportModal.tsx:134
icon: XCircle,

src/components/ui/CustomAlertModal.tsx:59
<Modal

src/components/ui/SessionRecoveryModal.tsx:46
<Animated.View key={num} entering={FadeInDown.delay(300 +...

app/onboarding.tsx:313
} else if (frequency === 'weekly') {

app/settings/notifications.tsx:250
<View style={styles.details}>

src/components/ui/EntryDetailModal.tsx:57
<Container

src/components/ui/DayBadge.tsx:27
};

src/i18n/index.ts:62
clearAllIntervals();

src/components/rep-counter/useEllipticalCalibration.ts:208
startSensorTracking,

src/components/rep-counter/useSensorDetection.ts:121
<SafeAreaView style={styles.container} edges={['top']}>

app/settings/index.tsx:177
<Animated.View key={option.key} entering={FadeInDown.dela...

app/onboarding.tsx:246
<ErrorBoundary>

app/_layout.tsx:174
<Modal

src/components/ui/HealthConnectPromptModal.tsx:39
<TrueSheet

app/settings/sports.tsx:242
<GlassCard style={styles.requestItem}>

app/social.tsx:182
<View style={styles.bulletRow}>

app/terms-of-service.tsx:78
};

app/enhanced-meal.tsx:96
icon: AlertTriangle,

src/components/ui/CustomAlertModal.tsx:65
<TouchableOpacity

src/components/ui/Button.tsx:67
<Animated.View entering={FadeInDown.delay(200).springify(...

src/components/rep-counter/ExerciseSelector.tsx:26
<Animated.View entering={FadeInDown.delay(100).springify()}>

app/settings/index.tsx:107
<TouchableOpacity

app/workout.tsx:98
},

plugins/withMediaPipeModel.js:69
<Animated.View entering={FadeInDown.delay(delay).springif...

app/settings/social.tsx:52
};

src/components/forms/AddEntryForm.tsx:169
icon: <Text style={{ fontSize: 20 }}>{sportConfig.emoji}<...

app/workout.tsx:84
presets: ['babel-preset-expo'],

babel.config.js:4
id: record.metadata?.id || `hc-weight-${new Date(record.t...

src/services/healthConnect/index.ts:206
} catch (error) {

src/services/healthConnect/index.ts:167
start: lastWeekStart,

src/components/ui/ExportModal.tsx:90
} catch (error: any) {

src/services/notifications/index.ts:17
<TouchableOpacity

app/health-connect.tsx:126
<SafeAreaView style={styles.container} edges={['top']}>

app/settings/appearance.tsx:60
<Animated.View entering={FadeInDown.delay(100).springify()}>

app/progress.tsx:70
<Stack

app/settings/_layout.tsx:10
} catch (error) {

src/services/sessionRecovery.ts:124
} else {

app/settings/notifications.tsx:253
<Animated.View

app/gamification.tsx:113
};

app/gamification.tsx:174
<>

src/components/ui/BadgeWithProgress.tsx:28
<Animated.View entering={FadeInDown.delay(delay).springif...

app/settings/preferences.tsx:51
};

app/profile.tsx:53
<Animated.View

app/settings/sports.tsx:121
<View style={[

src/components/ui/GlassCard.tsx:17
<SafeAreaView style={styles.container} edges={['top']}>

app/tools.tsx:87
<SafeAreaView style={styles.container} edges={['top']}>

app/settings/social.tsx:133
},

src/stores/appStore.ts:405
}, [current, goal, size, strokeWidth]);

src/components/ui/ProgressRing.tsx:32
<SafeAreaView style={styles.container} edges={['top']}>

app/settings/sports.tsx:436
}, [entries, selectedPeriod, selectedCategories, dateRang...

src/components/ui/ExportModal.tsx:122
<Animated.View entering={FadeInDown.delay(delay).springif...

app/settings/appearance.tsx:40
weekday: 'long',

src/components/ui/EntryDetailModal.tsx:43
};

app/index.tsx:45
<SafeAreaView style={styles.container} edges={['top']}>

app/settings/developer.tsx:167
} catch (error) {

src/services/imageUpload/index.ts:168
<Animated.View entering={FadeInDown.delay(delay).springif...

app/settings/developer.tsx:58
<SafeAreaView style={styles.container} edges={['top']}>

app/profile.tsx:107
},

src/storage/mmkv.ts:54
<TouchableOpacity

app/social.tsx:77
<Animated.View entering={FadeIn.delay(delay)}>

app/settings/index.tsx:93
<SafeAreaView style={styles.container} edges={['top']}>

app/index.tsx:164
<View style={[styles.container, { paddingBottom: insets.b...

src/components/ui/TabBar.tsx:107
<Circle

src/components/ui/PoseCameraView.tsx:290
};

src/services/pollination/index.ts:65
<SafeAreaView style={styles.container} edges={['top']}>

app/settings/notifications.tsx:302
<View style={[styles.scoreBadge, { backgroundColor: getEc...

app/barcode-scanner.tsx:164
<View style={styles.progressContainer}>

app/onboarding.tsx:60
};

src/components/ui/PoseCameraView.tsx:254
'android',

plugins/withMediaPipeModel.js:22
<View style={[

src/components/ui/BadgeDisplay.tsx:19
available: status === hc.SdkAvailabilityStatus.SDK_AVAILA...

src/services/healthConnect/index.ts:128
<Animated.View entering={FadeIn} style={styles.container}>

src/components/rep-counter/PositionScreen.tsx:55
};

src/constants/values.ts:21
<TouchableOpacity

src/components/ui/Button.tsx:81
}, [step, workoutSaved])

app/rep-counter.tsx:547
<>

app/workout.tsx:186
<Animated.View entering={FadeInDown.delay(delay).springif...

app/terms-of-service.tsx:49
entry => !blockedIds.includes(entry.id)

src/services/supabase/social.ts:256
};

app/rep-counter.tsx:543
<Animated.View

app/gamification.tsx:180
};

app/enhanced-meal.tsx:122
success: false,

src/services/imageUpload/index.ts:171
<Animated.View entering={FadeInDown.delay(delay).springif...

app/settings/index.tsx:66
},

src/stores/appStore.ts:504
id: record.metadata?.id || `hc-bodyfat-${new Date(record....

src/services/healthConnect/index.ts:249
},

src/storage/mmkv.ts:73
id: nanoid(),

src/components/forms/AddEntryForm.tsx:147
icon: CheckCircle,

src/components/ui/CustomAlertModal.tsx:53
<Animated.View entering={FadeInDown.delay(delay).springif...

app/settings/legal.tsx:38
<Modal

src/components/ui/ExportModal.tsx:168
<Animated.View entering={FadeIn.delay(delay)}>

app/settings/data.tsx:80
<SafeAreaView style={styles.container} edges={['top']}>

app/settings/language.tsx:32
<View style={styles.bulletRow}>

app/privacy-policy.tsx:55
<View style={[styles.container, { width: size, height: si...

src/components/ui/ProgressRing.tsx:35
<View style={styles.details}>

src/components/ui/EntryDetailModal.tsx:83
<>

app/workout.tsx:131
},

src/stores/appStore.ts:421
<Animated.View entering={FadeInDown.delay(200).springify(...

app/rep-counter.tsx:269
};

app/auth.tsx:63
};

src/i18n/index.ts:33
<TouchableOpacity onPress={onPress} activeOpacity={0.8}>

src/components/ui/MonthCard.tsx:33
<Pressable

src/components/ui/TabBar.tsx:68
<Line

src/components/ui/PoseCameraView.tsx:270
success: false,

src/services/imageUpload/index.ts:133
<View style={styles.container}>

app/onboarding.tsx:158
clearTimeout(timer);

app/index.tsx:92
} catch (error: any) {

src/services/notifications/index.ts:129
<View style={[styles.scoreBadge, { backgroundColor: getNo...

app/barcode-scanner.tsx:153
const match = line.match(/^([^:]+):\s*(\d+)x(.+)$/);

src/components/forms/AddEntryForm.tsx:144
},

src/stores/appStore.ts:508
} catch (error) {

src/services/healthConnect/index.ts:145
<Animated.View key={option.key} entering={FadeInRight.del...

app/onboarding.tsx:274
<SafeAreaView style={styles.container} edges={['top']}>

app/settings/preferences.tsx:101
<View style={[styles.container, { paddingBottom: insets.b...

app/_layout.tsx:116
<Animated.View entering={FadeInDown.delay(delay).springif...

app/privacy-policy.tsx:37
<View style={styles.tabContainer}>

app/social.tsx:72
icon: Info,

src/components/ui/CustomAlertModal.tsx:72
<TrueSheet

src/components/sheets/AddEntryBottomSheet.tsx:75
<Animated.View entering={FadeInDown.delay(300).springify()}>

app/progress.tsx:127
<Pressable onPressIn={handlePressIn} onPressOut={handlePr...

app/enhanced-meal.tsx:180
<TabItem

src/components/ui/TabBar.tsx:136
<SafeAreaView style={styles.container} edges={['top']}>

app/profile.tsx:116
<Animated.View entering={FadeInDown.delay(delay).springif...

app/progress.tsx:54
}, [sportEntries, weekDays]);

app/index.tsx:133
};

app/health-connect.tsx:188
},

src/storage/mmkv.ts:40
};

app/enhanced-meal.tsx:105
<View style={styles.container}>

src/components/ui/EmptyState.tsx:17
start: weekStart,

src/components/ui/ExportModal.tsx:84
<View style={styles.details}>

src/components/ui/EntryDetailModal.tsx:164
barcode,

src/services/openfoodfacts/index.ts:181
<TouchableOpacity

app/health-connect.tsx:102
subscription.remove();

app/settings/labs.tsx:96
<Pressable onPress={onPress} style={styles.tabItem}>

app/_layout.tsx:65
};

app/auth.tsx:58
<Animated.View entering={FadeIn} style={styles.positionCo...

app/rep-counter.tsx:335
<View style={[styles.container, style]}>

src/components/ui/PoseCameraView.tsx:308
name: e.name || '',

src/components/forms/AddEntryForm.tsx:162
<Animated.View entering={FadeInDown.delay(rank * 50).spri...

app/social.tsx:119
<View style={[styles.container, containerStyle]}>

src/components/ui/InputField.tsx:53
}, [entry, sportsConfig, t]);

src/components/ui/WorkoutCard.tsx:49
};

app/social.tsx:116
<Modal

src/components/ui/PloppyOnboardingModal.tsx:66
<EmptyState

app/progress.tsx:186
<View style={{ width: size, height: size, justifyContent:...

src/components/rep-counter/ProgressRing.tsx:26
connected: true,

src/services/pollination/index.ts:101
},

src/storage/mmkv.ts:86
<SafeAreaView style={styles.container} edges={['top']}>

app/auth.tsx:125
f.requester.id === user.id ? f.addressee : f.requester

src/services/supabase/social.ts:367
opacity: opacity.value,

src/components/ui/TabBar.tsx:61
<TouchableOpacity

src/components/ui/Button.tsx:42
<SafeAreaView style={styles.container} edges={['top']}>

app/barcode-scanner.tsx:193
};

app/enhanced-meal.tsx:114
<View style={styles.details}>

src/components/ui/EntryDetailModal.tsx:128
<Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${widt...

src/components/ui/PoseCameraView.tsx:257
<SafeAreaView style={styles.container} edges={['top']}>

app/privacy-policy.tsx:66
<TrueSheet

src/components/sheets/HealthConnectSettingsSheet.tsx:106
strokeDashoffset: offset,

app/gamification.tsx:48
<View style={styles.container}>

src/components/ui/SectionHeader.tsx:25
<View

app/progress.tsx:156

Import non utilise
74x
unused-imports

L'import "React" n'est pas utilise dans ce fichier
import React from 'react';

src/components/ui/InputField.tsx:5
import { Colors, Spacing, FontSize, FontWeight, BorderRad...

app/settings/language.tsx:19
import React from 'react';

src/components/rep-counter/ExerciseSelector.tsx:5
import React from 'react';

src/components/ui/EmptyState.tsx:5
import React, { useState, useCallback, useEffect, useMemo...

app/social.tsx:5
import React from 'react';

src/components/ui/BadgeDisplay.tsx:5
import Animated, {

app/onboarding.tsx:22
import Animated, {

app/enhanced-meal.tsx:21
import React, { useState, useCallback } from 'react';

app/tools.tsx:5
import React from 'react';

src/components/ui/SegmentedControl.tsx:5
import { useAppStore, useGamificationStore } from '../src...

app/health-connect.tsx:47
import { calculateQuestTotals, calculateXpForEntry } from...

app/health-connect.tsx:51
import { useGamificationStore, calculateQuestTotals } fro...

src/stores/appStore.ts:30
import { Colors, FontSize, FontWeight, Spacing } from '.....

src/components/ui/SectionHeader.tsx:7
import React, { useState } from 'react';

app/auth.tsx:5
import { Sparkles, Shield, Clock, Check, X } from 'lucide...

src/components/ui/PloppyOnboardingModal.tsx:10
import { Stack, usePathname, useRouter, useRootNavigation...

app/_layout.tsx:1
import React from 'react';

src/components/ui/Button.tsx:5
import React, { useState, useCallback } from 'react';

app/settings/language.tsx:5
import {

app/rep-counter.tsx:67
import {

app/rep-counter.tsx:45
import React, { useEffect, useState } from 'react';

app/pollination-callback.tsx:6
import { serviceLogger, errorLogger } from '../../utils/l...

src/services/supabase/social.ts:14
import { View, Text, StyleSheet, TouchableOpacity, Switch...

src/components/sheets/PloppySettingsSheet.tsx:6
import { GlassCard, Button } from '../../src/components/ui';

app/settings/sports.tsx:43
import { Colors, FontSize, FontWeight, Spacing, BorderRad...

src/components/ui/MonthCard.tsx:9
import React, { useState, useEffect, useCallback } from '...

app/settings/labs.tsx:5
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'rea...

src/components/ui/SessionRecoveryModal.tsx:16
import React from 'react';

src/components/ui/SectionHeader.tsx:5
import { Users, Trophy, Sparkles, CheckCircle2 } from 'lu...

app/onboarding.tsx:34
import {

app/index.tsx:20
import React from 'react';

src/components/ui/EntryDetailModal.tsx:5
import React from 'react';

src/components/ui/PloppyOnboardingModal.tsx:5
import React, { useMemo } from 'react';

src/components/ui/TabBar.tsx:1
import React, { useState, useEffect } from 'react';

app/profile.tsx:5
import { AlertTriangle, RefreshCw, Home } from 'lucide-re...

src/components/ErrorBoundary.tsx:8
import { InputField, TextArea, Button, SegmentedControl, ...

src/components/forms/AddEntryForm.tsx:24
import { useAppStore, useGamificationStore } from '../src...

app/rep-counter.tsx:64
import Animated, {

app/rep-counter.tsx:29
import {

app/settings/data.tsx:21
import {

src/stores/appStore.ts:32
import { X, Check, Calendar, FileJson, Download } from 'l...

src/components/ui/ExportModal.tsx:18
import { useAppStore, useGamificationStore, useSportsConf...

src/components/forms/AddEntryForm.tsx:25
import { Colors, Spacing, FontSize, FontWeight, BorderRad...

app/settings/data.tsx:33
import React from 'react';

src/components/ui/MonthCard.tsx:5
import { Colors, FontSize, FontWeight, Spacing, BorderRad...

src/components/ui/WorkoutCard.tsx:10
import {

app/tools.tsx:9
import Animated, { FadeInDown, FadeIn, Layout } from 'rea...

app/health-connect.tsx:21
import {

app/profile.tsx:18
import React, { useState, useCallback, useMemo } from 're...

src/components/forms/AddEntryForm.tsx:5
import React from 'react';

src/components/ui/HealthConnectPromptModal.tsx:5
import Animated, {

src/components/ui/TabBar.tsx:5
import { Settings, Sparkles, ExternalLink, Trash2, Info, ...

src/components/sheets/PloppySettingsSheet.tsx:9
import { View, StyleSheet, Platform, Pressable } from 're...

src/components/ui/TabBar.tsx:2
import { LinearGradient } from 'expo-linear-gradient';

app/barcode-scanner.tsx:21
import React, { useState, useCallback, useRef, forwardRef...

src/components/sheets/AddEntryBottomSheet.tsx:6
import { getTodayDateString, formatDisplayDate } from '.....

app/enhanced-meal.tsx:67
import {

app/rep-counter.tsx:7
import {

app/barcode-scanner.tsx:40
import {

app/settings/labs.tsx:21
import {

app/onboarding.tsx:6
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'rea...

src/components/ui/HealthConnectPromptModal.tsx:15
import React, { useState, useMemo, useCallback } from 're...

src/components/ui/ExportModal.tsx:6
import { Colors, Spacing, FontSize, FontWeight, BorderRad...

src/components/sheets/AddEntryBottomSheet.tsx:19
import React, { useState, useCallback, useMemo, useRef, u...

app/index.tsx:5
import React, { useEffect } from 'react';

src/components/rep-counter/PositionScreen.tsx:5
import {

app/health-connect.tsx:23
import { RotateCcw, X, Play } from 'lucide-react-native';

src/components/ui/SessionRecoveryModal.tsx:17
import React, { useEffect } from 'react';

app/_layout.tsx:2
import {

app/settings/labs.tsx:6
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInD...

app/barcode-scanner.tsx:20
import React, { useState } from 'react';

src/components/ui/BadgeWithProgress.tsx:5
import React, { useState, useCallback, useRef } from 'rea...

app/onboarding.tsx:5
import { View, Text, StyleSheet, Modal, TouchableOpacity,...

src/components/ui/PloppyOnboardingModal.tsx:6

Excessive 'any' type usage
3x
any-type

6 uses of 'any' type detected
request: any;

app/social.tsx:176
let _notificationsModule: any | null = null;

src/services/notifications/index.ts:11
const onDateChange = useCallback((event: any, selectedDat...

src/components/forms/AddEntryForm.tsx:256

Missing key prop in React list
45x
react-missing-key

map() with JSX - can cause rendering bugs
{visibleSports.map((sport: SportConfig) => (

src/components/forms/AddEntryForm.tsx:751
{EXERCISES.map((exercise, index) => (

src/components/rep-counter/ExerciseSelector.tsx:27
{entry.suggestions.map((s, i) => (

src/components/ui/EntryDetailModal.tsx:178
{visibleScreens.map((config) => (

app/_layout.tsx:127
{features.map((feature, index) => (

src/components/ui/PloppyOnboardingModal.tsx:107
{weekDays.map((day) => (

app/index.tsx:225
quests.map((quest, index) => (

app/gamification.tsx:430
{(Object.entries(LANGUAGES) as [LanguageCode, typeof LANGUAGES[LanguageCode]]...

app/settings/language.tsx:52
{defaultSports.map((sport: SportConfig, index: number) => (

app/settings/sports.tsx:481
{privacyPoints.map((point, index) => (

src/components/ui/PloppyOnboardingModal.tsx:121
{(Object.keys(mealTimeLabels) as MealTime[]).map((time) => (

src/components/forms/AddEntryForm.tsx:1105
{AVAILABLE_ICONS.map(({ name: iconName, icon: IconComp }) => (

app/settings/sports.tsx:315
recentHistory.map((item, index) => (

app/gamification.tsx:448
{AVAILABLE_EMOJIS.map((e) => (

app/settings/sports.tsx:295
{AVAILABLE_COLORS.map((c) => (

app/settings/sports.tsx:334
friends.map(friend => (

app/social.tsx:952
{weights.map((weight, index) => (

app/health-connect.tsx:829
{(settings.mealReminders || []).map((reminder, index) => (

app/settings/notifications.tsx:367
{TRACKING_FIELDS.map(({ id, labelKey, icon: FieldIcon }) => (

app/settings/sports.tsx:355
{EXERCISES.map((exercise, index) => (

app/rep-counter.tsx:270
{entry.exercises.split('\n').map((line, i) => (

src/components/ui/EntryDetailModal.tsx:274
{options.map((option) => (

src/components/sheets/HealthConnectSettingsSheet.tsx:122
.map(enc => (

app/social.tsx:1033
{personalRecords.map((pr) => (

app/progress.tsx:644
{analysis.suggestions.map((suggestion, index) => (

app/enhanced-meal.tsx:783
{pendingRequests.map(request => (

app/social.tsx:925
currentLeaderboard.map((entry, index) => (

app/social.tsx:836
{weekDayLabels.map((day, index) => (

app/settings/notifications.tsx:624
{workouts.map((workout, index) => (

app/health-connect.tsx:810
{weekDays.map((day, i) => (

app/progress.tsx:139
{entry.exercises.split('\n').map((line, i) => (

src/components/ui/EntryDetailModal.tsx:65
{points.map((p, i) => (

app/progress.tsx:313
{mealTimeOptions.map((option, index) => (

app/enhanced-meal.tsx:542
{(['daily', 'weekly', 'monthly'] as const).map((freq) => (

app/settings/notifications.tsx:597
{recentWorkouts.map((workout) => (

app/index.tsx:280
{measures.map((m, i) => (

src/components/ui/EntryDetailModal.tsx:202
{['🏠 Fait maison', '🥗 Healthy', '🍖 Protéiné'].map((tag) => (

app/enhanced-meal.tsx:663
{unreadEncouragements.map(enc => (

app/social.tsx:1007
{exercises.map((ex, index) => (

src/components/forms/AddEntryForm.tsx:944
{customSports.map((sport: SportConfig, index: number) => (

app/settings/sports.tsx:499
{categoryOptions.map((option) => (

src/components/ui/ExportModal.tsx:220
{options.map((option) => (

src/components/ui/SegmentedControl.tsx:22
{generatedWorkout.exercises.map((exercise, index) => (

app/tools.tsx:168
{searchResults.map(user => (

app/social.tsx:884
{periodOptions.map((option) => (

src/components/ui/ExportModal.tsx:192

Variable non utilisee
58x
unused-variables

La variable "getFriendshipId" est declaree mais jamais utilisee
const getFriendshipId = useCallback((friendId: string) => {

app/social.tsx:359
export const savePollinationApiKey = async (apiKey: strin...

src/services/pollination/index.ts:35
export const useEntries = () => useAppStore((state) => st...

src/stores/appStore.ts:576
export const AddEntryBottomSheet = forwardRef<AddEntryBot...

src/components/sheets/AddEntryBottomSheet.tsx:35
export const getCurrentLanguage = (): LanguageCode => {

src/i18n/index.ts:60
export const PloppySettingsSheet = forwardRef<PloppySetti...

src/components/sheets/PloppySettingsSheet.tsx:24
const totalRuns = sportEntries.filter(e => e.type === 'ru...

app/progress.tsx:379
export const formatSessionTime = (session: ActiveSession)...

src/services/sessionRecovery.ts:158
export const resetStartupCheck = () => {

src/services/healthConnectStartup.ts:18
export const useSportsConfig = () => useAppStore((state) ...

src/stores/appStore.ts:579
const completeMovingPhase = useCallback(() => {

app/rep-counter.tsx:1096
export const MAX_ENTRIES_BEFORE_ARCHIVE_WARNING = 5000;

src/constants/values.ts:40
export const storageHelpers = {

src/storage/mmkv.ts:67
export const getPollinationAccountInfo = async (): Promis...

src/services/pollination/index.ts:81
const animatedLevelStyle = useAnimatedStyle(() => ({

app/gamification.tsx:311
const SCREEN_WIDTH = Dimensions.get('window').width;

src/components/ui/PoseCameraView.tsx:44
export const checkHealthConnectOnStartup = async (): Prom...

src/services/healthConnectStartup.ts:30
export const extractApiKeyFromUrl = (url: string): string...

src/services/pollination/index.ts:157
export const useSettings = () => useAppStore((state) => s...

src/stores/appStore.ts:577
const monthlyStats = getMonthlyStats();

app/index.tsx:118
export const TabBar = ({ state, descriptors, navigation }...

src/components/ui/TabBar.tsx:95
const totalHomeWorkouts = sportEntries.filter(e => e.type...

app/progress.tsx:380
export const setHealthConnectModalCallback = (callback: (...

src/services/healthConnectStartup.ts:22
export const MIN_ENTRIES_TO_KEEP = 100;

src/constants/values.ts:46
export const isSportEntryType = (type: string): type is S...

src/constants/values.ts:19
export const navigateToHealthConnect = () => {

src/services/healthConnectStartup.ts:26
export const uploadBase64Image = async (base64Data: strin...

src/services/imageUpload/index.ts:142
const AnimatedText = Animated.createAnimatedComponent(Text);

app/gamification.tsx:33
export const ANIMATION_DURATION_FAST_MS = 150;

src/constants/values.ts:56
export const isPollinationConnected = async (): Promise<b...

src/services/pollination/index.ts:62
export const FontWeight = {

src/constants/theme.ts:78
export const FontSize = {

src/constants/theme.ts:67
const SKIP_OPTION = { type: 'skip' as const, label: 'comm...

app/health-connect.tsx:84
const completeStoppedPhase = useCallback(() => {

app/rep-counter.tsx:1100
const startPedalingPhase = useCallback(() => {

app/rep-counter.tsx:1008
export const ARCHIVE_THRESHOLD_DAYS = 365;

src/constants/values.ts:43
export const MAX_GAMIFICATION_HISTORY_ENTRIES = 50;

src/constants/values.ts:28
export const updateSessionData = (updates: Partial<Pick<A...

src/services/sessionRecovery.ts:60
export const ANIMATION_DURATION_MS = 250;

src/constants/values.ts:53
export const Colors = {

src/constants/theme.ts:6
export const startPollinationAuth = async (): Promise<voi...

src/services/pollination/index.ts:140
export const HealthConnectSettingsSheet = forwardRef<Heal...

src/components/sheets/HealthConnectSettingsSheet.tsx:48
export const Shadows = {

src/constants/theme.ts:86
const totalSelected = selectedCount + selectedWeightsCount;

app/health-connect.tsx:758
const toggleEllipticalManual = useCallback(() => {

app/rep-counter.tsx:1105
export const MAX_LEADERBOARD_RESULTS = 100;

src/constants/values.ts:34
export const MAX_RECENT_ENTRIES = 10;

src/constants/values.ts:31
export const stopSessionTracking = async (): Promise<void...

src/services/sessionRecovery.ts:73
export const getUnfinishedSession = async (): Promise<Act...

src/services/sessionRecovery.ts:103
export const MAX_HEALTH_CONNECT_WORKOUTS = 500;

src/constants/values.ts:37
export const removePollinationApiKey = async (): Promise<...

src/services/pollination/index.ts:54
export const useBadges = () => useAppStore((state) => sta...

src/stores/appStore.ts:578
const IconComponent = AVAILABLE_ICONS.find(i => i.name ==...

app/settings/sports.tsx:118
export const analyzeMealImage = async (imageUrl: string, ...

src/services/pollination/index.ts:209
export const startSessionTracking = (session: Omit<Active...

src/services/sessionRecovery.ts:32
export const isSocialAvailable = () => isSupabaseConfigur...

src/services/supabase/client.ts:37
export const BorderRadius = {

src/constants/theme.ts:58
export const Spacing = {

src/constants/theme.ts:48

Synchronous operation
12x
sync-file-ops

writeFileSync blocks the event loop
fs.writeFileSync(manifestPath, manifest, 'utf8');

scripts/patch-health-connect.js:69
fs.writeFileSync(destPath, Buffer.from(buffer));

plugins/withMediaPipeModel.js:16
fs.mkdirSync(assetsDir, { recursive: true });

plugins/withMediaPipeModel.js:36
let projectBuildGradle = fs.readFileSync(projectBuildGrad...

scripts/ci-build.js:62
let manifest = fs.readFileSync(manifestPath, 'utf8');

scripts/patch-health-connect.js:11
const content = fs.readFileSync(filePath, 'utf8');

scripts/ci-build.js:36
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

scripts/ci-build.js:144
let manifest = fs.readFileSync(manifestPath, 'utf8');

scripts/ci-build.js:104
if (fs.existsSync(patchPath)) {

plugins/withMediaPipeModel.js:51
if (!fs.existsSync(modelPath)) {

plugins/withMediaPipeModel.js:42
if (!fs.existsSync(assetsDir)) {

plugins/withMediaPipeModel.js:35
let appBuildGradle = fs.readFileSync(appBuildGradlePath, ...

scripts/ci-build.js:72

console.warn() detecte (AST)
17x
js-console-ast

console.warn() trouve - a retirer en production
console.warn(`Push token attempt ${attempt}/${maxRetries} failed:`, error.messag

src/services/notifications/index.ts:131
console.warn('[notifications] Module not available - cannot show encouragement n

src/services/notifications/index.ts:167
console.warn("   ⚠️ Keystore temp file not found. Signing might fail if not debu

scripts/ci-build.js:140
console.warn('[notifications] Module not available - skipping scheduleWeightRemi

src/services/notifications/index.ts:346
console.warn('  ⚠️  Could not find <application> to insert <queries>');

scripts/patch-health-connect.js:65
console.warn('[notifications] Module not available - skipping scheduleStreakRemi

src/services/notifications/index.ts:237
console.warn('[notifications] Module not available - skipping scheduleMealRemind

src/services/notifications/index.ts:285
console.warn('  ⚠️  Could not find </application> to insert rationale activity')

scripts/patch-health-connect.js:48
console.warn('[notifications] Failed to set notification handler:', error?.messa

src/services/notifications/index.ts:38
console.warn('Onboarding redirect failed:', err);

app/_layout.tsx:166
console.warn('Could not fetch distance for workout:', e);

src/services/healthConnectStartup.ts:113
console.warn('  ⚠️  Could not find MainActivity activity block to patch');

scripts/patch-health-connect.js:38
console.warn('[notifications] Module not available - cannot show friend accepted

src/services/notifications/index.ts:211
console.warn('[notifications] Module not available - skipping scheduleWeightRemi

src/services/notifications/index.ts:380
console.warn('[notifications] Module not available - skipping scheduleWeightRemi

src/services/notifications/index.ts:415
console.warn('[notifications] Module not available - cannot show friend request 

src/services/notifications/index.ts:189
console.warn('[Elliptical] Received invalid state object');

app/rep-counter.tsx:857

console.error() detecte (AST)
33x
js-console-ast

console.error() trouve - a retirer en production
console.error('[Pollination] Error removing API key:', error);

src/services/pollination/index.ts:58
console.error('[Pollination] Error getting account info:', error);

src/services/pollination/index.ts:109
console.error('[ImageUpload] Upload error:', error);

src/services/imageUpload/index.ts:131
console.error('[Pollination] API error:', response.status, errorText);

src/services/pollination/index.ts:263
console.error('[PoseCamera] Error processing pose results:', error);

src/components/ui/PoseCameraView.tsx:190
console.error('Backup error:', error);

app/settings/data.tsx:134
console.error('Restore error:', error);

app/settings/data.tsx:206
console.error('[Pollination] Error extracting API key:', error);

src/services/pollination/index.ts:169
console.error('Error loading workouts:', error);

app/health-connect.tsx:525
console.error('[Pollination] Error parsing response:', parseError);

src/services/pollination/index.ts:325
console.error('[PollinationCallback] Error:', error);

app/pollination-callback.tsx:60
console.error(`[withMediaPipeModel] Failed to download model:`, error.message);

plugins/withMediaPipeModel.js:47
console.error('Failed to get push token after retries:', lastError?.message);

src/services/notifications/index.ts:145
} catch(e) { console.error("❌ Prebuild failed"); process.exit(1); }

scripts/ci-build.js:235
console.error('Health Connect startup check error:', error);

src/services/healthConnectStartup.ts:135
console.error('[OpenFoodFacts] Error fetching product:', error);

src/services/openfoodfacts/index.ts:170
} catch(e) { console.error("❌ Gradle Build failed"); process.exit(1); }

scripts/ci-build.js:249
onError={(error) => console.error('[PoseCamera] Camera error:', error)}

src/components/ui/PoseCameraView.tsx:347
console.error('[Pollination] Error getting API key:', error);

src/services/pollination/index.ts:49
console.error('[OpenFoodFacts] API error:', response.status);

src/services/openfoodfacts/index.ts:112
console.error('[SessionRecovery] Error reading session:', error);

src/services/sessionRecovery.ts:125
console.error('[SessionRecovery] Error saving session:', error);

src/services/sessionRecovery.ts:96
console.error('[PoseCamera] Detection error:', error.message);

src/components/ui/PoseCameraView.tsx:195
console.error('Error fetching product:', error);

app/barcode-scanner.tsx:91
console.error('[EnhancedMeal] Analysis error:', error);

app/enhanced-meal.tsx:403
console.error('[ImageUpload] Upload failed:', response.status, errorText);

src/services/imageUpload/index.ts:105
console.error('Auth error:', error);

app/auth.tsx:117
console.error('Usage: node patch-health-connect.js <AndroidManifest.xml path>');

scripts/patch-health-connect.js:7
console.error('[ImageUpload] Base64 upload error:', error);

src/services/imageUpload/index.ts:169
console.error('[SessionRecovery] Error clearing session:', error);

src/services/sessionRecovery.ts:85
console.error(`[withMediaPipeModel] Failed to copy model from android-patches:`,

plugins/withMediaPipeModel.js:57
console.error("⚠️ No APK found in output folder.");

scripts/ci-build.js:268
console.error('Health Connect initialization error:', error);

app/health-connect.tsx:445

console.log() detecte (AST)
52x
js-console-ast

console.log() trouve - a retirer en production
console.log(`ℹ️ Using current package.json version: ${finalVersion}`);

scripts/ci-build.js:286
console.log('[ImageUpload] Uploading file:', fileName, 'MIME:', mimeType, 'Size:

src/services/imageUpload/index.ts:92
console.log('[Elliptical Manual] Started');

app/rep-counter.tsx:1111
console.log("📦 Running Expo Prebuild...");

scripts/ci-build.js:230
console.log(`[Plank] Utilisateur tombé après ${plankSeconds}s`);

app/rep-counter.tsx:845
console.log('Expo Push Token:', token.data);

src/services/notifications/index.ts:126
console.log(`[withMediaPipeModel] Downloading ${MODEL_NAME}...`);

plugins/withMediaPipeModel.js:43
console.log(`[withMediaPipeModel] Found local model at ${patchPath}. Copying to 

plugins/withMediaPipeModel.js:52
console.log(`[withMediaPipeModel] Please manually download from: ${MODEL_URL}`);

plugins/withMediaPipeModel.js:58
console.log('[ImageUpload] Upload response:', result);

src/services/imageUpload/index.ts:111
console.log(`\n🔨 -------------------------------------------`);

scripts/ci-build.js:221
console.log('[Pollination] Raw response:', content);

src/services/pollination/index.ts:275
console.log('  ✅ Added new <queries> block for Health Connect');

scripts/patch-health-connect.js:63
console.log('[Storage] ⚠️ MMKV not available, falling back to AsyncStorage:', er

src/storage/mmkv.ts:30
console.log('[RepCounter] Mode planche caméra: Détection de position activée');

app/rep-counter.tsx:1173
console.log('Notification permissions denied');

src/services/notifications/index.ts:82
console.log('[RepCounter] Mode capteur: accéléromètre activé');

app/rep-counter.tsx:1184
console.log("   🔑 Keystore injected into android/app.");

scripts/ci-build.js:138
console.log('[SessionRecovery] Session too old, discarded');

src/services/sessionRecovery.ts:118
console.log('expo-notifications module not available');

src/services/notifications/index.ts:62
console.log(`[withMediaPipeModel] ${MODEL_NAME} already exists`);

plugins/withMediaPipeModel.js:65
console.log(`🆙 Overriding version to: ${finalVersion}`);

scripts/ci-build.js:283
console.log(`🔨 -------------------------------------------`);

scripts/ci-build.js:223
console.log('[RepCounter] Mode vélo elliptique manuel: Toggle activé');

app/rep-counter.tsx:1166
console.log('[Pollination] Auth URL:', authUrl);

src/services/pollination/index.ts:147
console.log('  ✅ Added Health Connect package to existing <queries>');

scripts/patch-health-connect.js:57
console.log(`✅ Artifact ready: releases/${newName}`);

scripts/ci-build.js:265
console.log('  ✅ AndroidManifest.xml patched for Health Connect');

scripts/patch-health-connect.js:70
console.log('[Pollination] Analyzing meal image:', imageUrl);

src/services/pollination/index.ts:217
console.log('[ImageUpload] Upload successful:', directUrl);

src/services/imageUpload/index.ts:123
console.log('[RepCounter] Calibration terminée, baseline:', baselineZ.current.to

app/rep-counter.tsx:1202
console.log("   ✅ Manifest patched.");

scripts/ci-build.js:126
console.log(`[withMediaPipeModel] Copied ${MODEL_NAME} to assets`);

plugins/withMediaPipeModel.js:55
console.log("🚀 Compiling APK...");

scripts/ci-build.js:244
console.log(`[withMediaPipeModel] No local model at ${patchPath}. Please manuall

plugins/withMediaPipeModel.js:61
console.log(`🔨 BUILDING FLAVOR: ${flavorConfig.name} (${version})`);

scripts/ci-build.js:222
console.log('[OpenFoodFacts] Product not found');

src/services/openfoodfacts/index.ts:119
console.log('[SessionRecovery] Session cleared');

src/services/sessionRecovery.ts:83
console.log('  ✅ Added PermissionsRationaleActivity and activity-alias');

scripts/patch-health-connect.js:46
console.log(`🏥 Patching Health Connect...`);

scripts/ci-build.js:86
console.log(`[Elliptical Manual] Stopped after ${ellipticalSeconds}s`);

app/rep-counter.tsx:1114
console.log('[RepCounter] Mode vélo elliptique caméra: Détection de mouvement ac

app/rep-counter.tsx:1160
console.log('[ImageUpload] Uploading base64 image...');

src/services/imageUpload/index.ts:144
console.log('[RepCounter] Mode caméra: Détection automatique activée');

app/rep-counter.tsx:1179
console.log('[Plank] Utilisateur levé - timer démarré');

app/rep-counter.tsx:841
console.log('[OpenFoodFacts] Product found:', productInfo.name);

src/services/openfoodfacts/index.ts:167
console.log('[Pollination] Additional context:', additionalContext);

src/services/pollination/index.ts:219
console.log(`[Elliptical] User stopped after ${ellipticalSeconds}s`);

app/rep-counter.tsx:876
console.log('Push notifications require a physical device');

src/services/notifications/index.ts:68
console.log('[Elliptical] User started pedaling');

app/rep-counter.tsx:869
console.log('[SessionRecovery] Found unfinished session:', session.exerciseName)

src/services/sessionRecovery.ts:122
console.log('  ✅ Inserted intent-filter into MainActivity');

scripts/patch-health-connect.js:36

File too long
7x
file-too-long

This file has 1887 lines (threshold: 1000 lines)

app/social.tsx

app/rep-counter.tsx

app/health-connect.tsx

app/enhanced-meal.tsx

app/settings/notifications.tsx

src/components/forms/AddEntryForm.tsx

app/progress.tsx

Inline styles detected
5x
rn-inline-styles

3 inline styles - performance impact
style={{ flex: 1 }}

app/settings/sports.tsx:391
<Zap size={12} color={Colors.cta} style={{ marginLeft: 8 ...

app/social.tsx:138
style={{ marginBottom: Spacing.md }}

app/health-connect.tsx:199
<Pressable onPressIn={handlePressIn} onPressOut={handlePr...

app/enhanced-meal.tsx:180
<Text style={{ fontSize: 24 }}>👥</Text>

app/onboarding.tsx:351

Console.log detected
13x
console-logs

6 console.log/debug/info found - remove in production
console.log('  ℹ️  Health Connect already configured in m...

scripts/patch-health-connect.js:14
console.log('[OpenFoodFacts] Searching for barcode:', bar...

src/services/openfoodfacts/index.ts:100
console.log('[ImageUpload] Starting upload to tmpfiles.or...

src/services/imageUpload/index.ts:69
console.log('[Pollination] Starting auth with redirect:',...

src/services/pollination/index.ts:146
console.log(`[RepCounter] Plank state change: ${isInPlank...

app/rep-counter.tsx:792
console.log('[Labs] Deep link received:', event.url);

app/settings/labs.tsx:63
console.log('[PoseCamera] Camera ready');

src/components/ui/PoseCameraView.tsx:227
console.log('[Storage] ✅ Using MMKV (fast native storage)');

src/storage/mmkv.ts:25
console.log('Push notifications disabled in FOSS build');

src/services/notifications/index.ts:55
console.log('[SessionRecovery] Started tracking session:'...

src/services/sessionRecovery.ts:54
console.log('Push notification failed:', error);

src/services/supabase/social.ts:498
console.log(`[withMediaPipeModel] Downloaded ${MODEL_NAME...

plugins/withMediaPipeModel.js:17
console.log(`🔥 Patching Google Services...`);

scripts/ci-build.js:57

Empty catch block
13x
empty-catch

An empty catch block silently ignores errors
} catch (error) {

src/components/rep-counter/useRepCounterSounds.ts:41
} catch (error) {

src/components/rep-counter/useRepCounterSounds.ts:50
} catch (error) {

app/rep-counter.tsx:610
} catch (error) {

app/rep-counter.tsx:590
} catch (e) {

src/services/healthConnect/index.ts:313
try { await hc.initialize(); } catch (e) { }

src/services/healthConnect/index.ts:156
} catch (error) {

src/components/ui/PloppyOnboardingModal.tsx:41
} catch (error) {

src/components/rep-counter/useRepCounterSounds.ts:32
} catch (error) {

app/rep-counter.tsx:600
} catch (error) {

app/rep-counter.tsx:620
} catch (error) {

src/components/rep-counter/useRepCounterSounds.ts:59
} catch (error) {

app/rep-counter.tsx:630
} catch (error) {

src/components/rep-counter/useRepCounterSounds.ts:23

Await in loop
5x
no-await-in-loop

Sequential requests in a loop are slow
await NotificationService.scheduleMealReminder(i, current...

app/settings/notifications.tsx:151
const token = await Notifications.getExpoPushTokenAsync({

src/services/notifications/index.ts:121
await Notifications.cancelScheduledNotificationAsync(noti...

src/services/notifications/index.ts:315
await Notifications.cancelScheduledNotificationAsync(noti...

src/services/notifications/index.ts:267
const distanceMeters = await getDistanceForWorkoutInterna...

src/services/healthConnect/index.ts:309

Tests missing
missing-tests

No tests found for a project with 36 source files

Magic numbers detected
8x
magic-numbers

4 magic numbers detected (e.g., 85)
if (score >= 85) return ['#22c55e', '#16a34a'];

src/components/ui/EntryDetailModal.tsx:337
if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23...

app/settings/notifications.tsx:103
source={{ uri: 'https://cdn-icons-png.flaticon.com/512/74...

app/health-connect.tsx:796
expiry: '30', // 30 jours

src/services/pollination/index.ts:130
transform={`rotate(-90 ${size / 2} ${size / 2})`}

app/rep-counter.tsx:250
transform={`rotate(-90 ${size / 2} ${size / 2})`}

app/gamification.tsx:80
if (score >= 85) return '#22c55e';

app/enhanced-meal.tsx:91
addProgress('streak_30', streak.current, 30, `${streak.cu...

app/progress.tsx:421

Next.js Image missing alt attribute
5x
img-missing-alt

Next.js Image component must have an alt attribute
<Image

app/barcode-scanner.tsx:347
<Image

app/onboarding.tsx:205
<Image

app/barcode-scanner.tsx:271
<Image

app/enhanced-meal.tsx:578
<Image

app/health-connect.tsx:795

Nested ternaries
long-ternary

3 nested ternaries detected
? (selectedExercise.id === 'elliptical' ? ellipticalSecon...

app/rep-counter.tsx:671

Promise without catch
unhandled-promise

This promise has no error handler
ExpoLinking.getInitialURL().then((url) => {

app/settings/labs.tsx:88

String concatenation in loop
string-concat-in-loop

String concatenation inside a loop is inefficient
jsonContent += ']';

src/services/pollination/index.ts:304

Excessive console.error/warn
2x
console-error-warn

7 console.error/warn - use a logger
console.error('[Pollination] Error saving API key:', error);

src/services/pollination/index.ts:39
console.warn('[notifications] expo-notifications import f...

src/services/notifications/index.ts:18
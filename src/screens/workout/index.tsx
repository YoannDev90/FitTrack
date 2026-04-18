// ============================================================================
// WORKOUT SCREEN - Redesigned with premium dark aesthetic
// ============================================================================

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LegendList } from '@legendapp/list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Footprints,
  Gamepad2,
  UtensilsCrossed,
  Ruler,
  Filter,
  Calendar,
  Flame,
  Clock,
  TrendingUp,
  Trash2,
  Zap,
  Activity,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import {
  GlassCard,
  EmptyState,
} from '../../components/ui';
import { router } from 'expo-router';
import { AddEntryBottomSheet, AddEntryBottomSheetRef } from '../../components/sheets';
import { useAppStore, useSportsConfig } from '../../stores';
import { formatDisplayDate, getRelativeTime } from '../../utils/date';
import { Colors, ScreenPalettes } from '../../constants';
import type {
  Entry,
  HomeWorkoutEntry,
  RunEntry,
  MealEntry,
  MeasureEntry,
  BeatSaberEntry,
  CustomSportEntry,
  SportConfig,
} from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_HEIGHT = 160;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = ScreenPalettes.cool;

const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 44 };
const R = { sm: 6, md: 10, lg: 14, xl: 18, xxl: 22, xxxl: 32, full: 999 };
const T = {
  nano: 9, micro: 10, xs: 11, sm: 13, md: 15, lg: 17, xl: 20,
  xxl: 26, xxxl: 34, display: 48,
};
const W = {
  light: '300', reg: '400', med: '500',
  semi: '600', bold: '700', xbold: '800', black: '900',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterType = 'all' | 'home' | 'run' | 'beatsaber' | 'meal' | 'measure';

interface FilterOption {
  value: FilterType;
  label: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
}

const FILTER_DEFINITIONS = [
  { value: 'all',       icon: null,                                             color: C.ember,  glow: C.emberGlow  },
  { value: 'home',      icon: <Home      size={14} color={C.green}  />,        color: C.green,  glow: C.greenSoft  },
  { value: 'run',       icon: <Footprints size={14} color={C.blue}  />,        color: C.blue,   glow: C.blueSoft   },
  { value: 'beatsaber', icon: <Gamepad2  size={14} color={C.violet} />,        color: C.violet, glow: Colors.overlayViolet12 },
  { value: 'meal',      icon: <UtensilsCrossed size={14} color={C.gold}  />,   color: C.gold,   glow: C.goldSoft   },
  { value: 'measure',   icon: <Ruler     size={14} color={C.teal}  />,         color: C.teal,   glow: C.tealSoft   },
];

const getEntryStyle = (type: string, sportConfig?: SportConfig) => {
  switch (type) {
    case 'home':      return { icon: <Home size={18} color={C.green}  />, color: C.green,  bg: C.greenSoft,  border: C.greenBorder  };
    case 'run':       return { icon: <Footprints size={18} color={C.blue}  />, color: C.blue,   bg: C.blueSoft,  border: C.blueBorder   };
    case 'beatsaber': return { icon: <Gamepad2 size={18} color={C.violet} />, color: C.violet, bg: C.violetSoft, border: C.violetBorder };
    case 'meal':      return { icon: <UtensilsCrossed size={18} color={C.gold}  />, color: C.gold,   bg: C.goldSoft,  border: C.goldBorder   };
    case 'measure':   return { icon: <Ruler size={18} color={C.teal}  />, color: C.teal,   bg: C.tealSoft,  border: C.tealBorder   };
    case 'custom':
      if (sportConfig) {
        const color = sportConfig.color;
        return { icon: <Text style={{ fontSize: 16 }}>{sportConfig.emoji}</Text>, color, bg: `${color}15`, border: `${color}28` };
      }
      return { icon: <Flame size={18} color={C.ember} />, color: C.ember, bg: C.emberGlow, border: C.emberBorder };
    default:
      return { icon: <Flame size={18} color={C.ember} />, color: C.ember, bg: C.emberGlow, border: C.emberBorder };
  }
};

// ─── Stat Pill ────────────────────────────────────────────────────────────────
const StatPill = ({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) => (
  <View style={styles.statPill}>
    <View style={styles.statPillIcon}>{icon}</View>
    <View>
      <Text style={styles.statPillValue}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  </View>
);

// ─── FilterChip ───────────────────────────────────────────────────────────────
const FilterChip = React.memo(({
  option, isActive, onPress,
}: {
  option: FilterOption; isActive: boolean; onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[
      styles.filterChip,
      isActive && {
        backgroundColor: option.glow,
        borderColor: option.color + '55',
      },
    ]}
  >
    {option.icon && (
      <View style={[styles.filterChipIconWrap, isActive && { opacity: 1 }]}>
        {option.icon}
      </View>
    )}
    {!option.icon && isActive && (
      <Filter size={12} color={option.color} />
    )}
    {!option.icon && !isActive && (
      <Filter size={12} color={C.textMuted} />
    )}
    <Text style={[styles.filterChipText, isActive && { color: option.color }]}>
      {option.label}
    </Text>
  </TouchableOpacity>
));

// ─── EntryCard ────────────────────────────────────────────────────────────────
const EntryCard = React.memo(({
  entry, onDelete, onPress, index,
}: {
  entry: Entry; onDelete: () => void; onPress?: () => void; index: number;
}) => {
  const sportsConfig = useSportsConfig();
  const { t } = useTranslation();

  let sportConfig: SportConfig | undefined;
  if (entry.type === 'custom') {
    const customEntry = entry as CustomSportEntry;
    sportConfig = sportsConfig.find((s: SportConfig) => s.id === customEntry.sportId);
  }

  const entryStyle = getEntryStyle(entry.type, sportConfig);

  const renderContent = useCallback(() => {
    switch (entry.type) {
      case 'home': {
        const e = entry as HomeWorkoutEntry;
        return (
          <View style={styles.contentWrap}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {e.name || t('workout.defaultHomeName')}
            </Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{e.exercises}</Text>
            <View style={styles.tagsRow}>
              {e.absBlock && (
                <View style={[styles.badge, { backgroundColor: C.emberGlow, borderColor: C.emberBorder }]}>
                  <Flame size={10} color={C.ember} />
                  <Text style={[styles.badgeText, { color: C.emberMid }]}>{t('addEntry.absShort')}</Text>
                </View>
              )}
              {e.totalReps && (
                <View style={[styles.badge, { backgroundColor: C.greenSoft, borderColor: C.greenBorder }]}>
                  <TrendingUp size={10} color={C.green} />
                  <Text style={[styles.badgeText, { color: C.green }]}>{e.totalReps} {t('common.reps')}</Text>
                </View>
              )}
            </View>
          </View>
        );
      }
      case 'run': {
        const e = entry as RunEntry;
        return (
          <View style={styles.contentWrap}>
            <Text style={styles.cardTitle}>{e.distanceKm} <Text style={styles.cardUnit}>km</Text></Text>
            <View style={styles.cardStatsRow}>
              <StatChip icon={<Clock size={11} color={C.textMuted} />} value={`${e.durationMinutes} min`} />
              {e.avgSpeed != null && <StatChip icon={<TrendingUp size={11} color={C.textMuted} />} value={`${e.avgSpeed} km/h`} />}
              {e.bpmAvg != null && <StatChip icon={<Activity size={11} color={C.error} />} value={`${e.bpmAvg} bpm`} color={C.error} />}
            </View>
          </View>
        );
      }
      case 'beatsaber': {
        const e = entry as BeatSaberEntry;
        return (
          <View style={styles.contentWrap}>
            <Text style={styles.cardTitle}>Beat Saber</Text>
            <View style={styles.cardStatsRow}>
              <StatChip icon={<Clock size={11} color={C.textMuted} />} value={`${e.durationMinutes} min`} />
              {e.bpmAvg && <StatChip icon={<Activity size={11} color={C.error} />} value={`${e.bpmAvg} bpm`} color={C.error} />}
              {e.cardiacLoad !== undefined && <StatChip icon={<Zap size={11} color={C.violet} />} value={`${e.cardiacLoad}`} color={C.violet} />}
            </View>
          </View>
        );
      }
      case 'meal': {
        const e = entry as MealEntry;
        return (
          <View style={styles.contentWrap}>
            <Text style={styles.cardTitle} numberOfLines={1}>{e.mealName}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{e.description}</Text>
          </View>
        );
      }
      case 'measure': {
        const e = entry as MeasureEntry;
        return (
          <View style={styles.contentWrap}>
            <Text style={styles.cardTitle}>Mensurations</Text>
            <View style={styles.cardStatsRow}>
              {e.weight && <MeasureChip value={e.weight} unit="kg" />}
              {e.waist  && <MeasureChip value={e.waist}  unit="cm taille" />}
              {e.arm    && <MeasureChip value={e.arm}    unit="cm bras" />}
              {e.hips   && <MeasureChip value={e.hips}   unit="cm hanches" />}
            </View>
          </View>
        );
      }
      case 'custom': {
        const e = entry as CustomSportEntry;
        return (
          <View style={styles.contentWrap}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {e.name || sportConfig?.name || t('entries.custom')}
            </Text>
            <View style={styles.cardStatsRow}>
              {e.durationMinutes && <StatChip icon={<Clock size={11} color={C.textMuted} />} value={`${e.durationMinutes} min`} />}
              {e.distanceKm      && <StatChip icon={<TrendingUp size={11} color={C.textMuted} />} value={`${e.distanceKm} km`} />}
              {e.totalReps       && <StatChip icon={<TrendingUp size={11} color={C.textMuted} />} value={`${e.totalReps} reps`} />}
              {e.bpmAvg          && <StatChip icon={<Activity size={11} color={C.error} />} value={`${e.bpmAvg} bpm`} color={C.error} />}
              {e.calories        && <StatChip icon={<Flame size={11} color={C.gold} />} value={`${e.calories} kcal`} color={C.gold} />}
            </View>
          </View>
        );
      }
      default:
        return null;
    }
  }, [entry, sportConfig]);

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(350).springify()}>
      <TouchableOpacity onPress={onPress} onLongPress={onDelete} activeOpacity={0.85}>
        <View style={styles.card}>
          {/* Left accent bar */}
          <View style={[styles.accentBar, { backgroundColor: entryStyle.color }]} />

          <View style={styles.cardInner}>
            {/* Icon */}
            <View style={[styles.iconWrap, { backgroundColor: entryStyle.bg, borderColor: entryStyle.border }]}>
              {entryStyle.icon}
            </View>

            {/* Content */}
            <View style={styles.cardBody}>
              {renderContent()}

              {/* Footer */}
              <View style={styles.cardFooter}>
                <Calendar size={10} color={C.textMuted} />
                <Text style={styles.footerRelative}>{getRelativeTime(entry.createdAt)}</Text>
                <View style={styles.footerDot} />
                <Text style={styles.footerDate}>{formatDisplayDate(entry.date)}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={onDelete}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.deleteBtn}
              >
                <Trash2 size={14} color={C.textMuted} />
              </TouchableOpacity>
              <ChevronRight size={14} color={C.textMuted} style={{ marginTop: 'auto' }} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}, (prev, next) => prev.entry.id === next.entry.id && prev.index === next.index);

// ─── Mini Stat Chip ───────────────────────────────────────────────────────────
const StatChip = ({ icon, value, color }: { icon: React.ReactNode; value: string; color?: string }) => (
  <View style={styles.statChip}>
    {icon}
    <Text style={[styles.statChipText, color && { color }]}>{value}</Text>
  </View>
);

// ─── Measure Chip ─────────────────────────────────────────────────────────────
const MeasureChip = ({ value, unit }: { value: number; unit: string }) => (
  <View style={styles.measureChip}>
    <Text style={styles.measureChipValue}>{value}</Text>
    <Text style={styles.measureChipUnit}>{unit}</Text>
  </View>
);

// ─── WorkoutScreen ────────────────────────────────────────────────────────────
export default function WorkoutScreen() {
  const { entries, deleteEntry } = useAppStore();
  const { t } = useTranslation();
  const bottomSheetRef = useRef<AddEntryBottomSheetRef>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; entryId: string }>({ visible: false, entryId: '' });


  const filterOptions = useMemo<FilterOption[]>(() =>
    FILTER_DEFINITIONS.map(def => ({
      value: def.value as FilterType,
      label: t(`workout.filters.${def.value}`),
      icon: def.icon,
      color: def.color,
      glow: def.glow,
    })),
  [t]);

  const filteredEntries = useMemo(() => {
    const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter);
    return [...filtered].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [entries, filter]);

  const listKey = useMemo(() =>
    entries.map(e => `${e.id}-${e.createdAt}`).join(',').slice(0, 100),
  [entries]);

  const quickStats = useMemo(() => {
    const sportEntries = entries.filter(e => ['home', 'run', 'beatsaber'].includes(e.type));
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = entries.filter(e => e.date === today);
    return { total: entries.length, sport: sportEntries.length, today: todayEntries.length };
  }, [entries]);

  const handleDeleteEntry = useCallback((entryId: string) => {
    deleteEntry(entryId);
  }, [deleteEntry]);

  const handleDelete = useCallback((entry: Entry) => {
    setDeleteModal({ visible: true, entryId: entry.id });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteModal.entryId) handleDeleteEntry(deleteModal.entryId);
    setDeleteModal({ visible: false, entryId: '' });
  }, [deleteModal.entryId, handleDeleteEntry]);

  const handleEntryPress = useCallback((entry: Entry) => {
    router.push(`/workout/${entry.id}`);
  }, []);

  const handleOpenAddSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  const renderItem = useCallback(({ item, index }: { item: Entry; index: number }) => (
    <EntryCard
      entry={item}
      index={index}
      onPress={() => handleEntryPress(item)}
      onDelete={() => handleDelete(item)}
    />
  ), [handleDelete, handleEntryPress]);

  const keyExtractor = useCallback((item: Entry) => item.id, []);

  const renderFilterItem = useCallback(({ item }: { item: FilterOption }) => (
    <FilterChip
      option={item}
      isActive={filter === item.value}
      onPress={() => setFilter(item.value)}
    />
  ), [filter]);

  const filterKeyExtractor = useCallback((item: FilterOption) => item.value, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background radial glow */}
      <LinearGradient
        colors={[Colors.overlayEmber06, Colors.transparent]}
        style={styles.bgGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.6 }}
      />

      {/* ── Header ── */}
      <Animated.View entering={FadeIn.delay(80)} style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.eyebrow}>{t('workout.historyTitle').toUpperCase()}</Text>
            <Text style={styles.screenTitle}>Journal</Text>
          </View>
          <TouchableOpacity
            style={styles.addEntryBtn}
            onPress={handleOpenAddSheet}
            activeOpacity={0.8}
            accessibilityLabel={t('addEntry.title', 'Ajouter une entree')}
          >
            <Plus size={20} color={C.ember} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Quick stats */}
        <Animated.View entering={FadeInRight.delay(200)} style={styles.statsRow}>
          <StatPill
            icon={<Zap size={13} color={C.ember} />}
            value={quickStats.total}
            label={t('workout.filters.all')}
          />
          <View style={styles.statsDivider} />
          <StatPill
            icon={<Activity size={13} color={C.green} />}
            value={quickStats.sport}
            label={t('workout.stats.sport')}
          />
          <View style={styles.statsDivider} />
          <StatPill
            icon={<Calendar size={13} color={C.blue} />}
            value={quickStats.today}
            label={t('workout.stats.today')}
          />
        </Animated.View>
      </Animated.View>

      {/* ── Filters ── */}
      <Animated.View entering={FadeIn.delay(160)} style={styles.filterSection}>
        <FlatList
          horizontal
          data={filterOptions}
          keyExtractor={filterKeyExtractor}
          renderItem={renderFilterItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </Animated.View>

      {/* ── Separator ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>
          {t('workout.entriesCount', { count: filteredEntries.length })}
        </Text>
      </View>

      {/* ── List ── */}
      <LegendList
        key={listKey}
        data={filteredEntries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={ITEM_HEIGHT}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        recycleItems
        extraData={listKey}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Flame size={28} color={C.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>{t('workout.noEntriesTitle')}</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' ? t('workout.noEntriesAll') : t('workout.noEntriesType')}
            </Text>
          </View>
        }
      />

      <AddEntryBottomSheet ref={bottomSheetRef} />

      {/* Delete confirm modal */}
      {deleteModal.visible && (
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeIn.duration(200)} style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('entries.deleteConfirm.title')}</Text>
            <Text style={styles.modalMessage}>{t('entries.deleteConfirm.message')}</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setDeleteModal({ visible: false, entryId: '' })} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete} style={styles.modalConfirmBtn}>
                <Text style={styles.modalConfirmText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  bgGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },

  // Header
  header: {
    paddingHorizontal: S.lg,
    paddingTop: S.lg,
    paddingBottom: S.xl,
    gap: S.xl,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: S.md,
  },
  eyebrow: {
    fontSize: T.xs,
    fontWeight: W.semi,
    color: C.ember,
    letterSpacing: 2.5,
    marginBottom: S.xs,
  },
  screenTitle: {
    fontSize: T.display,
    fontWeight: W.black,
    color: C.text,
    letterSpacing: -2,
    lineHeight: T.display * 1.1,
  },
  addEntryBtn: {
    width: 44,
    height: 44,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.emberBorder,
    backgroundColor: C.emberGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: S.xs,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: R.xxl,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  statPillIcon: {
    width: 28,
    height: 28,
    borderRadius: R.md,
    backgroundColor: C.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statPillValue: {
    fontSize: T.lg,
    fontWeight: W.bold,
    color: C.text,
    lineHeight: T.lg * 1.2,
  },
  statPillLabel: {
    fontSize: T.xs,
    fontWeight: W.med,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsDivider: {
    width: 1,
    height: 28,
    backgroundColor: C.border,
    marginHorizontal: S.sm,
  },

  // Filters
  filterSection: {
    marginBottom: S.sm,
  },
  filterList: {
    paddingHorizontal: S.lg,
    gap: S.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs + 2,
    paddingVertical: S.sm - 1,
    paddingHorizontal: S.md,
    backgroundColor: C.surface,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipIconWrap: {
    opacity: 0.85,
  },
  filterChipText: {
    fontSize: T.sm,
    fontWeight: W.semi,
    color: C.textSub,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.lg,
    marginBottom: S.md,
    gap: S.md,
  },
  sectionLabel: {
    fontSize: T.xs,
    fontWeight: W.semi,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    flexShrink: 0,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },

  // List
  listContent: {
    paddingHorizontal: S.lg,
    paddingBottom: 110,
    gap: S.sm + 2,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
    borderRadius: R.full,
    marginVertical: S.md,
    marginLeft: S.sm,
    opacity: 0.8,
  },
  cardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: S.md,
    paddingLeft: S.sm,
    gap: S.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: R.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: S.xs,
  },
  contentWrap: {
    gap: S.xs,
  },
  cardTitle: {
    fontSize: T.md,
    fontWeight: W.bold,
    color: C.text,
    lineHeight: T.md * 1.3,
  },
  cardUnit: {
    fontSize: T.sm,
    fontWeight: W.reg,
    color: C.textSub,
  },
  cardDesc: {
    fontSize: T.sm,
    color: C.textSub,
    lineHeight: T.sm * 1.5,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.xs,
    marginTop: S.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: S.sm,
    borderRadius: R.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: T.xs,
    fontWeight: W.semi,
  },

  // Stat chips inside card
  cardStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.xs,
    marginTop: S.xs,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.surfaceHigh,
    paddingVertical: 3,
    paddingHorizontal: S.sm,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  statChipText: {
    fontSize: T.xs,
    fontWeight: W.med,
    color: C.textSub,
  },

  // Measure chips
  measureChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: C.surfaceHigh,
    paddingVertical: 3,
    paddingHorizontal: S.sm,
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  measureChipValue: {
    fontSize: T.md,
    fontWeight: W.bold,
    color: C.text,
  },
  measureChipUnit: {
    fontSize: T.nano,
    fontWeight: W.med,
    color: C.textMuted,
  },

  // Card footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    marginTop: S.sm,
    paddingTop: S.sm,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerRelative: {
    fontSize: T.xs,
    fontWeight: W.med,
    color: C.textMuted,
  },
  footerDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: C.textMuted,
  },
  footerDate: {
    fontSize: T.xs,
    color: C.textMuted,
  },

  // Card actions
  cardActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: S.xs,
    gap: S.sm,
    flexShrink: 0,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: R.sm,
    backgroundColor: C.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
    gap: S.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: R.xl,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: S.sm,
  },
  emptyTitle: {
    fontSize: T.lg,
    fontWeight: W.bold,
    color: C.textSub,
  },
  emptySubtitle: {
    fontSize: T.sm,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: T.sm * 1.5,
  },

  // Delete confirm modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 100,
    backgroundColor: Colors.overlayBlack60,
    justifyContent: 'center' as const, alignItems: 'center' as const,
  },
  modalCard: {
    width: SCREEN_WIDTH - 64, padding: S.xl,
    backgroundColor: C.surfaceUp, borderRadius: R.xxl,
    borderWidth: 1, borderColor: C.borderUp,
    alignItems: 'center' as const, gap: S.lg,
  },
  modalTitle: { fontSize: T.lg, fontWeight: W.bold, color: C.text, textAlign: 'center' as const },
  modalMessage: { fontSize: T.sm, color: C.textSub, textAlign: 'center' as const },
  modalBtns: { flexDirection: 'row' as const, gap: S.md, width: '100%' as const },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: R.lg,
    backgroundColor: Colors.overlayWhite06,
    alignItems: 'center' as const, borderWidth: 1, borderColor: C.border,
  },
  modalCancelText: { fontSize: T.md, fontWeight: W.semi, color: C.textSub },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: R.lg,
    backgroundColor: Colors.overlayError15,
    alignItems: 'center' as const, borderWidth: 1, borderColor: Colors.overlayError30,
  },
  modalConfirmText: { fontSize: T.md, fontWeight: W.bold, color: C.error },
});
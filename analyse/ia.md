Patterns IA
Rapport d'analyse
23 problèmes
11

Copy-paste code detected
10x
copypaste-code

6 duplicate code blocks found — likely copy-pasted

src/services/notifications/index.ts

src/components/forms/AddEntryForm.tsx

app/settings/sports.tsx

src/stores/appStore.ts

app/social.tsx

app/settings/notifications.tsx

src/components/ui/EntryDetailModal.tsx

src/services/supabase/database.types.ts

app/enhanced-meal.tsx

app/rep-counter.tsx

Unused function parameters
11x
unused-function-params

3 unused parameters (likely AI-generated signature)
export function PositionScreen({ exercise, onReady, detec...

src/components/rep-counter/PositionScreen.tsx:31
const ProgressRing = ({ progress, size = 220, children }:...

app/rep-counter.tsx:215
export function ProgressRing({ progress, size = 220, chil...

src/components/rep-counter/ProgressRing.tsx:19
export function MonthCard({ month, workoutsCount, goalPro...

src/components/ui/MonthCard.tsx:19
const NavButton = ({ screenName, isFocused, router, confi...

app/_layout.tsx:28
export function EmptyState({ icon = '📋', title, subtitle ...

src/components/ui/EmptyState.tsx:15
export function ExportModal({ visible, onClose, entries, ...

src/components/ui/ExportModal.tsx:51
export function BadgeWithProgress({ badge, currentProgres...

src/components/ui/BadgeWithProgress.tsx:18
export function PloppyOnboardingModal({ visible, onAccept...

src/components/ui/PloppyOnboardingModal.tsx:23
const HistoryItem = ({ item, index, isLast }: { item: any...

app/gamification.tsx:169
export const TabBar = ({ state, descriptors, navigation }...

src/components/ui/TabBar.tsx:95

Unvalidated user input in AI prompt
unvalidated-ai-input

User input passed to AI without validation (prompt injection risk)
search_query: query,

src/services/supabase/social.ts:283

Gratuitous complexity
gratuitous-complexity

2 over-engineered patterns detected
subtitle={profile?.is_public !== false ? t('settings.lead...

app/settings/social.tsx:197
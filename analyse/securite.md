Sécurité
Rapport d'analyse
21 problèmes
1
19

Algorithme Algorithme de chiffrement obsolete obsolete
19x
weak-crypto

Algorithme de chiffrement obsolete ne devrait pas etre utilise pour la securite
// WORKOUT SCREEN - Historique complet des séances (Optimisé)

app/workout.tsx:2
// SESSION RECOVERY SERVICE - Sauvegarde automatique des séances en cours

src/services/sessionRecovery.ts:2
// Configuration des écrans

app/_layout.tsx:16
// HEALTH CONNECT SCREEN - Importer des séances depuis Health Connect

app/health-connect.tsx:2
Recherche des utilisateurs pour les ajouter

app/social.tsx:948
sportsConfig: SportConfig[]; // Configuration des sports (par défaut + custom)

src/stores/appStore.ts:55
/** Types d'entrées considérées comme des activités sportives (par défaut) */

src/constants/values.ts:10
// Configuration par défaut des sports

src/stores/appStore.ts:123
// Calcul des calories (approximatif)

app/rep-counter.tsx:1419
// Nettoyer la réponse si elle contient des backticks markdown

src/services/pollination/index.ts:280
/** Durée des animations lentes (ms) */

src/constants/values.ts:58
// Composant pour le graphique des séances

app/progress.tsx:180
// OPENFOODFACTS API SERVICE - Récupération des infos produits via code-barres

src/services/openfoodfacts/index.ts:2
// Calcul des XP de la semaine basé sur la vraie logique XP :

app/social.tsx:473
'Cela effacera uniquement l\'historique des gains XP, pas ton niveau actuel.',

app/settings/developer.tsx:128
/** Durée standard des animations UI (ms) */

src/constants/values.ts:52
/** Durée des animations rapides (ms) */

src/constants/values.ts:55
// BUILD CONFIG - Configuration des flavors (standard vs FOSS)

src/config/buildConfig.ts:2
Gagne de l'XP, monte de niveau et accomplis des quêtes pour rester motivé au ...

app/onboarding.tsx:389

Version non epinglee
unpinned-versions

"@blazejkustra/react-native-onboarding@^1.0.0" utilise ^/~ (risque de breaking changes)

package.json

Injection de commande potentielle
command-injection

exec/spawn avec input utilisateur (JS) - risque d'injection de commande
execSync(`${flavorConfig.envVar} bunx expo prebuild --clean --platform androi...

scripts/ci-build.js:231
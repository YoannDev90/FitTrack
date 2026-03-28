export const EnhancedMealPalette = {
    black: '#000000',
    white: '#FFFFFF',
    offWhite: '#F8F8F8',
    gray100: '#E5E5E5',
    gray200: '#CCCCCC',
    gray400: '#888888',
    gray600: '#555555',
    gray800: '#222222',
    gray900: '#111111',
    accent: '#CEFF00',
    teal: '#2DD4BF',
    purple: '#A78BFA',
} as const;

export const getEnhancedMealScoreColor = (score: number): string => {
    if (score >= 85) return '#22c55e';
    if (score >= 70) return '#84cc16';
    if (score >= 50) return '#eab308';
    if (score >= 30) return '#f97316';
    return '#ef4444';
};

export const getEnhancedMealScoreGradient = (score: number): [string, string] => {
    if (score >= 85) return ['#22c55e', '#16a34a'];
    if (score >= 70) return ['#84cc16', '#65a30d'];
    if (score >= 50) return ['#eab308', '#ca8a04'];
    if (score >= 30) return ['#f97316', '#ea580c'];
    return ['#ef4444', '#dc2626'];
};

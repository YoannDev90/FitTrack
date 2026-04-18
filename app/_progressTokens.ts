import { Dimensions } from 'react-native';
import { ScreenPalettes } from '../src/constants';

export const { width: SW } = Dimensions.get('window');
export const PAD = 18;

export const C = ScreenPalettes.warm;

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 44 } as const;
export const R = { sm: 6, md: 10, lg: 14, xl: 18, xxl: 22, xxxl: 32, full: 999 } as const;
export const T = {
    nano: 9,
    micro: 10,
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    xxxl: 34,
    display: 48,
} as const;
export const W = {
    light: '300',
    reg: '400',
    med: '500',
    semi: '600',
    bold: '700',
    xbold: '800',
    black: '900',
} as const;

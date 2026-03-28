// repCounter/components/ProgressRing.tsx
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { RC } from '../constants';

interface ProgressRingProps {
    progress: number;
    size?: number;
    children?: React.ReactNode;
    color1?: string;
    color2?: string;
}

export function ProgressRing({
    progress,
    size = 240,
    children,
    color1 = RC.cta1,
    color2 = RC.cta2,
}: ProgressRingProps) {
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, progress)));

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                <Defs>
                    <SvgLinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={color1} />
                        <Stop offset="100%" stopColor={color2} />
                    </SvgLinearGradient>
                </Defs>
                {/* Track */}
                <Circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={RC.whiteOverlay06}
                    strokeWidth={strokeWidth}
                    fill={RC.transparent}
                />
                {/* Progress */}
                {progress > 0 && (
                    <Circle
                        cx={size / 2} cy={size / 2} r={radius}
                        stroke="url(#ringGrad)"
                        strokeWidth={strokeWidth}
                        fill={RC.transparent}
                        strokeDasharray={`${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    />
                )}
            </Svg>
            {children}
        </View>
    );
}

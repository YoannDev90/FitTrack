import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './SocialHubScreen.styles';

interface SocialStatusScreenProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    buttonLabel?: string;
    onPressButton?: () => void;
    footer?: React.ReactNode;
}

export function SocialStatusScreen({
    icon,
    title,
    subtitle,
    buttonLabel,
    onPressButton,
    footer,
}: SocialStatusScreenProps) {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.centeredState}>
                {icon}
                <Text style={styles.stateTitle}>{title}</Text>
                <Text style={styles.stateSubtitle}>{subtitle}</Text>
                {buttonLabel && onPressButton && (
                    <TouchableOpacity style={styles.primaryButton} onPress={onPressButton}>
                        <Text style={styles.primaryButtonText}>{buttonLabel}</Text>
                    </TouchableOpacity>
                )}
            </View>
            {footer}
        </SafeAreaView>
    );
}

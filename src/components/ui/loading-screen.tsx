import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function LoadingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.amberBright} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.deep,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

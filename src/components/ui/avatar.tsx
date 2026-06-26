import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontFamily, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UserRole } from '@/services/auth';

function roleBg(colors: ThemeColors): Record<UserRole, string> {
  return {
    pharmacy: colors.amber,
    client: colors.sage,
    delivery: colors.violet,
  };
}

interface AvatarProps {
  name?: string | null;
  role: UserRole;
  size?: number;
  onPress?: () => void;
}

export function getInitials(name?: string | null): string {
  if (!name) return '??';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function Avatar({ name, role, size = 38, onPress }: AvatarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const content = (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: roleBg(colors)[role],
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.37 }]}>{getInitials(name)}</Text>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      {content}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    avatar: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    initials: {
      fontFamily: FontFamily.sansBold,
      color: '#1a0d02',
    },
  });
}

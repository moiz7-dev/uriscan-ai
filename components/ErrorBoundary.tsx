import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: unknown): State {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : 'Something went wrong.',
    };
  }

  componentDidCatch(error: unknown) {
    console.warn('ErrorBoundary caught', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <View style={styles.wrap}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>{this.state.message}</Text>
          </View>
        )
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const CONTACT_EMAIL = 'moizratlamwala78652@gmail.com';

export default function AccountDeletionScreen() {
  return (
    <ErrorBoundary>
      <AccountDeletion />
    </ErrorBoundary>
  );
}

function AccountDeletion() {
  const [deleting, setDeleting] = useState(false);

  function handleRequestDeletion() {
    Alert.alert(
      'Request Account Deletion',
      `To delete your account and all associated data, please email us at:\n\n${CONTACT_EMAIL}\n\nInclude your registered email address in the request. We will permanently delete your account and all data within 30 days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: () => {
            const subject = encodeURIComponent('Account Deletion Request - UriScan AI');
            const body = encodeURIComponent(
              'Please delete my account and all associated data.\n\nRegistered email: [Your email address]\n\nI understand that this action is irreversible and all my data will be permanently deleted.',
            );
            Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`);
          },
        },
      ],
    );
  }

  function handleLearnMore() {
    Alert.alert(
      'What gets deleted?',
      'When you request account deletion, the following data will be permanently removed:\n\n• Account information (email, name)\n• All scan history and results\n• Hydration tracking data\n• User preferences and settings\n• Any associated purchase records\n\nThis action cannot be undone.',
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="trash-outline" size={32} color={Colors.danger} />
          </View>
          <Text style={styles.title}>Account Deletion</Text>
          <Text style={styles.subtitle}>
            Permanently delete your account and all data
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>What happens when you delete</Text>
              <Text style={styles.infoText}>
                All your data will be permanently removed from our servers within 30
                days of your request. This action cannot be undone.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Processing time</Text>
              <Text style={styles.infoText}>
                Account deletion requests are processed within 30 days. You will
                receive a confirmation email once completed.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Data security</Text>
              <Text style={styles.infoText}>
                Your data is securely deleted and cannot be recovered. We comply with
                all applicable data protection regulations.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.dataListCard}>
          <Text style={styles.listTitle}>Data that will be deleted</Text>
          <View style={styles.listItem}>
            <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.listText}>Account information (email, name)</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="water-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.listText}>All scan history and results</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="analytics-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.listText}>Hydration tracking data</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="settings-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.listText}>User preferences and settings</Text>
          </View>
          <View style={styles.listItem}>
            <Ionicons name="card-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.listText}>Purchase records (if any)</Text>
          </View>
        </View>

        <Pressable
          onPress={handleLearnMore}
          style={styles.learnMoreButton}
          accessibilityRole="button"
          accessibilityLabel="Learn more about data deletion"
        >
          <Text style={styles.learnMoreText}>Learn more about what gets deleted</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </Pressable>

        <Pressable
          onPress={handleRequestDeletion}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Request account deletion"
        >
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.deleteButtonText}>Request Account Deletion</Text>
        </Pressable>

        <Text style={styles.contactNote}>
          If you have any questions, contact us at{' '}
          <Text
            style={styles.contactLink}
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
          >
            {CONTACT_EMAIL}
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.h1, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },

  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.card,
  },
  infoItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  infoContent: { flex: 1, gap: 4 },
  infoTitle: { ...Typography.bodyBold, color: Colors.text },
  infoText: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },

  dataListCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  listTitle: { ...Typography.bodyBold, color: Colors.text, marginBottom: Spacing.xs },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  listText: { ...Typography.caption, color: Colors.textMuted },

  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  learnMoreText: { ...Typography.bodyBold, color: Colors.primary },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.danger,
    paddingVertical: Spacing.base,
    borderRadius: Radii.pill,
    minHeight: 56,
    ...Shadows.raised,
  },
  deleteButtonPressed: { opacity: 0.8 },
  deleteButtonText: { ...Typography.h3, color: '#fff' },

  contactNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  contactLink: { color: Colors.primary, fontWeight: '600' },
});

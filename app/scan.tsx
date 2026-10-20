import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ColorPicker } from '@/components/ColorPicker';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { Colors, Radii, Shadows, Spacing, Typography } from '@/constants/theme';
import { analyzePhotoColor, type AnalyzedColor } from '@/lib/colorAnalysis';
import { analyzeHydration } from '@/lib/hydrationEngine';
import { useHydrationStore } from '@/store/useHydrationStore';
import type { HydrationColor } from '@/types';

interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
}

const SCAN_TIPS = [
  'Use a clear glass or white container',
  'Photograph in natural daylight, not yellow indoor bulbs',
  'Place the sample on a white surface (paper towel works)',
  'Center the sample inside the circle reticle',
  'Avoid shadows, reflections, and direct flash glare',
];

export default function ScanScreen() {
  return (
    <ErrorBoundary>
      <Scan />
    </ErrorBoundary>
  );
}

function Scan() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [selected, setSelected] = useState<HydrationColor | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzedColor | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const addScan = useHydrationStore((s) => s.addScan);

  function close() {
    router.back();
  }

  async function capture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const taken = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      if (taken?.uri) {
        setPhoto({
          uri: taken.uri,
          width: taken.width ?? 0,
          height: taken.height ?? 0,
        });
      }
    } catch (e) {
      console.warn('capture failed', e);
    } finally {
      setCapturing(false);
    }
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        width: asset.width ?? 0,
        height: asset.height ?? 0,
      });
    }
  }

  function retake() {
    setPhoto(null);
    setSelected(null);
    setAnalysis(null);
    setAnalysisError(null);
  }

  async function analyze() {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      const result = analyzeHydration(selected);
      const { scanId, reportId } = await addScan(result);
      router.replace({
        pathname: '/result',
        params: { color: selected, reportId, scanId: String(scanId) },
      });
    } catch (e) {
      console.warn('analyze (scan) failed', e);
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!photo) return;
    let cancelled = false;
    setAnalyzing(true);
    setAnalysisError(null);
    (async () => {
      try {
        const result = await analyzePhotoColor(photo.uri, photo.width, photo.height);
        if (cancelled) return;
        setAnalysis(result);
        setSelected(result.swatch.id);
      } catch (e) {
        if (cancelled) return;
        console.warn('analyzePhotoColor failed', e);
        setAnalysisError(
          'We could not auto-detect the color. Pick the closest swatch manually.',
        );
      } finally {
        if (!cancelled) setAnalyzing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photo]);

  if (!permission) {
    return <View style={styles.fill} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionWrap} edges={['top', 'bottom']}>
        <Ionicons name="camera-outline" size={64} color={Colors.primary} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          UriScan AI uses your camera to auto-detect the color of your sample.
          The photo stays on your device.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={styles.primaryButton}
          accessibilityRole="button"
          accessibilityLabel="Allow camera access"
        >
          <Text style={styles.primaryText}>Allow camera</Text>
        </Pressable>
        <Pressable
          onPress={pickFromGallery}
          style={styles.ghostButton}
          accessibilityRole="button"
          accessibilityLabel="Pick from gallery instead"
        >
          <Text style={styles.ghostText}>Pick from gallery</Text>
        </Pressable>
        <Pressable
          onPress={close}
          style={styles.closeText}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!photo) {
    return (
      <View style={styles.fill}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
        />
        <SafeAreaView style={styles.cameraOverlay} edges={['top', 'bottom']}>
          <View style={styles.cameraTopBar}>
            <Pressable
              onPress={close}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Close camera"
            >
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
            <Text style={styles.cameraTitle}>Camera Scan</Text>
            <View style={styles.iconButton} />
          </View>

          <View style={styles.reticleWrap} pointerEvents="none">
            <View style={styles.reticle} />
            <Text style={styles.reticleHint}>
              Center your sample in the circle
            </Text>
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>For best results</Text>
            {SCAN_TIPS.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <View style={styles.cameraBottomBar}>
            <Pressable
              onPress={pickFromGallery}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Pick from gallery"
            >
              <Ionicons name="images-outline" size={28} color="#fff" />
            </Pressable>
            <Pressable
              onPress={capture}
              disabled={capturing}
              style={[styles.shutter, capturing && styles.shutterPressed]}
              accessibilityRole="button"
              accessibilityLabel="Capture photo"
            >
              <View style={styles.shutterInner} />
            </Pressable>
            <View style={styles.iconButton} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.reviewSafe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.reviewScroll}>
        <View style={styles.reviewTopBar}>
          <Pressable
            onPress={close}
            style={styles.reviewClose}
            accessibilityRole="button"
            accessibilityLabel="Close scan"
          >
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.reviewTitle}>Auto analysis</Text>
          <View style={styles.reviewClose} />
        </View>

        <View style={styles.photoCard}>
          <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
          <View style={styles.photoReticle} pointerEvents="none" />
          <Pressable
            onPress={retake}
            style={styles.retakePill}
            accessibilityRole="button"
            accessibilityLabel="Retake photo"
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retakeText}>Retake</Text>
          </Pressable>
        </View>

        <View style={styles.analysisCard}>
          {analyzing && (
            <View style={styles.analysisRow}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.analysisLabel}>Analyzing color…</Text>
            </View>
          )}

          {!analyzing && analysisError && (
            <View>
              <Text style={styles.errorTitle}>Analysis failed</Text>
              <Text style={styles.errorText}>{analysisError}</Text>
            </View>
          )}

          {!analyzing && analysis && (
            <View style={styles.analysisResult}>
              {/* Detected sample swatch */}
              <View style={styles.analysisRow}>
                <View
                  style={[
                    styles.detectedSwatch,
                    { backgroundColor: analysis.hex },
                  ]}
                />
                <View style={styles.analysisInfo}>
                  <Text style={styles.analysisLabel}>
                    Best match: {analysis.swatch.label}
                  </Text>
                  <View style={styles.confidenceRow}>
                    <View
                      style={[
                        styles.confidenceDot,
                        { backgroundColor: confidenceColor(analysis.confidence) },
                      ]}
                    />
                    <Text style={styles.confidenceText}>
                      {confidenceLabel(analysis.confidence)} confidence
                    </Text>
                  </View>
                  {analysis.confidence !== 'high' && (
                    <Text style={styles.confidenceHint}>
                      Lighting may shift results — confirm below.
                    </Text>
                  )}
                </View>
              </View>

              {/* Top-3 quick-pick strip */}
              {analysis.candidates.length > 1 && (
                <View style={styles.candidatesWrap}>
                  <Text style={styles.candidatesLabel}>Top matches — tap to select:</Text>
                  <View style={styles.candidatesRow}>
                    {analysis.candidates.map((c, i) => {
                      const isActive = selected === c.swatch.id;
                      return (
                        <Pressable
                          key={c.swatch.id}
                          onPress={() => setSelected(c.swatch.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Select ${c.swatch.label}`}
                          accessibilityState={{ selected: isActive }}
                          style={[
                            styles.candidateItem,
                            isActive && styles.candidateItemActive,
                          ]}
                        >
                          <View
                            style={[
                              styles.candidateSwatch,
                              { backgroundColor: c.swatch.hex },
                              isActive && styles.candidateSwatchActive,
                            ]}
                          />
                          <Text
                            style={[
                              styles.candidateName,
                              isActive && styles.candidateNameActive,
                            ]}
                            numberOfLines={2}
                          >
                            {c.swatch.label}
                          </Text>
                          {i === 0 && (
                            <View style={styles.bestBadge}>
                              <Text style={styles.bestBadgeText}>#1</Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.helperCard}>
          <Text style={styles.helperTitle}>Not quite right?</Text>
          <Text style={styles.helperSub}>
            Pick the closest color from the full grid below.
          </Text>
          <View style={styles.helperSpacer} />
          <ColorPicker selected={selected} onSelect={setSelected} />
        </View>

        <DisclaimerBanner variant="inline" />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={retake}
          style={styles.ghostFooterButton}
          accessibilityRole="button"
          accessibilityLabel="Retake photo"
        >
          <Text style={styles.ghostFooterText}>Retake</Text>
        </Pressable>
        <Pressable
          onPress={analyze}
          disabled={!selected || analyzing || submitting}
          style={[
            styles.primaryFooterButton,
            (!selected || analyzing || submitting) && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Analyze"
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Analyze</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function confidenceColor(level: AnalyzedColor['confidence']): string {
  switch (level) {
    case 'high':
      return Colors.success;
    case 'medium':
      return Colors.warning;
    case 'low':
      return Colors.danger;
  }
}

function confidenceLabel(level: AnalyzedColor['confidence']): string {
  switch (level) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },

  permissionWrap: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.base,
  },
  permissionTitle: { ...Typography.h2, color: Colors.text, marginTop: Spacing.md },
  permissionText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  closeText: { padding: Spacing.md },
  cancelText: { ...Typography.bodyBold, color: Colors.textMuted },

  cameraOverlay: { flex: 1, justifyContent: 'space-between' },
  cameraTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cameraTitle: { ...Typography.bodyBold, color: '#fff' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  reticle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    opacity: 0.85,
  },
  reticleHint: {
    ...Typography.bodyBold,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  tipsCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: 'rgba(15,23,42,0.55)',
    borderRadius: Radii.lg,
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  tipsTitle: {
    ...Typography.micro,
    color: '#fff',
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginTop: 7,
  },
  tipText: { ...Typography.caption, color: '#fff', flex: 1, lineHeight: 18 },

  cameraBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.base,
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterPressed: { opacity: 0.6 },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },

  reviewSafe: { flex: 1, backgroundColor: Colors.background },
  reviewScroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  reviewTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewTitle: { ...Typography.h3, color: Colors.text },

  photoCard: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    ...Shadows.card,
  },
  photo: {
    width: '100%',
    height: 240,
  },
  photoReticle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 96,
    height: 96,
    marginLeft: -48,
    marginTop: -48,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  retakePill: {
    position: 'absolute',
    bottom: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(15,23,42,0.7)',
  },
  retakeText: { ...Typography.caption, color: '#fff', fontWeight: '600' },

  analysisCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    minHeight: 80,
    justifyContent: 'center',
    ...Shadows.card,
  },
  analysisResult: { gap: Spacing.base },
  analysisRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  detectedSwatch: {
    width: 56,
    height: 56,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  analysisInfo: { flex: 1, gap: 2 },
  analysisLabel: { ...Typography.bodyBold, color: Colors.text },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  confidenceDot: { width: 8, height: 8, borderRadius: 4 },
  confidenceText: { ...Typography.caption, color: Colors.textMuted },
  confidenceHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  errorTitle: { ...Typography.bodyBold, color: Colors.danger },
  errorText: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },

  candidatesWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.base,
    gap: Spacing.sm,
  },
  candidatesLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  candidatesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  candidateItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    borderRadius: Radii.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Colors.background,
    position: 'relative',
  },
  candidateItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  candidateSwatch: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  candidateSwatchActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  candidateName: {
    ...Typography.micro,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
    minHeight: 28,
  },
  candidateNameActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  bestBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  bestBadgeText: {
    ...Typography.micro,
    color: '#fff',
    fontWeight: '700',
    fontSize: 9,
  },

  helperCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  helperTitle: { ...Typography.h3, color: Colors.text },
  helperSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  helperSpacer: { height: Spacing.base },

  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  primaryButton: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { ...Typography.bodyBold, color: '#fff' },
  ghostButton: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { ...Typography.bodyBold, color: Colors.text },
  ghostFooterButton: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 48,
  },
  ghostFooterText: { ...Typography.bodyBold, color: Colors.text },
  primaryFooterButton: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    minHeight: 48,
  },
  disabled: { opacity: 0.4 },
});

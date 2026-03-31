import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react-native';

import SafeLinearGradient from '../../../components/common/safe-linear-gradient';
import { useTranslation } from '../../../hooks/use-translation';
import { clearAuthError, loginThunk } from '../../../store/auth-slice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';

const LOGIN_LOGO_LIGHT = require('../../../../public/Site_Logo/color_big.png');

const BRAND_COLORS = {
  bg: '#ef4444',
  blobA: '#f87171',
  blobB: '#dc2626',
  panel: '#ffffff',
  panelBorder: '#fbc7cf',
  title: '#450a0a',
  subtitle: '#7f1d1d',
  inputBg: '#fff8f8',
  inputBorder: '#fecaca',
  inputText: '#450a0a',
  inputPlaceholder: '#b45353',
  iconBg: '#ffe4e6',
  iconColor: '#b91c1c',
  primaryStart: '#ef4444',
  primaryEnd: '#dc2626',
  primaryShadow: '#991b1b',
  secondaryBorder: '#fda4af',
  secondaryText: '#7f1d1d',
  errorBg: '#fff1f2',
  errorBorder: '#fecdd3',
  errorText: '#be123c',
  footer: '#9f1239',
};

export default function Login() {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector(state => state.auth);
  const hasStoredSession = useAppSelector(state => Boolean(state.auth.token));
  const { height } = useWindowDimensions();
  const t = useTranslation();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [buttonPressed, setButtonPressed] = React.useState(false);
  const intro = React.useRef(new Animated.Value(0)).current;
  const isLoading = status === 'loading';
  const colors = BRAND_COLORS;
  const currentYear = new Date().getFullYear();

  React.useEffect(() => {
    if (hasStoredSession) {
      intro.setValue(1);
      return;
    }

    intro.setValue(0);

    const animation = Animated.sequence([
      Animated.timing(intro, {
        toValue: 1,
        duration: 940,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [hasStoredSession, intro]);

  const heroAnimatedStyle = React.useMemo(
    () => ({
      opacity: 1,
      transform: [{ translateY: 0 }],
    }),
    [],
  );

  const logoTravelY = React.useMemo(
    () => -Math.min(210, Math.max(150, Math.round(height * 0.24))),
    [height],
  );

  const splashOverlayLogoStyle = React.useMemo(
    () => ({
      opacity: 1,
      transform: [
        {
          translateY: intro.interpolate({
            inputRange: [0, 1],
            outputRange: [0, logoTravelY],
          }),
        },
        {
          scale: intro.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.72],
          }),
        },
      ],
    }),
    [intro, logoTravelY],
  );

  const cardAnimatedStyle = React.useMemo(
    () => ({
      opacity:
        Platform.OS === 'android'
          ? 1
          : intro.interpolate({
              inputRange: [0, 0.48, 1],
              outputRange: [0, 0.02, 1],
            }),
      transform: [
        {
          translateY: intro.interpolate({
            inputRange: [0, 1],
            outputRange: [42, 0],
          }),
        },
      ],
    }),
    [intro],
  );

  const pageBackgroundStyle = React.useMemo(
    () => [styles.page, { backgroundColor: colors.bg }],
    [colors.bg],
  );

  const cardStyle = React.useMemo(
    () => [
      styles.card,
      {
        backgroundColor: colors.panel,
        borderColor: colors.panelBorder,
      },
      styles.cardLightShadow,
    ],
    [colors.panel, colors.panelBorder],
  );

  const handleSubmit = React.useCallback(async () => {
    dispatch(clearAuthError());
    dispatch(loginThunk({ login: email, password }));
  }, [dispatch, email, password]);

  return (
    <View style={pageBackgroundStyle}>
      <View style={[styles.bgBlob, styles.blobTop, { backgroundColor: colors.blobA }]} />
      <View
        style={[
          styles.bgBlob,
          styles.blobBottom,
          { backgroundColor: colors.blobB },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.splashOverlayLogo,
          splashOverlayLogoStyle,
          styles.logoSurfaceLight,
        ]}
      >
        <Image
          source={LOGIN_LOGO_LIGHT}
          style={styles.brandLogo}
          resizeMode="contain"
        />
      </Animated.View>


      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.heroWrap, heroAnimatedStyle]}>
            <View style={styles.heroLogoSpacer} />
          </Animated.View>

          <Animated.View style={cardAnimatedStyle}>
            <View style={cardStyle}>
            <View
              style={[
                styles.cardAccent,
                {
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                },
              ]}
            />

            <View
              style={[
                styles.cardHeader,
                {
                  borderBottomColor: 'rgba(239, 68, 68, 0.22)',
                },
              ]}
            >
              <Text
                style={[
                  styles.cardEyebrow,
                  { color: '#9f1239' },
                ]}
              >
                SECURE LOGIN
              </Text>
              <Text
                style={[
                  styles.cardTitle,
                  { color: '#7f1d1d' },
                ]}
              >
                {t.common.brandName}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: '#9f1239' },
                ]}
              >
                Hesabınıza daxil olun və idarəetməyə davam edin
              </Text>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: colors.subtitle }]}>{t.login.emailLabel}</Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: colors.iconBg }]}>
                  <Mail size={17} color={colors.iconColor} strokeWidth={2.1} />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.inputText }]}
                  placeholder={t.login.emailPlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: colors.subtitle }]}>{t.login.passwordLabel}</Text>
              <View
                style={[
                  styles.inputRow,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: colors.iconBg }]}>
                  <LockKeyhole size={17} color={colors.iconColor} strokeWidth={2.1} />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.inputText }]}
                  placeholder={t.login.passwordPlaceholder}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                  editable={!isLoading}
                />
                <Pressable
                  onPress={() => setPasswordVisible(prev => !prev)}
                  disabled={isLoading}
                  hitSlop={8}
                  style={styles.eyeButton}
                >
                  {passwordVisible ? (
                    <Eye size={18} color={colors.iconColor} strokeWidth={2.1} />
                  ) : (
                    <EyeOff size={18} color={colors.iconColor} strokeWidth={2.1} />
                  )}
                </Pressable>
              </View>
            </View>

            {error ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.errorBg,
                    borderColor: colors.errorBorder,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.errorText }]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={isLoading}
              onPressIn={() => setButtonPressed(true)}
              onPressOut={() => setButtonPressed(false)}
              style={[
                styles.primaryButtonWrap,
                {
                  shadowColor: colors.primaryShadow,
                  opacity: isLoading || buttonPressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={styles.primaryButtonInnerWrap}>
                <SafeLinearGradient
                  colors={[colors.primaryStart, colors.primaryEnd]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.primaryButton}
                >
                  {isLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.primaryButtonText}>{t.login.signingInButton}</Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>{t.login.loginButton}</Text>
                  )}
                </SafeLinearGradient>
              </View>
            </Pressable>

            <Text style={[styles.footerText, { color: colors.footer }]}>{`© ${currentYear} SmartLife. Bütün hüquqlar qorunur.`}</Text>
          </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  bgBlob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.45,
  },
  blobTop: {
    width: 260,
    height: 260,
    top: -130,
    right: -80,
  },
  blobBottom: {
    width: 300,
    height: 300,
    bottom: -160,
    left: -100,
  },
  splashOverlayLogo: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 134,
    height: 134,
    marginLeft: -67,
    marginTop: -67,
    borderRadius: 32,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 9,
    zIndex: 25,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 44,
  },
  heroWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  heroLogoSpacer: {
    height: 98,
  },
  brandLogo: {
    width: 96,
    height: 96,
  },
  logoSurface: {
    width: 134,
    height: 134,
    borderRadius: 32,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 9,
  },
  logoSurfaceLight: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(15, 23, 42, 0.08)',
    shadowColor: '#334155',
  },
  logoSurfaceDark: {
    backgroundColor: '#081022',
    borderColor: 'rgba(148, 163, 184, 0.24)',
    shadowColor: '#020617',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 12,
  },
  brandBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  brandName: {
    fontSize: 34,
    lineHeight: 40,
    fontFamily: 'WorkSans-Bold',
    letterSpacing: 0.2,
  },
  brandTagline: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'WorkSans-Medium',
    textAlign: 'center',
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cardLightShadow: {
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 12,
  },
  cardDarkShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.48,
    shadowRadius: 22,
    elevation: 12,
  },
  cardAccent: {
    position: 'absolute',
    top: -56,
    right: -26,
    width: 160,
    height: 160,
    borderRadius: 999,
  },
  cardHeader: {
    borderBottomWidth: 1,
    paddingBottom: 13,
    marginBottom: 2,
  },
  cardEyebrow: {
    fontSize: 10,
    letterSpacing: 1.1,
    fontFamily: 'WorkSans-SemiBold',
  },
  cardTitle: {
    marginTop: 5,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'WorkSans-Bold',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'WorkSans-Medium',
  },
  titleWrap: {
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'WorkSans-Bold',
  },
  panelSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'WorkSans-Regular',
  },
  fieldWrap: {
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 0.4,
    fontFamily: 'WorkSans-SemiBold',
    marginBottom: 8,
  },
  inputRow: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 15,
    fontFamily: 'WorkSans-Medium',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  eyeButton: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  errorBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'WorkSans-Medium',
  },
  primaryButtonWrap: {
    marginTop: 18,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryButtonInnerWrap: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    letterSpacing: 0.5,
    fontFamily: 'WorkSans-Bold',
  },
  footerText: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'WorkSans-Medium',
    color: '#fee2e2',
  },
});

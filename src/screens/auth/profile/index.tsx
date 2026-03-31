import React from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BellRing,
  Building2,
  CalendarDays,
  CheckCircle2,
  Globe,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  LogOut,
  ShieldCheck,
  UserCircle2,
  UserCog,
} from 'lucide-react-native';

import AppPageLayout from '../../../components/common/app-page-layout';
import { useThemeMode } from '../../../hooks/use-theme';
import { meService } from '../../../services/auth-service';
import { logoutThunk, selectIsResident } from '../../../store/auth-slice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { normalizeUserData, type AuthUser } from '../../../utils/auth';
import { useResidentPropertySelector } from '../../resident/use-resident-property-selector';

type UserProfileData = {
  role: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    name: string;
    gender: string;
    phone: string;
    email: string;
    status: boolean;
    username: string;
    birthday: string;
    personalCode: string;
    createdAt: string;
    updatedAt: string;
  };
  notifications: {
    count: number;
    list: Array<{
      id: number;
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      ipAddress: string;
      userAgent: string;
      createdAt: string;
    }>;
  };
  complexes: Array<{
    id: number;
    name: string;
    status: 'active' | 'inactive';
    bindMtk: string;
    address: string;
    email: string;
    phone: string;
    website: string;
    colorCode: string;
    moduleCount: number;
    availableModuleCount: number;
    buildingCount: number;
  }>;
  roleAccessModules: Array<{
    moduleId: number;
    moduleName: string;
    permissions: string[];
  }>;
};

const EMPTY_PROFILE: UserProfileData = {
  role: {
    id: 0,
    name: 'user',
  },
  user: {
    id: 0,
    name: 'User',
    gender: '-',
    phone: '-',
    email: '-',
    status: false,
    username: 'user',
    birthday: '',
    personalCode: '-',
    createdAt: '',
    updatedAt: '',
  },
  notifications: {
    count: 0,
    list: [],
  },
  complexes: [],
  roleAccessModules: [],
};

const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
};

const toObjectArray = (value: unknown): Array<Record<string, unknown>> => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => toRecord(item))
    .filter(item => Object.keys(item).length > 0);
};

const asText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return '';
};

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const pickText = (...values: unknown[]): string => {
  for (const value of values) {
    const text = asText(value);
    if (text.length > 0) {
      return text;
    }
  }

  return '';
};

const toNotificationType = (
  value: unknown,
): UserProfileData['notifications']['list'][number]['type'] => {
  const normalized = asText(value).toLowerCase();
  if (
    normalized === 'info' ||
    normalized === 'warning' ||
    normalized === 'error' ||
    normalized === 'success'
  ) {
    return normalized;
  }

  return 'info';
};

const toStatusFlag = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = asText(value).toLowerCase();
  if (!normalized) {
    return false;
  }

  return !['0', 'false', 'inactive', 'blocked', 'disabled'].includes(normalized);
};

const normalizeWebsiteUrl = (url: string): string => {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `https://${url}`;
};

const buildRoleAccessModules = (
  modules: unknown,
): UserProfileData['roleAccessModules'] => {
  return toObjectArray(modules).map((module, index) => {
    const rawPermissions = Array.isArray(module.permissions)
      ? module.permissions
      : [];

    const permissions = rawPermissions
      .map(permission => {
        if (typeof permission === 'string') {
          return permission;
        }

        return asText(toRecord(permission).permission);
      })
      .filter(permission => permission.length > 0);

    return {
      moduleId: asNumber(module.module_id ?? module.moduleId, index + 1),
      moduleName:
        pickText(module.module_name, module.moduleName) || `module-${index + 1}`,
      permissions,
    };
  });
};

const buildComplexes = (userComplex: unknown): UserProfileData['complexes'] => {
  const userComplexRecord = toRecord(userComplex);
  const complexItems = toObjectArray(
    Array.isArray(userComplex)
      ? userComplex
      : userComplexRecord.data,
  );

  return complexItems.map((item, index) => {
    const bindMtk = toRecord(item.bind_mtk);
    const rawStatus = asText(item.status).toLowerCase();
    const moduleCount = asNumber(
      item.module_count ?? item.modules_count ?? item.moduleCount,
      0,
    );

    return {
      id: asNumber(item.id, index + 1),
      name: pickText(item.name) || `Complex ${index + 1}`,
      status: rawStatus === 'inactive' ? 'inactive' : 'active',
      bindMtk: pickText(bindMtk.name, item.bind_mtk_name, item.bindMtk) || '-',
      address: pickText(item.address) || '-',
      email: pickText(item.email) || '-',
      phone: pickText(item.phone) || '-',
      website: pickText(item.website),
      colorCode: pickText(item.color_code, item.colorCode) || '#75a99f',
      moduleCount,
      availableModuleCount: asNumber(
        item.available_module_count ?? item.available_modules_count ?? item.availableModuleCount,
        moduleCount,
      ),
      buildingCount: asNumber(item.building_count ?? item.buildingCount, 0),
    };
  });
};

const buildNotifications = (
  notifications: unknown,
): UserProfileData['notifications'] => {
  const notificationRecord = toRecord(notifications);
  const list = toObjectArray(notificationRecord.list).map((item, index) => ({
    id: asNumber(item.id, index + 1),
    type: toNotificationType(item.type),
    title: pickText(item.title) || 'Notification',
    message: pickText(item.message) || '-',
    ipAddress: pickText(item.ip_address, item.ipAddress) || '-',
    userAgent: pickText(item.user_agent, item.userAgent) || '-',
    createdAt: pickText(item.created_at, item.createdAt),
  }));

  return {
    count: asNumber(notificationRecord.count, list.length),
    list,
  };
};

const buildProfileData = (user: AuthUser | null): UserProfileData => {
  if (!user) {
    return EMPTY_PROFILE;
  }

  const userData = toRecord(user.user_data);
  const roleId = asNumber(user.role?.id, 0);
  const roleName = pickText(user.role?.name) || 'user';
  const fullName = pickText(user.fullName, user.name, userData.name) || 'User';
  const username = pickText(user.username, userData.username) || 'user';
  const birthday = pickText(user.birthday, userData.birthday);
  const personalCode =
    pickText(user.personal_code, userData.personal_code, userData.personalCode) || '-';
  const createdAt = pickText(userData.created_at, userData.createdAt);
  const updatedAt = pickText(userData.updated_at, userData.updatedAt);

  return {
    role: {
      id: roleId,
      name: roleName,
    },
    user: {
      id: asNumber(user.id, 0),
      name: fullName,
      gender: pickText(user.gender, userData.gender) || '-',
      phone: pickText(user.phone, userData.phone) || '-',
      email: pickText(user.email, userData.email) || '-',
      status: toStatusFlag(user.status),
      username,
      birthday,
      personalCode,
      createdAt,
      updatedAt,
    },
    notifications: buildNotifications(user.notifications),
    complexes: buildComplexes(user.user_complex),
    roleAccessModules: buildRoleAccessModules(user.role_access_modules),
  };
};
function formatBirthday(isoDate?: string | null) {
  if (!isoDate) {
    return '-';
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(raw?: string | null) {
  if (!raw) {
    return '-';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { resolvedTheme } = useThemeMode();
  const isResident = useAppSelector(selectIsResident);
  const {
    propertyOptions,
    selectedPropertyName,
    onPropertyChange,
  } = useResidentPropertySelector();
  const authStatus = useAppSelector(state => state.auth.status);
  const authToken = useAppSelector(state => state.auth.token);
  const authUser = useAppSelector(state => state.auth.user);

  const [profileUser, setProfileUser] = React.useState<AuthUser | null>(authUser);
  const [isFetchingProfile, setIsFetchingProfile] = React.useState(false);
  const [profileFetchError, setProfileFetchError] = React.useState<string | null>(null);

  const isDark = resolvedTheme === 'dark';
  const isLoggingOut = authStatus === 'loading';

  React.useEffect(() => {
    setProfileUser(authUser);
  }, [authUser]);

  React.useEffect(() => {
    let cancelled = false;

    if (!authToken) {
      return;
    }

    setIsFetchingProfile(true);

    meService(authToken)
      .then(response => {
        if (cancelled) {
          return;
        }

        const isResident =
          response.is_resident === true ||
          (toRecord(response.user_data).is_resident as boolean | undefined) === true;

        setProfileUser(normalizeUserData(response, isResident));
        setProfileFetchError(null);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setProfileFetchError('Profil melumatlari serverden yuklenmedi');
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetchingProfile(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const profileData = React.useMemo(() => buildProfileData(profileUser), [profileUser]);

  const onLogout = React.useCallback(() => {
    dispatch(logoutThunk());
  }, [dispatch]);

  const totalBuildings = React.useMemo(
    () => profileData.complexes.reduce((acc, item) => acc + item.buildingCount, 0),
    [profileData.complexes],
  );

  const totalPermissions = React.useMemo(
    () =>
      profileData.roleAccessModules.reduce(
        (acc, item) => acc + item.permissions.length,
        0,
      ),
    [profileData.roleAccessModules],
  );

  const initials = React.useMemo(() => {
    const letters = profileData.user.name
      .split(' ')
      .map(token => token[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return letters || 'U';
  }, [profileData.user.name]);

  const heroCardStyle = isDark ? styles.heroCardDark : styles.heroCardLight;
  const sectionCardStyle = isDark ? styles.sectionCardDark : styles.sectionCardLight;
  const titleStyle = isDark ? styles.pageTitleDark : styles.pageTitleLight;
  const subTitleStyle = isDark ? styles.pageSubtitleDark : styles.pageSubtitleLight;
  const primaryTextStyle = isDark ? styles.textPrimaryDark : styles.textPrimaryLight;
  const secondaryTextStyle = isDark ? styles.textSecondaryDark : styles.textSecondaryLight;
  const settingsRouteKey = isResident ? 'resident_settings' : 'settings';
  const profileRouteKey = isResident ? 'resident_profile' : 'profile';
  const devicesRouteKey = isResident ? 'resident_my_devices' : 'my_devices';
  const notificationsRouteKey = isResident ? 'resident_notifications' : 'notifications';

  return (
    <AppPageLayout
      title="Profile"
      isDark={isDark}
      scrollable
      settingsRouteKey={settingsRouteKey}
      profileRouteKey={profileRouteKey}
      devicesRouteKey={devicesRouteKey}
      notificationsRouteKey={notificationsRouteKey}
      notificationText={
        profileFetchError ||
        (isFetchingProfile ? 'Profile syncing from API...' : 'Profile alerts')
      }
      notificationCount={profileData.notifications.count}
      mtkOptions={isResident ? propertyOptions.map(option => option.name) : undefined}
      initialMtk={isResident ? selectedPropertyName : undefined}
      onMtkChange={isResident ? onPropertyChange : undefined}
      contentContainerStyle={styles.containerPadding}
    >
      <View style={styles.content}>
        <View style={[styles.heroCard, heroCardStyle]}>
          <View style={styles.heroTopRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.heroIdentity}>
              <Text style={[styles.pageTitle, titleStyle]}>{profileData.user.name}</Text>
              <Text style={[styles.pageSubtitle, subTitleStyle]}>@{profileData.user.username}</Text>
            </View>

            <View style={styles.roleBadge}>
              <ShieldCheck size={14} color="#1d4ed8" strokeWidth={2.4} />
              <Text style={styles.roleBadgeText}>{profileData.role.name}</Text>
            </View>
          </View>

          <View style={styles.heroStatusRow}>
            <View style={styles.onlinePill}>
              <CheckCircle2 size={13} color="#15803d" strokeWidth={2.5} />
              <Text style={styles.onlinePillText}>
                {profileData.user.status ? 'Account active' : 'Account inactive'}
              </Text>
            </View>

            <View style={styles.roleMetaPill}>
              <UserCog size={13} color="#475569" strokeWidth={2.2} />
              <Text style={styles.roleMetaText}>Role ID {profileData.role.id}</Text>
            </View>
          </View>

          <Pressable
            onPress={onLogout}
            disabled={isLoggingOut}
            style={({ pressed }) => [
              styles.heroLogoutButton,
              isLoggingOut && styles.heroLogoutButtonDisabled,
              pressed && styles.heroLogoutButtonPressed,
            ]}
          >
            <LogOut size={16} color="red" strokeWidth={2.6} />
            <Text style={styles.heroLogoutButtonText}>
              {isLoggingOut ? 'Çıxış edilir...' : 'Çıxış et'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, sectionCardStyle]}>
            <BellRing size={16} color="#2563eb" strokeWidth={2.4} />
            <Text style={[styles.statValue, primaryTextStyle]}>{profileData.notifications.count}</Text>
            <Text style={[styles.statLabel, secondaryTextStyle]}>Notifications</Text>
          </View>

          <View style={[styles.statCard, sectionCardStyle]}>
            <Building2 size={16} color="#2563eb" strokeWidth={2.4} />
            <Text style={[styles.statValue, primaryTextStyle]}>{profileData.complexes.length}</Text>
            <Text style={[styles.statLabel, secondaryTextStyle]}>Complexes</Text>
          </View>

          <View style={[styles.statCard, sectionCardStyle]}>
            <MapPin size={16} color="#2563eb" strokeWidth={2.4} />
            <Text style={[styles.statValue, primaryTextStyle]}>{totalBuildings}</Text>
            <Text style={[styles.statLabel, secondaryTextStyle]}>Buildings</Text>
          </View>

          <View style={[styles.statCard, sectionCardStyle]}>
            <KeyRound size={16} color="#2563eb" strokeWidth={2.4} />
            <Text style={[styles.statValue, primaryTextStyle]}>{totalPermissions}</Text>
            <Text style={[styles.statLabel, secondaryTextStyle]}>Permissions</Text>
          </View>
        </View>

        <View style={[styles.sectionCard, sectionCardStyle]}>
          <Text style={[styles.sectionTitle, primaryTextStyle]}>Account details</Text>

          <View style={styles.infoRow}>
            <Phone size={15} color="#64748b" strokeWidth={2.4} />
            <Text style={[styles.infoLabel, secondaryTextStyle]}>Phone</Text>
            <Text style={[styles.infoValue, primaryTextStyle]}>{profileData.user.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Mail size={15} color="#64748b" strokeWidth={2.4} />
            <Text style={[styles.infoLabel, secondaryTextStyle]}>Email</Text>
            <Text style={[styles.infoValue, primaryTextStyle]}>{profileData.user.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <CalendarDays size={15} color="#64748b" strokeWidth={2.4} />
            <Text style={[styles.infoLabel, secondaryTextStyle]}>Birthday</Text>
            <Text style={[styles.infoValue, primaryTextStyle]}>
              {formatBirthday(profileData.user.birthday)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <UserCircle2 size={15} color="#64748b" strokeWidth={2.4} />
            <Text style={[styles.infoLabel, secondaryTextStyle]}>Personal code</Text>
            <Text style={[styles.infoValue, primaryTextStyle]}>{profileData.user.personalCode}</Text>
          </View>

          <View style={styles.infoRow}>
            <CalendarDays size={15} color="#64748b" strokeWidth={2.4} />
            <Text style={[styles.infoLabel, secondaryTextStyle]}>Created</Text>
            <Text style={[styles.infoValue, primaryTextStyle]}>
              {formatDateTime(profileData.user.createdAt)}
            </Text>
          </View>

          <View style={[styles.infoRow, styles.infoRowNoBorder]}>
            <CalendarDays size={15} color="#64748b" strokeWidth={2.4} />
            <Text style={[styles.infoLabel, secondaryTextStyle]}>Updated</Text>
            <Text style={[styles.infoValue, primaryTextStyle]}>
              {formatDateTime(profileData.user.updatedAt)}
            </Text>
          </View>
        </View>

        <View style={[styles.sectionCard, sectionCardStyle]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, primaryTextStyle]}>Complex portfolio</Text>
            <Text style={[styles.sectionMeta, secondaryTextStyle]}>
              total {profileData.complexes.length}
            </Text>
          </View>

          {profileData.complexes.length === 0 ? (
            <Text style={[styles.sectionMeta, secondaryTextStyle]}>
              Complex data not found in /user/me response.
            </Text>
          ) : (
            profileData.complexes.map(item => (
              <View key={item.id} style={styles.complexCard}>
                <View style={styles.complexTopRow}>
                  <View style={styles.complexTitleWrap}>
                    <View style={[styles.complexColorDot, { backgroundColor: item.colorCode }]} />
                    <Text style={[styles.complexTitle, primaryTextStyle]}>{item.name}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      item.status === 'active' ? styles.statusPillActive : styles.statusPillInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        item.status === 'active'
                          ? styles.statusPillTextActive
                          : styles.statusPillTextInactive,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.complexChipRow}>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>{item.bindMtk}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>{item.buildingCount} buildings</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>
                      {item.availableModuleCount}/{item.moduleCount} modules
                    </Text>
                  </View>
                </View>

                <View style={styles.complexInfoRow}>
                  <MapPin size={14} color="#64748b" strokeWidth={2.3} />
                  <Text style={[styles.complexInfoText, secondaryTextStyle]}>{item.address}</Text>
                </View>

                <View style={styles.complexInfoRow}>
                  <Mail size={14} color="#64748b" strokeWidth={2.3} />
                  <Text style={[styles.complexInfoText, secondaryTextStyle]}>{item.email}</Text>
                </View>

                <View style={styles.complexInfoRow}>
                  <Phone size={14} color="#64748b" strokeWidth={2.3} />
                  <Text style={[styles.complexInfoText, secondaryTextStyle]}>{item.phone}</Text>
                </View>

                {item.website ? (
                  <Pressable
                    style={styles.websiteBtn}
                    onPress={() => {
                      Linking.openURL(normalizeWebsiteUrl(item.website)).catch(() => null);
                    }}
                  >
                    <Globe size={14} color="#1d4ed8" strokeWidth={2.4} />
                    <Text style={styles.websiteBtnText}>Open website</Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
        </View>

      </View>
    </AppPageLayout>
  );
}

const styles = StyleSheet.create({
  containerPadding: {
    paddingBottom: 120,
    gap: 12,
  },
  content: {
    gap: 12,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  heroCardLight: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(37,99,235,0.18)',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.11,
    shadowRadius: 20,
    elevation: 6,
  },
  heroCardDark: {
    backgroundColor: '#131a26',
    borderColor: 'rgba(148,163,184,0.28)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'WorkSans-Bold',
  },
  heroIdentity: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: 'WorkSans-Bold',
  },
  pageTitleLight: {
    color: '#0f172a',
  },
  pageTitleDark: {
    color: '#f1f5f9',
  },
  pageSubtitle: {
    marginTop: 3,
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
  },
  pageSubtitleLight: {
    color: '#475569',
  },
  pageSubtitleDark: {
    color: '#94a3b8',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(37,99,235,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadgeText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  },
  heroStatusRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroLogoutButton: {
    marginTop: 12,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#991b1b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    display: 'flex',
  },
  heroLogoutButtonDisabled: {
    opacity: 0.78,
  },
  heroLogoutButtonPressed: {
    transform: [{ scale: 0.995 }],
  },
  heroLogoutButtonText: {
    color: 'red',
    fontSize: 13,
    fontFamily: 'WorkSans-SemiBold',
  },
  onlinePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.25)',
    backgroundColor: 'rgba(22,163,74,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlinePillText: {
    color: '#166534',
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  roleMetaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.22)',
    backgroundColor: 'rgba(100,116,139,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleMetaText: {
    color: '#334155',
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  sectionCardLight: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(148,163,184,0.23)',
  },
  sectionCardDark: {
    backgroundColor: '#111827',
    borderColor: 'rgba(100,116,139,0.35)',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'WorkSans-Bold',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionMeta: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  textPrimaryLight: {
    color: '#0f172a',
  },
  textPrimaryDark: {
    color: '#f8fafc',
  },
  textSecondaryLight: {
    color: '#64748b',
  },
  textSecondaryDark: {
    color: '#94a3b8',
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'WorkSans-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.2)',
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoRowNoBorder: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoLabel: {
    width: 92,
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
    textAlign: 'right',
  },
  alertItem: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    backgroundColor: 'rgba(148,163,184,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    marginTop: 6,
  },
  alertTextWrap: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    fontSize: 13,
    fontFamily: 'WorkSans-SemiBold',
  },
  alertMessage: {
    fontSize: 12,
    fontFamily: 'WorkSans-Regular',
    lineHeight: 17,
  },
  alertMeta: {
    fontSize: 11,
    fontFamily: 'WorkSans-Regular',
  },
  alertTime: {
    width: 84,
    fontSize: 10,
    textAlign: 'right',
    fontFamily: 'WorkSans-Medium',
  },
  complexCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    padding: 12,
    gap: 8,
    backgroundColor: 'rgba(148,163,184,0.06)',
  },
  complexTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  complexTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  complexColorDot: {
    width: 11,
    height: 11,
    borderRadius: 99,
  },
  complexTitle: {
    fontSize: 14,
    fontFamily: 'WorkSans-SemiBold',
    flexShrink: 1,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusPillActive: {
    borderColor: 'rgba(22,163,74,0.22)',
    backgroundColor: 'rgba(22,163,74,0.12)',
  },
  statusPillInactive: {
    borderColor: 'rgba(239,68,68,0.22)',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: 'WorkSans-SemiBold',
    textTransform: 'uppercase',
  },
  statusPillTextActive: {
    color: '#166534',
  },
  statusPillTextInactive: {
    color: '#b91c1c',
  },
  complexChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(37,99,235,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  metaChipText: {
    color: '#1d4ed8',
    fontSize: 10,
    fontFamily: 'WorkSans-SemiBold',
  },
  complexInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  complexInfoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  websiteBtn: {
    marginTop: 2,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(29,78,216,0.3)',
    backgroundColor: 'rgba(29,78,216,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  websiteBtnText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  permissionItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    padding: 10,
    gap: 8,
    backgroundColor: 'rgba(148,163,184,0.07)',
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  permissionTitle: {
    fontSize: 13,
    fontFamily: 'WorkSans-SemiBold',
  },
  permissionCount: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  permissionChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  permissionChip: {
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.15)',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  permissionChipText: {
    color: '#0f172a',
    fontSize: 10,
    fontFamily: 'WorkSans-SemiBold',
  },
  deviceStateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  deviceStateText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'WorkSans-Medium',
  },
});

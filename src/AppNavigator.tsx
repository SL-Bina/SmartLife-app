import React from 'react';
import { Platform, StatusBar, useWindowDimensions } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { DrawerContent } from '.';
import HomeScene from './screens/dashboard/home';
import { CourseInfoScreen, HomeDesignCourse } from './design_course';
import { IntroductionAnimationScreen } from './introduction_animation';
import HotelHomeScreen from './hotel_booking/HotelHomeScreen';
import { AppLayout, AppRouteItem, getNavigableRoutes } from './routes/routes';
import {
  ManagementBlockScreen,
  ManagementBuildingScreen,
  ManagementComplexScreen,
  ManagementMtkScreen,
  ManagementPropertyScreen,
  ManagementResidentScreen,
} from './screens/dashboard/management';
import QrScannerScreen from './screens/shared/qr-scanner';
import SettingsScreen from './screens/dashboard/settings';
import DashboardNotificationsScreen from './screens/dashboard/notifications';
import DashboardModuleScreen from './screens/dashboard/module-screen';
import DashboardUsersScreen from './screens/dashboard/users';
import { LoginScreen, SplashScreen } from './screens';
import ResidentComplexDashboardScreen from './screens/resident/complexdashboard';
import ResidentEDocumentsScreen from './screens/resident/e-documents';
import ResidentHomeScreen from './screens/resident/home';
import ResidentMyInvoicesScreen from './screens/resident/myinvoices';
import ResidentMyPropertiesScreen from './screens/resident/myproperties';
import ResidentMyServicesScreen from './screens/resident/myservices';
import ResidentNotificationsScreen from './screens/resident/notifications';
import ResidentPaymentHistoryScreen from './screens/resident/payment-history';
import ResidentTicketsScreen from './screens/resident/tickets';
import ResidentModuleScreen from './screens/resident/module-screen';
import ProfileScreen from './screens/auth/profile';
import {
  initializeAuthThunk,
  selectAuthRoleName,
  selectAuthUser,
  selectIsAuthenticated,
  selectIsAuthInitialized,
  selectIsAuthInitializing,
  selectIsResident,
} from './store/auth-slice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import DrawerContent from './DrawerContent';
import { useThemeMode } from './hooks/use-theme';
import { APP_LAYOUT_COLORS } from './theme/layout-colors';

const Drawer = createDrawerNavigator();
/**
 * TODO:- Temporarily using r-nav-stack instead of r-nav-native-stack cause of following issue:
 * https://github.com/react-navigation/react-navigation/issues/10941
 * Replace with r-nav-native-stack, once this is fixed.
 */
const Stack = createStackNavigator();
// const Stack = createNativeStackNavigator();

const createPlaceholderScreen = (
  title: string,
  subtitle?: string,
): React.FC => {
  const PlaceholderScreen: React.FC = () => (
    <DashboardModuleScreen title={title} subtitle={subtitle} />
  );

  return PlaceholderScreen;
};

// const ResidentHomeScreen: React.FC = () => {
//   const dispatch = useAppDispatch();
//   const handleLogout = React.useCallback(() => {
//     dispatch(logoutThunk());
//   }, [dispatch]);

  // return <ResidentScreen onLogout={handleLogout} />;
// };

const FinanceInvoicesScreen = createPlaceholderScreen('Finance / Invoices');
const FinancePaymentHistoryScreen = createPlaceholderScreen('Finance / Payment History');
const FinanceReportsScreen = createPlaceholderScreen('Finance / Reports');
const FinanceExpensesScreen = createPlaceholderScreen('Finance / Expenses');
const FinanceDepositScreen = createPlaceholderScreen('Finance / Deposit');
const FinanceTransfersScreen = createPlaceholderScreen('Finance / Transfers');
const FinanceDebtScreen = createPlaceholderScreen('Finance / Debt');
const ServicesScreen = createPlaceholderScreen('Services');
const DevicesListScreen = createPlaceholderScreen('Devices / List');
const DevicesConnectionScreen = createPlaceholderScreen('Devices / Connection');
const ParkingScreen = createPlaceholderScreen('Parking');
const MyDevicesScreen = createPlaceholderScreen('My Devices');
const ResidentMyDevicesScreen: React.FC = () => (
  <ResidentModuleScreen title="My Devices" subtitle="Resident panel section placeholder" />
);
const ApplicationsListScreen = createPlaceholderScreen('Applications / List');
const ApplicationsEvaluationScreen = createPlaceholderScreen('Applications / Evaluation');
const SendNotificationScreen = createPlaceholderScreen('Notifications / Send');
const NotificationArchiveScreen = createPlaceholderScreen('Notifications / Archive');
const SentSmsScreen = createPlaceholderScreen('Notifications / Sent SMS');
const CreateQueryScreen = createPlaceholderScreen('Queries / Create');
const QueriesListScreen = createPlaceholderScreen('Queries / List');
const ComplexDashboardScreen = createPlaceholderScreen('Complex Dashboard');
const KpiScreen = createPlaceholderScreen('KPI');
const ElectronicDocumentsScreen = createPlaceholderScreen('Electronic Documents');
const ReceptionScreen = createPlaceholderScreen('Reception');
const PermissionsScreen = createPlaceholderScreen('Permissions');
const DRAWER_SCREEN_MAP: Record<string, React.ComponentType<any>> = {
  home: HomeScene,
  finance_invoices: FinanceInvoicesScreen,
  finance_payment_history: FinancePaymentHistoryScreen,
  finance_reports: FinanceReportsScreen,
  finance_expenses: FinanceExpensesScreen,
  finance_deposit: FinanceDepositScreen,
  finance_transfers: FinanceTransfersScreen,
  finance_debt: FinanceDebtScreen,
  management_block: ManagementBlockScreen,
  management_building: ManagementBuildingScreen,
  management_complex: ManagementComplexScreen,
  management_mtk: ManagementMtkScreen,
  management_property: ManagementPropertyScreen,
  management_resident: ManagementResidentScreen,
  services: ServicesScreen,
  devices_list: DevicesListScreen,
  devices_connection: DevicesConnectionScreen,
  parking: ParkingScreen,
  notifications: DashboardNotificationsScreen,
  applications_list: ApplicationsListScreen,
  applications_evaluation: ApplicationsEvaluationScreen,
  notifications_send: SendNotificationScreen,
  notifications_archive: NotificationArchiveScreen,
  notifications_sent_sms: SentSmsScreen,
  queries_create: CreateQueryScreen,
  queries_list: QueriesListScreen,
  complex_dashboard: ComplexDashboardScreen,
  kpi: KpiScreen,
  electronic_documents: ElectronicDocumentsScreen,
  reception: ReceptionScreen,
  permissions: PermissionsScreen,
  users: DashboardUsersScreen,
  profile: ProfileScreen,
  my_devices: MyDevicesScreen,
  qr_scanner: QrScannerScreen,
  settings: SettingsScreen,
  resident_home: ResidentHomeScreen,
  resident_complex_dashboard: ResidentComplexDashboardScreen,
  resident_invoices: ResidentMyInvoicesScreen,
  resident_payment_history: ResidentPaymentHistoryScreen,
  resident_my_properties: ResidentMyPropertiesScreen,
  resident_my_services: ResidentMyServicesScreen,
  resident_tickets: ResidentTicketsScreen,
  resident_e_documents: ResidentEDocumentsScreen,
  resident_notifications: ResidentNotificationsScreen,
  resident_profile: ProfileScreen,
  resident_my_devices: ResidentMyDevicesScreen,
  resident_settings: SettingsScreen,
  resident_qr_scanner: QrScannerScreen,
  auth_sign_in: LoginScreen,
};

const renderDrawerContent = (props: DrawerContentComponentProps) => (
  <DrawerContent {...props} />
);

type AuthenticatedLayout = Exclude<AppLayout, 'auth'>;

const DrawerNavigator: React.FC<{
  layout: AuthenticatedLayout;
  isDark: boolean;
}> = ({ layout, isDark }) => {
  const user = useAppSelector(selectAuthUser);
  const roleName = useAppSelector(selectAuthRoleName);
  const window = useWindowDimensions();
  const drawerWidth = Math.min(window.width * 0.84, 360);
  const drawerSwipeEdgeWidth = Math.max(1, Math.round(window.width));
  const registeredDrawerRoutes = React.useMemo(
    () =>
      getNavigableRoutes(layout, user, roleName || undefined).filter(
        route => route.routeKey && DRAWER_SCREEN_MAP[route.routeKey],
      ),
    [layout, roleName, user],
  );

  const routesToRegister = React.useMemo(() => {
    if (registeredDrawerRoutes.length > 0) {
      return registeredDrawerRoutes;
    }

    const fallbackRouteKey = layout === 'resident' ? 'resident_profile' : 'profile';
    const fallbackRoute: AppRouteItem = {
      icon: 'person',
      name: 'fallback.profile',
      label: 'Profile',
      routeKey: fallbackRouteKey,
    };

    return [fallbackRoute];
  }, [layout, registeredDrawerRoutes]);

  const initialRouteName = React.useMemo(() => {
    const firstRouteKey = routesToRegister[0]?.routeKey;
    if (firstRouteKey) {
      return firstRouteKey;
    }

    return layout === 'resident' ? 'resident_profile' : 'profile';
  }, [layout, routesToRegister]);

  return (
    <Drawer.Navigator
      key={`${layout}-${roleName || 'guest'}`}
      initialRouteName={initialRouteName}
      screenOptions={{
        drawerStyle: {
          width: drawerWidth,
          backgroundColor: isDark
            ? APP_LAYOUT_COLORS.drawerDark
            : APP_LAYOUT_COLORS.drawerLight,
        },
        drawerContentStyle: {
          backgroundColor: isDark
            ? APP_LAYOUT_COLORS.drawerDark
            : APP_LAYOUT_COLORS.drawerLight,
        },
        drawerContentContainerStyle: {
          backgroundColor: isDark
            ? APP_LAYOUT_COLORS.drawerDark
            : APP_LAYOUT_COLORS.drawerLight,
        },
        sceneStyle: {
          backgroundColor: isDark
            ? APP_LAYOUT_COLORS.backgroundDark
            : APP_LAYOUT_COLORS.backgroundLight,
        },
        drawerActiveBackgroundColor: '#2a5de9',
        drawerInactiveBackgroundColor: 'transparent',
        drawerType: Platform.OS === 'android' ? 'back' : 'slide',
        overlayColor: 'rgba(15, 23, 42, 0.18)',
        configureGestureHandler: gesture =>
          gesture
            .activeOffsetX([-4, 4])
            .failOffsetY([-20, 20]),
        swipeEdgeWidth: drawerSwipeEdgeWidth,
        swipeEnabled: false,
        swipeMinDistance: Platform.OS === 'android' ? 8 : 14,
        keyboardDismissMode: 'none',
        freezeOnBlur: Platform.OS === 'android',
        headerShown: false,
      }}
      drawerContent={renderDrawerContent}
    >
      {routesToRegister.map(route => {
        const routeKey = route.routeKey as string;
        const ScreenComponent = DRAWER_SCREEN_MAP[routeKey];
        return (
          <Drawer.Screen
            key={routeKey}
            name={routeKey}
            component={ScreenComponent}
          />
        );
      })}
    </Drawer.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isResident = useAppSelector(selectIsResident);
  const isInitialized = useAppSelector(selectIsAuthInitialized);
  const isInitializing = useAppSelector(selectIsAuthInitializing);
  const [showStartupSplash, setShowStartupSplash] = React.useState(true);
  const { resolvedTheme } = useThemeMode();
  const isDark = resolvedTheme === 'dark';

  React.useEffect(() => {
    dispatch(initializeAuthThunk());
  }, [dispatch]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowStartupSplash(false);
    }, 3650);

    return () => clearTimeout(timer);
  }, []);

  if (!isInitialized || isInitializing || showStartupSplash) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent
        />

        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </>
    );
  }

  const layout: AuthenticatedLayout = isResident ? 'resident' : 'dashboard';

  return (
    <>
      <StatusBar
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
      />

      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainDrawer">
          {() => <DrawerNavigator layout={layout} isDark={isDark} />}
        </Stack.Screen>

        <Stack.Screen name="Hotel" component={HotelHomeScreen} />

        <Stack.Group>
          <Stack.Screen name="DesignCourse" component={HomeDesignCourse} />
          <Stack.Screen name="CourseInfo" component={CourseInfoScreen} />
        </Stack.Group>

        <Stack.Screen
          name="onBoarding"
          component={IntroductionAnimationScreen}
        />
      </Stack.Navigator>
    </>
  );
};

export default AppNavigator;

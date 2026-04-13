import type {
  AuthUser,
  RoleAccessModule,
  RoleAccessPermission,
  UserModule,
} from '../utils/auth';

export type AppLayout = 'dashboard' | 'resident' | 'auth';

export type AppRouteItem = {
  icon: string;
  name: string;
  label: string;
  path?: string;
  routeKey?: string;
  moduleName?: string;
  moduleId?: number;
  need?: string[];
  allowedRoles?: Array<'admin' | 'manager' | 'resident' | string>;
  hideInSidenav?: boolean;
  defaultExpanded?: boolean;
  children?: AppRouteItem[];
};

export type AppRouteLayout = {
  title?: string;
  layout: AppLayout;
  pages: AppRouteItem[];
};

export const routes: AppRouteLayout[] = [
  {
    layout: 'dashboard',
    pages: [
      {
        icon: 'home',
        name: 'sidebar.dashboard',
        label: 'Ana səhifə',
        path: '/home',
        routeKey: 'home',
        moduleName: 'dashboard',
        moduleId: 1,
      },
      {
        icon: 'payments',
        name: 'sidebar.finance',
        label: 'Maliyyə',
        defaultExpanded: true,
        children: [
          {
            icon: 'description',
            name: 'sidebar.invoices',
            label: 'Fakturalar',
            path: '/finance/invoices',
            routeKey: 'finance_invoices',
            moduleName: 'invoice',
            moduleId: 11,
          },
          {
            icon: 'table-chart',
            name: 'sidebar.paymentHistory',
            label: 'Ödəniş tarixçəsi',
            path: '/finance/payment-history',
            routeKey: 'finance_payment_history',
          },
          {
            icon: 'bar-chart',
            name: 'sidebar.reports',
            label: 'Hesabatlar',
            path: '/finance/reports',
            routeKey: 'finance_reports',
          },
          {
            icon: 'request-quote',
            name: 'sidebar.expenses',
            label: 'Xərclər',
            path: '/finance/expenses',
            routeKey: 'finance_expenses',
          },
          {
            icon: 'arrow-circle-down',
            name: 'sidebar.deposit',
            label: 'Depozit',
            path: '/finance/deposit',
            routeKey: 'finance_deposit',
            allowedRoles: ['admin', 'manager'],
          },
          {
            icon: 'swap-horiz',
            name: 'sidebar.transfers',
            label: 'Transferlər',
            path: '/finance/transfers',
            routeKey: 'finance_transfers',
            allowedRoles: ['admin', 'manager'],
          },
          {
            icon: 'receipt-long',
            name: 'sidebar.debt',
            label: 'Borc',
            path: '/finance/debt',
            routeKey: 'finance_debt',
            allowedRoles: ['admin', 'manager'],
          },
        ],
      },
      {
        icon: 'account-balance',
        name: 'sidebar.buildingManagement',
        label: 'İdarəetmə',
        moduleName: 'manage',
        moduleId: 2,
        defaultExpanded: true,
        children: [
          {
            icon: 'apartment',
            name: 'sidebar.mtk',
            label: 'MTK',
            path: '/management/mtk',
            routeKey: 'management_mtk',
            moduleName: 'mtk',
            moduleId: 3,
          },
          {
            icon: 'location-city',
            name: 'sidebar.complexes',
            label: 'Komplekslər',
            path: '/management/complexes',
            routeKey: 'management_complex',
            moduleName: 'complex',
            moduleId: 4,
          },
          {
            icon: 'business',
            name: 'sidebar.buildings',
            label: 'Binalar',
            path: '/management/buildings',
            routeKey: 'management_building',
            moduleName: 'building',
            moduleId: 5,
          },
          {
            icon: 'layers',
            name: 'sidebar.blocks',
            label: 'Bloklar',
            path: '/management/blocks',
            routeKey: 'management_block',
            moduleName: 'block',
            moduleId: 6,
          },
          {
            icon: 'home',
            name: 'sidebar.properties',
            label: 'Mənzillər',
            path: '/management/properties',
            routeKey: 'management_property',
            moduleName: 'property',
            moduleId: 7,
          },
          {
            icon: 'groups',
            name: 'sidebar.residents',
            label: 'Sakinlər',
            path: '/management/residents',
            routeKey: 'management_resident',
            moduleName: 'resident',
            moduleId: 8,
          },
        ],
      },
      {
        icon: 'miscellaneous-services',
        name: 'sidebar.services',
        label: 'Xidmətlər',
        path: '/services',
        routeKey: 'services',
        moduleName: 'service',
        moduleId: 12,
      },
      {
        icon: 'memory',
        name: 'sidebar.devices',
        label: 'Cihazlar',
        children: [
          {
            icon: 'memory',
            name: 'sidebar.deviceList',
            label: 'Cihaz siyahısı',
            path: '/devices',
            routeKey: 'devices_list',
            moduleName: 'device',
          },
          {
            icon: 'link',
            name: 'sidebar.connection',
            label: 'Qoşulma',
            path: '/devices/connection',
            routeKey: 'devices_connection',
            moduleName: 'device',
          },
        ],
      },
      {
        icon: 'local-parking',
        name: 'sidebar.parking',
        label: 'Parking',
        path: '/parking',
        routeKey: 'parking',
        moduleName: 'parking',
      },
      {
        icon: 'notifications',
        name: 'sidebar.notifications',
        label: 'Bildirişlər',
        path: '/notifications',
        routeKey: 'notifications',
      },
      {
        icon: 'help-center',
        name: 'sidebar.applications',
        label: 'Müraciətlər',
        children: [
          {
            icon: 'table-chart',
            name: 'sidebar.applicationsList',
            label: 'Müraciət siyahısı',
            path: '/applications/list',
            routeKey: 'applications_list',
          },
          {
            icon: 'bar-chart',
            name: 'sidebar.applicationsEvaluation',
            label: 'Müraciət qiymətləndirmə',
            path: '/applications/evaluation',
            routeKey: 'applications_evaluation',
          },
        ],
      },
      {
        icon: 'campaign',
        name: 'sidebar.notificationsAndQueries',
        label: 'Bildiriş və sorğular',
        children: [
          {
            icon: 'send',
            name: 'sidebar.sendNotification',
            label: 'Bildiriş göndər',
            path: '/notifications/send',
            routeKey: 'notifications_send',
          },
          {
            icon: 'archive',
            name: 'sidebar.notificationArchive',
            label: 'Bildiriş arxivi',
            path: '/notifications/archive',
            routeKey: 'notifications_archive',
          },
          {
            icon: 'sms',
            name: 'sidebar.sentSMS',
            label: 'Göndərilən SMS',
            path: '/notifications/sent-sms',
            routeKey: 'notifications_sent_sms',
          },
          {
            icon: 'post-add',
            name: 'sidebar.createQuery',
            label: 'Sorğu yarat',
            path: '/queries/create',
            routeKey: 'queries_create',
          },
          {
            icon: 'quiz',
            name: 'sidebar.queries',
            label: 'Sorğular',
            path: '/queries',
            routeKey: 'queries_list',
          },
        ],
      },
      {
        icon: 'analytics',
        name: 'sidebar.complexDashboard',
        label: 'Kompleks dashboard',
        path: '/complex-dashboard',
        routeKey: 'complex_dashboard',
      },
      {
        icon: 'insights',
        name: 'sidebar.kpi',
        label: 'KPI',
        path: '/kpi',
        routeKey: 'kpi',
      },
      {
        icon: 'menu-book',
        name: 'sidebar.electronicDocuments',
        label: 'Elektron sənədlər',
        path: '/e-documents',
        routeKey: 'electronic_documents',
      },
      {
        icon: 'inbox',
        name: 'sidebar.reception',
        label: 'Qəbul',
        path: '/reception',
        routeKey: 'reception',
      },
      {
        icon: 'shield',
        name: 'sidebar.permissions',
        label: 'İcazələr',
        path: '/permissions',
        routeKey: 'permissions',
        moduleName: 'permission',
        moduleId: 13,
      },
      {
        icon: 'people',
        name: 'sidebar.users',
        label: 'İstifadəçilər',
        path: '/users',
        routeKey: 'users',
        moduleName: 'user',
        moduleId: 16,
        hideInSidenav: false,
      },
      {
        icon: 'person',
        name: 'sidebar.profile',
        label: 'Profil',
        path: '/profile',
        routeKey: 'profile',
      },
      {
        icon: 'memory',
        name: 'sidebar.myDevices',
        label: 'Mənim cihazlarım',
        path: '/my-devices',
        routeKey: 'my_devices',
        hideInSidenav: true,
      },
      {
        icon: 'qr-code-scanner',
        name: 'sidebar.qrScanner',
        label: 'QR Scanner',
        path: '/qr-scanner',
        routeKey: 'qr_scanner',
        hideInSidenav: true,
      },
      {
        icon: 'settings',
        name: 'sidebar.settings',
        label: 'Tənzimləmələr',
        path: '/settings',
        routeKey: 'settings',
        hideInSidenav: true,
      },
    ],
  },
  {
    layout: 'resident',
    pages: [
      {
        icon: 'home',
        name: 'sidebar.dashboard',
        label: 'Ana səhifə',
        path: '/home',
        routeKey: 'resident_home',
      },
      {
        icon: 'analytics',
        name: 'sidebar.complexDashboard',
        label: 'Kompleks lövhəsi',
        path: '/complex-dashboard',
        routeKey: 'resident_complex_dashboard',
      },
      {
        icon: 'description',
        name: 'sidebar.myInvoices',
        label: 'Fakturalarım',
        path: '/invoices',
        routeKey: 'resident_invoices',
      },
      {
        icon: 'table-chart',
        name: 'Ödəniş Tarixcəsi',
        label: 'Ödəniş tarixçəsi',
        path: '/payment-history',
        routeKey: 'resident_payment_history',
      },
      {
        icon: 'home-work',
        name: 'sidebar.myProperty',
        label: 'Mənzilim',
        path: '/my-properties',
        routeKey: 'resident_my_properties',
      },
      {
        icon: 'miscellaneous-services',
        name: 'sidebar.myServices',
        label: 'Xidmətlərim',
        path: '/my-services',
        routeKey: 'resident_my_services',
      },
      {
        icon: 'support-agent',
        name: 'sidebar.applicationsList',
        label: 'Müraciətlər',
        path: '/tickets',
        routeKey: 'resident_tickets',
      },
      {
        icon: 'menu-book',
        name: 'sidebar.eDocuments',
        label: 'Elektron sənədlər',
        path: '/e-documents',
        routeKey: 'resident_e_documents',
      },
      {
        icon: 'notifications',
        name: 'sidebar.notifications',
        label: 'Bildirişlər',
        path: '/notifications',
        routeKey: 'resident_notifications',
      },
      {
        icon: 'person',
        name: 'sidebar.profile',
        label: 'Profil',
        path: '/profile',
        routeKey: 'resident_profile',
      },
      {
        icon: 'memory',
        name: 'sidebar.myDevices',
        label: 'Mənim cihazlarım',
        path: '/my-devices',
        routeKey: 'resident_my_devices',
        hideInSidenav: true,
      },
      {
        icon: 'qr-code-scanner',
        name: 'sidebar.qrScanner',
        label: 'QR Scanner',
        path: '/qr-scanner',
        routeKey: 'resident_qr_scanner',
        hideInSidenav: true,
      },
      {
        icon: 'settings',
        name: 'sidebar.settings',
        label: 'Tənzimləmələr',
        path: '/settings',
        routeKey: 'resident_settings',
        hideInSidenav: true,
      },
    ],
  },
  {
    title: 'auth pages',
    layout: 'auth',
    pages: [
      {
        icon: 'login',
        name: 'sign in',
        label: 'Sign In',
        path: '/sign-in',
        routeKey: 'auth_sign_in',
        hideInSidenav: true,
      },
    ],
  },
];

export function getLayoutRoutes(layout: AppLayout): AppRouteItem[] {
  return routes.find(route => route.layout === layout)?.pages ?? [];
}

type AppRole = 'admin' | 'manager' | 'resident' | string;

type ModuleAccess = {
  id?: number | null;
  name?: string | null;
  can: string[];
};

type ModulesIndex = {
  byId: Map<number, ModuleAccess>;
  byName: Map<string, ModuleAccess>;
  isRoot: boolean;
};

const toRoleName = (user?: AuthUser | null, role?: AppRole): string | null => {
  if (role) {
    return String(role).toLowerCase();
  }

  if (!user?.role?.name) {
    return null;
  }

  return String(user.role.name).toLowerCase();
};

const toPermissionName = (permission: RoleAccessPermission): string | null => {
  if (typeof permission === 'string') {
    return permission;
  }

  if (permission && typeof permission.permission === 'string') {
    return permission.permission;
  }

  return null;
};

const getRoleAccessModuleId = (mod: RoleAccessModule): number | null => {
  if (typeof mod.module_id === 'number') {
    return mod.module_id;
  }

  if (typeof mod.moduleId === 'number') {
    return mod.moduleId;
  }

  return null;
};

const getRoleAccessModuleName = (mod: RoleAccessModule): string | null => {
  if (typeof mod.module_name === 'string') {
    return mod.module_name;
  }

  if (typeof mod.moduleName === 'string') {
    return mod.moduleName;
  }

  return null;
};

function buildModulesIndex(
  userModules: UserModule[] = [],
  roleAccessModules: RoleAccessModule[] = [],
  roleName?: string | null,
): ModulesIndex {
  const byId = new Map<number, ModuleAccess>();
  const byName = new Map<string, ModuleAccess>();
  const isRoot = roleName === 'root';

  roleAccessModules.forEach(mod => {
    if (!mod || typeof mod !== 'object') {
      return;
    }

    const moduleId = getRoleAccessModuleId(mod);
    const moduleName = getRoleAccessModuleName(mod);
    const permissions = Array.isArray(mod.permissions)
      ? mod.permissions
          .map(permission => toPermissionName(permission))
          .filter((value): value is string => Boolean(value))
      : [];

    const moduleAccess: ModuleAccess = {
      id: moduleId,
      name: moduleName,
      can: permissions,
    };

    if (moduleId !== null) {
      byId.set(moduleId, moduleAccess);
    }

    if (moduleName) {
      byName.set(moduleName.toLowerCase(), moduleAccess);
    }
  });

  userModules.forEach(mod => {
    if (!mod || typeof mod !== 'object') {
      return;
    }

    const moduleId = typeof mod.id === 'number' ? mod.id : null;
    const moduleName = typeof mod.name === 'string' ? mod.name : null;
    const moduleCan = Array.isArray(mod.can)
      ? mod.can.filter((perm): perm is string => typeof perm === 'string')
      : [];

    const moduleAccess: ModuleAccess = {
      id: moduleId,
      name: moduleName,
      can: moduleCan,
    };

    if (moduleId !== null && !byId.has(moduleId)) {
      byId.set(moduleId, moduleAccess);
    }

    if (moduleName && !byName.has(moduleName.toLowerCase())) {
      byName.set(moduleName.toLowerCase(), moduleAccess);
    }
  });

  return {
    byId,
    byName,
    isRoot,
  };
}

function isRouteAllowed(route: AppRouteItem, role?: AppRole): boolean {
  if (typeof role === 'string' && role.toLowerCase() === 'root') {
    return true;
  }

  if (!role || !route.allowedRoles?.length) {
    return true;
  }

  return route.allowedRoles.includes(role);
}

function canAccessByModules(route: AppRouteItem, modulesIndex: ModulesIndex): boolean {
  if (modulesIndex.isRoot) {
    return true;
  }

  const requiredPermissions = Array.isArray(route.need) ? route.need : [];

  if (route.moduleName) {
    const moduleByName = modulesIndex.byName.get(route.moduleName.toLowerCase());
    if (!moduleByName) {
      return false;
    }

    if (requiredPermissions.length === 0) {
      return true;
    }

    return requiredPermissions.every(permission => moduleByName.can.includes(permission));
  }

  if (typeof route.moduleId === 'number') {
    const moduleById = modulesIndex.byId.get(route.moduleId);
    if (!moduleById) {
      return false;
    }

    if (requiredPermissions.length === 0) {
      return true;
    }

    return requiredPermissions.every(permission => moduleById.can.includes(permission));
  }

  return true;
}

function filterRoutesByRoleAndAccess(
  items: AppRouteItem[],
  role?: AppRole,
  user?: AuthUser | null,
): AppRouteItem[] {
  const roleName = toRoleName(user, role);
  const modulesIndex = buildModulesIndex(
    user?.modules ?? [],
    user?.role_access_modules ?? [],
    roleName,
  );

  return items.reduce<AppRouteItem[]>((acc, item) => {
    const filteredChildren = item.children
      ? filterRoutesByRoleAndAccess(item.children, role, user)
      : undefined;

    const hasChildren = !!filteredChildren && filteredChildren.length > 0;
    const roleAllowed = isRouteAllowed(item, role);
    const moduleAllowed = canAccessByModules(item, modulesIndex);

    const shouldInclude = (roleAllowed && moduleAllowed) || hasChildren;

    if (!shouldInclude) {
      return acc;
    }

    acc.push({
      ...item,
      children: filteredChildren,
    });

    return acc;
  }, []);
}

function filterHiddenFromSidenav(items: AppRouteItem[]): AppRouteItem[] {
  return items.reduce<AppRouteItem[]>((acc, item) => {
    if (item.hideInSidenav) {
      return acc;
    }

    const visibleChildren = item.children
      ? filterHiddenFromSidenav(item.children)
      : undefined;

    acc.push({
      ...item,
      children: visibleChildren,
    });

    return acc;
  }, []);
}

export function getDrawerMenuRoutes(
  layout: AppLayout,
  user?: AuthUser | null,
  role?: AppRole,
): AppRouteItem[] {
  return filterHiddenFromSidenav(
    filterRoutesByRoleAndAccess(getLayoutRoutes(layout), role, user),
  );
}

function flattenRoutes(items: AppRouteItem[]): AppRouteItem[] {
  return items.flatMap(item => [item, ...(item.children ? flattenRoutes(item.children) : [])]);
}

export function getNavigableRoutes(
  layout: AppLayout,
  user?: AuthUser | null,
  role?: AppRole,
): AppRouteItem[] {
  return flattenRoutes(
    filterRoutesByRoleAndAccess(getLayoutRoutes(layout), role, user),
  ).filter(route => !!route.routeKey);
}

export default routes;

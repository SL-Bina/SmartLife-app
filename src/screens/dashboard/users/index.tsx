import React from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import AppPageLayout from '../../../components/common/app-page-layout';
import { useThemeMode } from '../../../hooks/use-theme';
import { usersAPI } from '../../../services/management';
import { APP_LAYOUT_COLORS } from '../../../theme/layout-colors';

type Dictionary = Record<string, unknown>;

type LookupRole = {
    id: number | string;
    name: string;
    role_access_modules?: Array<Dictionary>;
};

type LookupItem = {
    id: number | string;
    name: string;
};

type PermissionItem = {
    id: number | string;
    name: string;
    module_id?: number | string | null;
};

type MtkComplexPair = {
    mtk_id: number | string | null;
    complex_id: number | string | null;
};

type UserRow = {
    id: number | string | null;
    name: string;
    username: string;
    email: string;
    phone: string;
    status: string;
    roleName: string;
};

type UserViewData = {
    name: string;
    username: string;
    email: string;
    phone: string;
    roleName: string;
    status: string;
    birthday: string;
    personalCode: string;
    typeLabel: string;
    userKind: string;
};

type UserFormState = {
    name: string;
    username: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    birthday: string;
    personal_code: string;
    type: number;
    is_user: number;
    role_id: number | string | '';
    modules: Array<number | string>;
    mtkComplexPairs: MtkComplexPair[];
    apartments: Array<number | string>;
    permissions: Array<number | string>;
    assigned_access_preview: string;
    profile_photo: unknown;
};

const FETCH_PER_PAGE = 24;
const SEARCH_DEBOUNCE_MS = 320;

const typeOptions = [
    { id: 1, name: 'Istifadeci' },
    { id: 2, name: 'Teshkilat' },
];

const emptyForm: UserFormState = {
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    birthday: '',
    personal_code: '',
    type: 1,
    is_user: 1,
    role_id: '',
    modules: [],
    mtkComplexPairs: [],
    apartments: [],
    permissions: [],
    assigned_access_preview: '',
    profile_photo: null,
};

const toRecord = (value: unknown): Dictionary => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as Dictionary;
    }

    return {};
};

const asString = (value: unknown): string => {
    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    return '';
};

const toNumberSafe = (value: unknown): number | null => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return null;
    }

    return parsed;
};

const normalizeId = (value: unknown): number | string | null => {
    if (typeof value === 'number' || typeof value === 'string') {
        return value;
    }

    return null;
};

const normalizeList = (payload: unknown): unknown[] => {
    const root = toRecord(payload);
    const first = root.data;
    const second = toRecord(first).data;
    const third = toRecord(second).data;
    const candidates = [
        payload,
        first,
        second,
        third,
        toRecord(first).items,
        toRecord(second).items,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }
    }

    return [];
};

const extractLastPage = (payload: unknown): number => {
    const root = toRecord(payload);
    const firstData = toRecord(root.data);
    const secondData = toRecord(firstData.data);

    const value =
        firstData.last_page
        ?? toRecord(firstData.meta).last_page
        ?? secondData.last_page
        ?? toRecord(secondData.meta).last_page
        ?? 1;

    const normalized = toNumberSafe(value);
    return normalized && normalized > 0 ? normalized : 1;
};

const mapUser = (item: unknown): UserRow => {
    const row = toRecord(item);
    const userData = toRecord(row.user_data);
    const role = toRecord(row.role);

    return {
        id: normalizeId(row.id ?? row.user_id ?? userData.id),
        name: asString(row.name || userData.name || row.full_name).trim(),
        username: asString(row.username || userData.username).trim(),
        email: asString(row.email || userData.email).trim(),
        phone: asString(row.phone || userData.phone).trim(),
        status: asString(row.status || row.user_status || 'active').trim(),
        roleName: asString(role.name || row.user_role).trim(),
    };
};

const mergeUniqueUsers = (current: UserRow[], incoming: UserRow[]): UserRow[] => {
    const map = new Map<string, UserRow>();

    current.forEach(user => {
        const key = user.id !== null ? String(user.id) : `${user.email}-${user.username}`;
        map.set(key, user);
    });

    incoming.forEach(user => {
        const key = user.id !== null ? String(user.id) : `${user.email}-${user.username}`;
        map.set(key, user);
    });

    return Array.from(map.values());
};

const getRoleId = (role: LookupRole | null): number | null => {
    if (!role) {
        return null;
    }

    return toNumberSafe((role as Dictionary).id ?? (role as Dictionary).role_id);
};

const getRoleAccessMeta = (role: LookupRole | null) => {
    const modules = Array.isArray(role?.role_access_modules) ? role.role_access_modules : [];
    const allowedModuleIds = new Set<number>();
    const allowedPermissionIds = new Set<number>();

    modules.forEach(moduleItem => {
        const moduleRecord = toRecord(moduleItem);
        const moduleId = toNumberSafe(moduleRecord.module_id ?? moduleRecord.id);
        if (moduleId !== null) {
            allowedModuleIds.add(moduleId);
        }

        const permissions = Array.isArray(moduleRecord.permissions) ? moduleRecord.permissions : [];
        permissions.forEach(permissionItem => {
            const permissionId = toNumberSafe(toRecord(permissionItem).id);
            if (permissionId !== null) {
                allowedPermissionIds.add(permissionId);
            }
        });
    });

    return { allowedModuleIds, allowedPermissionIds };
};

const buildRoleAccessPreview = (role: LookupRole | null): string => {
    if (!role) {
        return '';
    }

    const roleModules = Array.isArray(role.role_access_modules) ? role.role_access_modules : [];
    if (roleModules.length === 0) {
        return 'Secilen role aid modul ve icaze tapilmadi';
    }

    const header = `Secilen role ucun access xulasesi\nModul sayi: ${roleModules.length}\n`;
    const body = roleModules
        .map((moduleItem, index) => {
            const moduleRecord = toRecord(moduleItem);
            const moduleName =
                asString(moduleRecord.module_name).trim() || `Modul #${asString(moduleRecord.module_id) || '-'}`;

            const permissions = Array.isArray(moduleRecord.permissions) ? moduleRecord.permissions : [];
            if (permissions.length === 0) {
                return `${index + 1}) ${moduleName}\n   - Icazeler: yoxdur`;
            }

            const permissionLines = permissions
                .map(permissionItem => {
                    const permissionRecord = toRecord(permissionItem);
                    return asString(permissionRecord.permission || permissionRecord.name || permissionRecord.id).trim();
                })
                .filter(Boolean)
                .map(permissionName => `   - ${permissionName}`)
                .join('\n');

            return `${index + 1}) ${moduleName}\n   Icazeler:\n${permissionLines}`;
        })
        .join('\n\n');

    return `${header}\n${body}`;
};

const getStatusLabel = (status: string): string => {
    const normalized = status.trim().toLowerCase();
    if (normalized === 'active') {
        return 'Aktiv';
    }

    if (normalized === 'inactive') {
        return 'Qeyri-aktiv';
    }

    return status || '-';
};

const toTypeLabel = (value: unknown): string => {
    return toNumberSafe(value) === 2 ? 'Teshkilat' : 'Istifadeci';
};

const toUserKindLabel = (value: unknown): string => {
    if (toNumberSafe(value) === 0) {
        return 'System';
    }

    return 'User';
};

const buildUserViewFallback = (item: UserRow): UserViewData => {
    return {
        name: item.name || '-',
        username: item.username || '-',
        email: item.email || '-',
        phone: item.phone || '-',
        roleName: item.roleName || '-',
        status: item.status || '-',
        birthday: '-',
        personalCode: '-',
        typeLabel: '-',
        userKind: '-',
    };
};

const mapUserViewData = (payload: unknown, fallback: UserViewData): UserViewData => {
    const root = toRecord(payload);
    const firstData = toRecord(root.data);
    const candidate = Object.keys(toRecord(firstData.data)).length > 0 ? toRecord(firstData.data) : firstData;
    const role = toRecord(candidate.role);

    return {
        name: asString(candidate.name || fallback.name).trim() || '-',
        username: asString(candidate.username || fallback.username).trim() || '-',
        email: asString(candidate.email || fallback.email).trim() || '-',
        phone: asString(candidate.phone || fallback.phone).trim() || '-',
        roleName: asString(role.name || candidate.user_role || fallback.roleName).trim() || '-',
        status: asString(candidate.status || candidate.user_status || fallback.status).trim() || '-',
        birthday: asString(candidate.birthday).trim() || '-',
        personalCode: asString(candidate.personal_code).trim() || '-',
        typeLabel: toTypeLabel(candidate.type),
        userKind: toUserKindLabel(candidate.is_user),
    };
};

export default function DashboardUsersScreen() {
    const { resolvedTheme } = useThemeMode();
    const isDark = resolvedTheme === 'dark';

    const [searchName, setSearchName] = React.useState('');
    const [users, setUsers] = React.useState<UserRow[]>([]);
    const [loadingInitial, setLoadingInitial] = React.useState(true);
    const [loadingMore, setLoadingMore] = React.useState(false);
    const [refreshingUsers, setRefreshingUsers] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [hasMore, setHasMore] = React.useState(true);
    const requestTokenRef = React.useRef(0);

    const [lookups, setLookups] = React.useState<{
        roles: LookupRole[];
        modules: LookupItem[];
        mtks: LookupItem[];
        complexes: LookupItem[];
        permissions: PermissionItem[];
    }>({
        roles: [],
        modules: [],
        mtks: [],
        complexes: [],
        permissions: [],
    });

    const [feedback, setFeedback] = React.useState<{ type: '' | 'error' | 'success'; message: string }>({
        type: '',
        message: '',
    });

    const [formOpen, setFormOpen] = React.useState(false);
    const [formData, setFormData] = React.useState<UserFormState>(emptyForm);
    const [formSaving, setFormSaving] = React.useState(false);
    const [viewOpen, setViewOpen] = React.useState(false);
    const [viewLoading, setViewLoading] = React.useState(false);
    const [viewData, setViewData] = React.useState<UserViewData | null>(null);
    const viewTokenRef = React.useRef(0);
    const [selectedRoleDetails, setSelectedRoleDetails] = React.useState<LookupRole | null>(null);
    const [loadingRoleDetails, setLoadingRoleDetails] = React.useState(false);
    const [loadingMtkComplexes, setLoadingMtkComplexes] = React.useState(false);
    const [mtkComplexesMap, setMtkComplexesMap] = React.useState<Record<string, LookupItem[]>>({});

    const [rolePickerOpen, setRolePickerOpen] = React.useState(false);
    const [typePickerOpen, setTypePickerOpen] = React.useState(false);
    const [activePairMtkPicker, setActivePairMtkPicker] = React.useState<number | null>(null);
    const [activePairComplexPicker, setActivePairComplexPicker] = React.useState<number | null>(null);

    const closeAllPickers = React.useCallback(() => {
        setRolePickerOpen(false);
        setTypePickerOpen(false);
        setActivePairMtkPicker(null);
        setActivePairComplexPicker(null);
    }, []);

    const fetchLookups = React.useCallback(async () => {
        try {
            const [rolesRes, modulesRes, mtksRes, complexesRes] = await Promise.all([
                usersAPI.getRoles(),
                usersAPI.getModules(),
                usersAPI.getMtks(),
                usersAPI.getComplexes(),
            ]);

            const roles = normalizeList(rolesRes)
                .map(item => {
                    const record = toRecord(item);
                    return {
                        id: record.role_id ?? record.id ?? '',
                        name: asString(record.role_name || record.name).trim(),
                        role_access_modules: Array.isArray(record.role_access_modules)
                            ? (record.role_access_modules as Array<Dictionary>)
                            : [],
                    };
                })
                .filter(item => item.id !== '' && item.name.length > 0) as LookupRole[];

            const modulesRaw = normalizeList(modulesRes);
            const modules = modulesRaw
                .map(item => {
                    const record = toRecord(item);
                    const moduleRecord = toRecord(record.module);
                    return {
                        id: moduleRecord.id as number | string,
                        name: asString(moduleRecord.name).trim(),
                    };
                })
                .filter(item => (typeof item.id === 'number' || typeof item.id === 'string') && item.name.length > 0);

            const permissions: PermissionItem[] = [];
            modulesRaw.forEach(item => {
                const moduleRecord = toRecord(toRecord(item).module);
                const moduleId = moduleRecord.id as number | string | undefined;
                const modulePermissions = Array.isArray(moduleRecord.permissions)
                    ? moduleRecord.permissions
                    : [];

                modulePermissions.forEach(permissionItem => {
                    const permissionRecord = toRecord(permissionItem);
                    if (permissionRecord.id === undefined || permissionRecord.id === null) {
                        return;
                    }

                    permissions.push({
                        id: permissionRecord.id as number | string,
                        name: asString(permissionRecord.permission || permissionRecord.name).trim(),
                        module_id: (moduleId as number | string | undefined) ?? null,
                    });
                });
            });

            const mtks = normalizeList(mtksRes)
                .map(item => {
                    const record = toRecord(item);
                    return { id: record.id as number | string, name: asString(record.name).trim() };
                })
                .filter(item => (typeof item.id === 'number' || typeof item.id === 'string') && item.name.length > 0);

            const complexes = normalizeList(complexesRes)
                .map(item => {
                    const record = toRecord(item);
                    return { id: record.id as number | string, name: asString(record.name).trim() };
                })
                .filter(item => (typeof item.id === 'number' || typeof item.id === 'string') && item.name.length > 0);

            setLookups({ roles, modules, mtks, complexes, permissions });
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error instanceof Error ? error.message : 'Lookup melumatlari yuklenmedi',
            });
        }
    }, []);

    React.useEffect(() => {
        void fetchLookups();
    }, [fetchLookups]);

    const loadUsersPage = React.useCallback(
        async (targetPage: number, options?: { reset?: boolean; refresh?: boolean }) => {
            const reset = Boolean(options?.reset);
            const refresh = Boolean(options?.refresh);

            if (reset) {
                setLoadingInitial(!refresh);
                setRefreshingUsers(refresh);
                requestTokenRef.current += 1;
            } else {
                setLoadingMore(true);
            }

            const token = requestTokenRef.current;

            try {
                const params: Record<string, unknown> = {
                    page: targetPage,
                    per_page: FETCH_PER_PAGE,
                };

                if (searchName.trim()) {
                    params.search = searchName.trim();
                }

                const response = await usersAPI.getAll(params);

                if (reset && token !== requestTokenRef.current) {
                    return;
                }

                const list = normalizeList(toRecord(response).data).map(mapUser);
                const lastPage = extractLastPage(response);

                setUsers(prev => (reset ? list : mergeUniqueUsers(prev, list)));
                setCurrentPage(targetPage);
                setHasMore(targetPage < lastPage && list.length > 0);
                setFeedback({ type: '', message: '' });
            } catch (error) {
                if (reset) {
                    setUsers([]);
                }

                setFeedback({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Istifadeci siyahisi yuklenmedi',
                });
            } finally {
                if (reset) {
                    setLoadingInitial(false);
                    setRefreshingUsers(false);
                } else {
                    setLoadingMore(false);
                }
            }
        },
        [searchName],
    );

    React.useEffect(() => {
        const timer = setTimeout(() => {
            void loadUsersPage(1, { reset: true });
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
        };
    }, [loadUsersPage]);

    const onReachEnd = React.useCallback(() => {
        if (!hasMore || loadingMore || loadingInitial || refreshingUsers) {
            return;
        }

        void loadUsersPage(currentPage + 1);
    }, [currentPage, hasMore, loadUsersPage, loadingInitial, loadingMore, refreshingUsers]);

    const openCreate = React.useCallback(() => {
        setFormData(emptyForm);
        setSelectedRoleDetails(null);
        closeAllPickers();
        setFormOpen(true);
    }, [closeAllPickers]);

    const closeViewModal = React.useCallback(() => {
        viewTokenRef.current += 1;
        setViewOpen(false);
        setViewLoading(false);
    }, []);

    const openViewModal = React.useCallback(async (item: UserRow) => {
        const fallback = buildUserViewFallback(item);
        const token = viewTokenRef.current + 1;
        viewTokenRef.current = token;

        setViewData(fallback);
        setViewOpen(true);

        if (item.id === null || item.id === undefined) {
            return;
        }

        setViewLoading(true);
        try {
            const response = await usersAPI.getById(item.id);
            if (token !== viewTokenRef.current) {
                return;
            }

            setViewData(mapUserViewData(response, fallback));
        } catch {
            if (token === viewTokenRef.current) {
                setViewData(fallback);
            }
        } finally {
            if (token === viewTokenRef.current) {
                setViewLoading(false);
            }
        }
    }, []);

    const selectedRoleForForm = React.useMemo(() => {
        if (selectedRoleDetails) {
            return selectedRoleDetails;
        }

        const selectedRoleId = toNumberSafe(formData.role_id);
        if (selectedRoleId === null) {
            return null;
        }

        return lookups.roles.find(role => getRoleId(role) === selectedRoleId) || null;
    }, [formData.role_id, lookups.roles, selectedRoleDetails]);

    const selectedRoleLabel = React.useMemo(() => {
        return selectedRoleForForm?.name || 'Rol secin';
    }, [selectedRoleForForm]);

    const selectedTypeLabel = React.useMemo(() => {
        return typeOptions.find(item => item.id === formData.type)?.name || 'Tip secin';
    }, [formData.type]);

    React.useEffect(() => {
        if (!formOpen) {
            return;
        }

        if (!selectedRoleForForm) {
            setFormData(prev => {
                if (prev.modules.length === 0 && prev.permissions.length === 0 && !prev.assigned_access_preview) {
                    return prev;
                }

                return {
                    ...prev,
                    modules: [],
                    permissions: [],
                    assigned_access_preview: '',
                };
            });
            return;
        }

        const { allowedModuleIds, allowedPermissionIds } = getRoleAccessMeta(selectedRoleForForm);
        const assignedModuleIds = Array.from(allowedModuleIds);
        const assignedPermissionIds = Array.from(allowedPermissionIds);
        const assignedPreview = buildRoleAccessPreview(selectedRoleForForm);

        setFormData(prev => {
            const currentModules = prev.modules
                .map(item => toNumberSafe(item))
                .filter((item): item is number => item !== null);
            const currentPermissions = prev.permissions
                .map(item => toNumberSafe(item))
                .filter((item): item is number => item !== null);

            const sameModules =
                currentModules.length === assignedModuleIds.length
                && assignedModuleIds.every(id => currentModules.includes(id));

            const samePermissions =
                currentPermissions.length === assignedPermissionIds.length
                && assignedPermissionIds.every(id => currentPermissions.includes(id));

            const samePreview = prev.assigned_access_preview === assignedPreview;
            if (sameModules && samePermissions && samePreview) {
                return prev;
            }

            return {
                ...prev,
                modules: assignedModuleIds,
                permissions: assignedPermissionIds,
                assigned_access_preview: assignedPreview,
            };
        });
    }, [formOpen, selectedRoleForForm]);

    React.useEffect(() => {
        const selectedRoleId = toNumberSafe(formData.role_id);
        if (!formOpen || selectedRoleId === null) {
            setSelectedRoleDetails(null);
            return;
        }

        let cancelled = false;
        setLoadingRoleDetails(true);

        usersAPI
            .getRoleById(selectedRoleId)
            .then(response => {
                if (cancelled) {
                    return;
                }

                const roleRecord = toRecord(toRecord(response).data);
                setSelectedRoleDetails({
                    id: roleRecord.id as number | string,
                    name: asString(roleRecord.name || roleRecord.role_name).trim(),
                    role_access_modules: Array.isArray(roleRecord.role_access_modules)
                        ? (roleRecord.role_access_modules as Array<Dictionary>)
                        : [],
                });
            })
            .catch(() => {
                if (!cancelled) {
                    setSelectedRoleDetails(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingRoleDetails(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [formData.role_id, formOpen]);

    const fetchComplexesForMtk = React.useCallback(
        async (mtkId: number | string | null) => {
            if (mtkId === null || mtkId === undefined || mtkComplexesMap[String(mtkId)]) {
                return;
            }

            setLoadingMtkComplexes(true);
            try {
                const response = await usersAPI.getComplexesByMtk([mtkId]);
                const complexes = normalizeList(response)
                    .map(item => {
                        const record = toRecord(item);
                        return { id: record.id as number | string, name: asString(record.name).trim() };
                    })
                    .filter(item => (typeof item.id === 'number' || typeof item.id === 'string') && item.name.length > 0);

                setMtkComplexesMap(prev => ({
                    ...prev,
                    [String(mtkId)]: complexes,
                }));
            } catch {
                // Keep fallback behavior by using full complexes list.
            } finally {
                setLoadingMtkComplexes(false);
            }
        },
        [mtkComplexesMap],
    );

    React.useEffect(() => {
        if (!formOpen || formData.mtkComplexPairs.length === 0) {
            return;
        }

        formData.mtkComplexPairs
            .map(pair => pair.mtk_id)
            .filter((mtkId): mtkId is number | string => mtkId !== null && mtkId !== undefined)
            .forEach(mtkId => {
                void fetchComplexesForMtk(mtkId);
            });
    }, [fetchComplexesForMtk, formData.mtkComplexPairs, formOpen]);

    const addMtkComplexPair = React.useCallback(() => {
        setFormData(prev => ({
            ...prev,
            mtkComplexPairs: [...prev.mtkComplexPairs, { mtk_id: null, complex_id: null }],
        }));
    }, []);

    const removeMtkComplexPair = React.useCallback((index: number) => {
        setFormData(prev => ({
            ...prev,
            mtkComplexPairs: prev.mtkComplexPairs.filter((_, pairIndex) => pairIndex !== index),
        }));

        if (activePairMtkPicker === index) {
            setActivePairMtkPicker(null);
        }
        if (activePairComplexPicker === index) {
            setActivePairComplexPicker(null);
        }
    }, [activePairComplexPicker, activePairMtkPicker]);

    const updateMtkComplexPair = React.useCallback(
        (index: number, field: 'mtk_id' | 'complex_id', value: number | string | null) => {
            if (field === 'mtk_id' && value !== null) {
                void fetchComplexesForMtk(value);
            }

            setFormData(prev => {
                const updated = [...prev.mtkComplexPairs];
                const current = updated[index] ?? { mtk_id: null, complex_id: null };

                updated[index] =
                    field === 'mtk_id'
                        ? { ...current, mtk_id: value, complex_id: null }
                        : { ...current, complex_id: value };

                return {
                    ...prev,
                    mtkComplexPairs: updated,
                };
            });
        },
        [fetchComplexesForMtk],
    );

    const getComplexesByMtk = React.useCallback(
        (mtkId: number | string | null) => {
            if (mtkId === null || mtkId === undefined) {
                return lookups.complexes;
            }

            return mtkComplexesMap[String(mtkId)] || lookups.complexes;
        },
        [lookups.complexes, mtkComplexesMap],
    );

    const validateForm = React.useCallback(() => {
        if (!formData.name.trim()) {
            return 'Ad mutleqdir';
        }

        if (!formData.username.trim()) {
            return 'Istifadechi adi mutleqdir';
        }

        if (!formData.email.trim()) {
            return 'Email mutleqdir';
        }

        if (!formData.phone.trim()) {
            return 'Telefon mutleqdir';
        }

        if (!formData.role_id) {
            return 'Rol secmek mutleqdir';
        }

        const incompletePairs = formData.mtkComplexPairs.some(pair => {
            return (pair.mtk_id && !pair.complex_id) || (!pair.mtk_id && pair.complex_id);
        });

        if (incompletePairs) {
            return 'Butun MTK-Complex ciftleri tam olmalidir';
        }

        if (!formData.password.trim()) {
            return 'Sifre mutleqdir';
        }

        if (formData.password !== formData.password_confirmation) {
            return 'Sifreler ust-uste dusmur';
        }

        return '';
    }, [formData]);

    const prepareMtkComplexPayload = React.useCallback((data: UserFormState) => {
        const {
            mtkComplexPairs,
            assigned_access_preview: _assignedAccessPreview,
            ...cleanFormData
        } = data;

        const mtkIds = new Set<number | string>();
        const complexIds = new Set<number | string>();

        mtkComplexPairs.forEach(pair => {
            if (pair.mtk_id !== null && pair.mtk_id !== undefined) {
                mtkIds.add(pair.mtk_id);
            }

            if (pair.complex_id !== null && pair.complex_id !== undefined) {
                complexIds.add(pair.complex_id);
            }
        });

        return {
            ...cleanFormData,
            mtk: Array.from(mtkIds),
            complex: Array.from(complexIds),
        };
    }, []);

    const onSubmitCreate = React.useCallback(async () => {
        const validationError = validateForm();
        if (validationError) {
            setFeedback({ type: 'error', message: validationError });
            return;
        }

        const payload = prepareMtkComplexPayload(formData);

        setFormSaving(true);
        try {
            await usersAPI.addUser(payload);
            setFeedback({ type: 'success', message: 'Istifadechi ugurla elave edildi' });
            setFormData(emptyForm);
            setSelectedRoleDetails(null);
            closeAllPickers();
            setFormOpen(false);
            await loadUsersPage(1, { reset: true, refresh: true });
        } catch (error) {
            setFeedback({
                type: 'error',
                message: error instanceof Error ? error.message : 'Emeliyyat ugursuz oldu',
            });
        } finally {
            setFormSaving(false);
        }
    }, [closeAllPickers, formData, loadUsersPage, prepareMtkComplexPayload, validateForm]);

    const onRoleSelect = React.useCallback((roleId: number | string) => {
        setFormData(prev => ({ ...prev, role_id: roleId }));
        setRolePickerOpen(false);
    }, []);

    return (
        <AppPageLayout
            title="Users"
            isDark={isDark}
            scrollable
            onReachEnd={onReachEnd}
            contentStyle={styles.layoutContent}
            profileRouteKey="profile"
            settingsRouteKey="settings"
            devicesRouteKey="my_devices"
            notificationsRouteKey="notifications"
        >
            {feedback.message ? (
                <View
                    style={[
                        styles.feedback,
                        feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess,
                    ]}
                >
                    <Text style={styles.feedbackText}>{feedback.message}</Text>
                </View>
            ) : null}

            <View style={[styles.heroCard, isDark ? styles.panelDark : styles.panelLight]}>
                <View style={styles.heroGlowOne} />
                <View style={styles.heroGlowTwo} />
                <View style={[styles.toolbarCard, isDark ? styles.panelDark : styles.panelLight]}>
                    <TextInput
                        value={searchName}
                        onChangeText={setSearchName}
                        placeholder="Ad / email / telefon ile axtar"
                        placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                        style={[styles.searchInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
                    />

                    <View style={styles.actionsRow}>
                        <Pressable
                            onPress={() => {
                                void loadUsersPage(1, { reset: true, refresh: true });
                            }}
                            style={[styles.actionButton, styles.ghostButton]}
                        >
                            <Text style={styles.ghostButtonText}>{refreshingUsers ? 'Yuklenir...' : 'Yenile'}</Text>
                        </Pressable>

                        <Pressable onPress={openCreate} style={[styles.actionButton, styles.primaryButton]}>
                            <Text style={styles.primaryButtonText}>+ Yeni istifadeci</Text>
                        </Pressable>
                    </View>
                </View>
            </View>



            {loadingInitial ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <View style={styles.cardsList}>
                    {users.map((item, index) => (
                        <View
                            key={item.id !== null ? String(item.id) : `user-${index}`}
                            style={[styles.userCard, isDark ? styles.panelDark : styles.panelLight]}
                        >
                            <View style={styles.userHeaderRow}>
                                <View style={styles.avatarBubble}>
                                    <Text style={styles.avatarText}>{(item.name || '?').slice(0, 1).toUpperCase()}</Text>
                                </View>
                                <View style={styles.entityMainContent}>
                                    <Text style={[styles.userName, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                        {item.name || '-'}
                                    </Text>
                                    <Text style={[styles.userMeta, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                        @{item.username || '-'}
                                    </Text>
                                </View>

                                <View style={styles.statusPill}>
                                    <Text style={styles.statusPillText}>{getStatusLabel(item.status)}</Text>
                                </View>
                            </View>

                            <View style={styles.previewGrid}>
                                <View style={styles.previewItem}>
                                    <Text style={[styles.previewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Email</Text>
                                    <Text numberOfLines={1} style={[styles.previewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                        {item.email || '-'}
                                    </Text>
                                </View>
                                <View style={styles.previewItem}>
                                    <Text style={[styles.previewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Telefon</Text>
                                    <Text numberOfLines={1} style={[styles.previewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                        {item.phone || '-'}
                                    </Text>
                                </View>
                                <View style={styles.previewItem}>
                                    <Text style={[styles.previewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Rol</Text>
                                    <Text numberOfLines={1} style={[styles.previewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                        {item.roleName || '-'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.cardActionRow}>
                                <Pressable
                                    onPress={() => {
                                        void openViewModal(item);
                                    }}
                                    style={styles.viewButton}
                                >
                                    <Text style={styles.viewButtonText}>Baxis</Text>
                                </Pressable>
                            </View>
                        </View>
                    ))}

                    {users.length === 0 ? (
                        <View style={[styles.emptyCard, isDark ? styles.panelDark : styles.panelLight]}>
                            <Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                Istifadechi tapilmadi
                            </Text>
                        </View>
                    ) : null}

                    {loadingMore ? (
                        <View style={styles.loadMoreFooter}>
                            <ActivityIndicator size="small" color="#2563eb" />
                            <Text style={[styles.loadMoreText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                Novbeti neticeler yuklenir...
                            </Text>
                        </View>
                    ) : null}

                    {!hasMore && users.length > 0 ? (
                        <View style={styles.loadMoreFooter}>
                            <Text style={[styles.loadMoreText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                Butun neticeler gosterildi
                            </Text>
                        </View>
                    ) : null}
                </View>
            )}

            <Modal
                visible={formOpen}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    closeAllPickers();
                    setFormOpen(false);
                }}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={[styles.modalPanel, isDark ? styles.modalPanelDark : styles.modalPanelLight]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                    Yeni istifadeci
                                </Text>
                                <Text style={[styles.modalSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                    Formu doldur ve role uygun access avtomatik verilecek.
                                </Text>
                            </View>

                            <Pressable
                                onPress={() => {
                                    closeAllPickers();
                                    setFormOpen(false);
                                }}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>Bagla</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            style={styles.modalScroll}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={[styles.formSection, isDark ? styles.sectionCardDark : styles.sectionCardLight]}>
                                <Text style={[styles.sectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                    Esas melumatlar
                                </Text>

                                <Text style={[styles.fieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Ad</Text>
                                <TextInput
                                    value={formData.name}
                                    onChangeText={value => setFormData(prev => ({ ...prev, name: value }))}
                                    placeholder="Ad"
                                    placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                                    style={[styles.formInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
                                />

                                <Text style={[styles.fieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                    Istifadeci adi
                                </Text>
                                <TextInput
                                    value={formData.username}
                                    onChangeText={value => setFormData(prev => ({ ...prev, username: value }))}
                                    placeholder="Username"
                                    placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                                    style={[styles.formInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
                                />

                                <Text style={[styles.fieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Email</Text>
                                <TextInput
                                    value={formData.email}
                                    onChangeText={value => setFormData(prev => ({ ...prev, email: value }))}
                                    placeholder="Email"
                                    placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    style={[styles.formInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
                                />

                                <Text style={[styles.fieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Telefon</Text>
                                <TextInput
                                    value={formData.phone}
                                    onChangeText={value => setFormData(prev => ({ ...prev, phone: value }))}
                                    placeholder="Telefon"
                                    placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                                    style={[styles.formInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
                                />

                                <Text style={[styles.fieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                    Dogum tarixi
                                </Text>
                                <TextInput
                                    value={formData.birthday}
                                    onChangeText={value => setFormData(prev => ({ ...prev, birthday: value }))}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                                    style={[styles.formInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
                                />

                                <Text style={[styles.fieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                    Sexsiyyet nomresi
                                </Text>
                                <TextInput
                                    value={formData.personal_code}
                                    onChangeText={value => setFormData(prev => ({ ...prev, personal_code: value }))}
                                    placeholder="Personal code"
                                    placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                                    style={[styles.formInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
                                />
                            </View>

                            <View style={[styles.formSection, isDark ? styles.sectionCardDark : styles.sectionCardLight]}>
                                <Text style={[styles.sectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                    Rol ve tip
                                </Text>

                                <Text style={[styles.fieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Rol</Text>
                                <Pressable
                                    onPress={() => {
                                        setRolePickerOpen(prev => !prev);
                                        setTypePickerOpen(false);
                                    }}
                                    style={[styles.selectTrigger, isDark ? styles.searchInputDark : styles.searchInputLight]}
                                >
                                    <Text style={[styles.selectTriggerText, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                        {selectedRoleLabel}
                                    </Text>
                                    <Text style={styles.selectCaret}>{rolePickerOpen ? 'Yuxari' : 'Asagi'}</Text>
                                </Pressable>
                                {rolePickerOpen ? (
                                    <ScrollView
                                        style={[styles.optionsList, isDark ? styles.sectionCardDark : styles.sectionCardLight]}
                                        nestedScrollEnabled
                                    >
                                        {lookups.roles.map(role => {
                                            const selected = String(formData.role_id) === String(role.id);
                                            return (
                                                <Pressable
                                                    key={String(role.id)}
                                                    onPress={() => onRoleSelect(role.id)}
                                                    style={[
                                                        styles.optionRow,
                                                        selected ? styles.optionRowSelected : isDark ? styles.optionRowDark : styles.optionRowLight,
                                                    ]}
                                                >
                                                    <Text style={selected ? styles.optionTextSelected : [styles.optionText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                                        {role.name}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </ScrollView>
                                ) : null}

                                {loadingRoleDetails ? (
                                    <Text style={[styles.helperText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                        Rol melumatlari yuklenir...
                                    </Text>
                                ) : null}

                                <Text style={[styles.fieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Tip</Text>
                                <Pressable
                                    onPress={() => {
                                        setTypePickerOpen(prev => !prev);
                                        setRolePickerOpen(false);
                                    }}
                                    style={[styles.selectTrigger, isDark ? styles.searchInputDark : styles.searchInputLight]}
                                >
                                    <Text style={[styles.selectTriggerText, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                        {selectedTypeLabel}
                                    </Text>
                                    <Text style={styles.selectCaret}>{typePickerOpen ? 'Yuxari' : 'Asagi'}</Text>
                                </Pressable>
                                {typePickerOpen ? (
                                    <View style={[styles.optionsList, isDark ? styles.sectionCardDark : styles.sectionCardLight]}>
                                        {typeOptions.map(item => {
                                            const selected = item.id === formData.type;
                                            return (
                                                <Pressable
                                                    key={item.id}
                                                    onPress={() => {
                                                        setFormData(prev => ({ ...prev, type: item.id }));
                                                        setTypePickerOpen(false);
                                                    }}
                                                    style={[
                                                        styles.optionRow,
                                                        selected ? styles.optionRowSelected : isDark ? styles.optionRowDark : styles.optionRowLight,
                                                    ]}
                                                >
                                                    <Text style={selected ? styles.optionTextSelected : [styles.optionText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                                        {item.name}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                ) : null}

                                <Text style={[styles.fieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Sifre</Text>
                                <TextInput
                                    value={formData.password}
                                    onChangeText={value => setFormData(prev => ({ ...prev, password: value }))}
                                    placeholder="Sifre"
                                    placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                                    secureTextEntry
                                    style={[styles.formInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
                                />

                                <Text style={[styles.fieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                    Sifre tesdiqi
                                </Text>
                                <TextInput
                                    value={formData.password_confirmation}
                                    onChangeText={value => setFormData(prev => ({ ...prev, password_confirmation: value }))}
                                    placeholder="Sifre tesdiqi"
                                    placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                                    secureTextEntry
                                    style={[styles.formInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
                                />

                                <Text style={[styles.fieldLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                    Role aid access
                                </Text>
                                <TextInput
                                    value={formData.assigned_access_preview}
                                    editable={false}
                                    multiline
                                    placeholder="Role aid modul ve icazeler"
                                    placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
                                    style={[
                                        styles.formInput,
                                        styles.textArea,
                                        isDark ? styles.searchInputDark : styles.searchInputLight,
                                    ]}
                                />
                            </View>

                            <View style={[styles.formSection, isDark ? styles.sectionCardDark : styles.sectionCardLight]}>
                                <Text style={[styles.sectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                    MTK / Complex ciftleri
                                </Text>

                                {formData.mtkComplexPairs.map((pair, index) => {
                                    const availableComplexes = getComplexesByMtk(pair.mtk_id);
                                    const selectedMtkName =
                                        lookups.mtks.find(item => String(item.id) === String(pair.mtk_id))?.name || 'MTK secin';
                                    const selectedComplexName =
                                        availableComplexes.find(item => String(item.id) === String(pair.complex_id))?.name || 'Complex secin';

                                    return (
                                        <View key={`pair-${index}`} style={[styles.pairCard, isDark ? styles.panelDark : styles.panelLight]}>
                                            <View style={styles.pairHead}>
                                                <Text style={[styles.pairTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                                    Cift #{index + 1}
                                                </Text>
                                                <Pressable onPress={() => removeMtkComplexPair(index)} style={styles.removeBadge}>
                                                    <Text style={styles.removeBadgeText}>Sil</Text>
                                                </Pressable>
                                            </View>

                                            <Pressable
                                                onPress={() => {
                                                    setActivePairMtkPicker(activePairMtkPicker === index ? null : index);
                                                    setActivePairComplexPicker(null);
                                                }}
                                                style={[styles.selectTrigger, isDark ? styles.searchInputDark : styles.searchInputLight]}
                                            >
                                                <Text style={[styles.selectTriggerText, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                                    {selectedMtkName}
                                                </Text>
                                                <Text style={styles.selectCaret}>{activePairMtkPicker === index ? 'Yuxari' : 'Asagi'}</Text>
                                            </Pressable>

                                            {activePairMtkPicker === index ? (
                                                <ScrollView
                                                    style={[styles.optionsList, isDark ? styles.sectionCardDark : styles.sectionCardLight]}
                                                    nestedScrollEnabled
                                                >
                                                    {lookups.mtks.map(mtk => {
                                                        const selected = pair.mtk_id !== null && String(pair.mtk_id) === String(mtk.id);
                                                        return (
                                                            <Pressable
                                                                key={`mtk-${index}-${String(mtk.id)}`}
                                                                onPress={() => {
                                                                    updateMtkComplexPair(index, 'mtk_id', mtk.id);
                                                                    setActivePairMtkPicker(null);
                                                                }}
                                                                style={[
                                                                    styles.optionRow,
                                                                    selected ? styles.optionRowSelected : isDark ? styles.optionRowDark : styles.optionRowLight,
                                                                ]}
                                                            >
                                                                <Text style={selected ? styles.optionTextSelected : [styles.optionText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                                                    {mtk.name}
                                                                </Text>
                                                            </Pressable>
                                                        );
                                                    })}
                                                </ScrollView>
                                            ) : null}

                                            <Pressable
                                                onPress={() => {
                                                    if (!pair.mtk_id) {
                                                        return;
                                                    }

                                                    setActivePairComplexPicker(activePairComplexPicker === index ? null : index);
                                                    setActivePairMtkPicker(null);
                                                }}
                                                style={[
                                                    styles.selectTrigger,
                                                    !pair.mtk_id ? styles.selectTriggerDisabled : null,
                                                    isDark ? styles.searchInputDark : styles.searchInputLight,
                                                ]}
                                            >
                                                <Text style={[styles.selectTriggerText, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                                    {selectedComplexName}
                                                </Text>
                                                <Text style={styles.selectCaret}>
                                                    {activePairComplexPicker === index ? 'Yuxari' : 'Asagi'}
                                                </Text>
                                            </Pressable>

                                            {activePairComplexPicker === index ? (
                                                <ScrollView
                                                    style={[styles.optionsList, isDark ? styles.sectionCardDark : styles.sectionCardLight]}
                                                    nestedScrollEnabled
                                                >
                                                    {availableComplexes.map(complex => {
                                                        const selected =
                                                            pair.complex_id !== null && String(pair.complex_id) === String(complex.id);
                                                        return (
                                                            <Pressable
                                                                key={`complex-${index}-${String(complex.id)}`}
                                                                onPress={() => {
                                                                    updateMtkComplexPair(index, 'complex_id', complex.id);
                                                                    setActivePairComplexPicker(null);
                                                                }}
                                                                style={[
                                                                    styles.optionRow,
                                                                    selected ? styles.optionRowSelected : isDark ? styles.optionRowDark : styles.optionRowLight,
                                                                ]}
                                                            >
                                                                <Text style={selected ? styles.optionTextSelected : [styles.optionText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                                                    {complex.name}
                                                                </Text>
                                                            </Pressable>
                                                        );
                                                    })}
                                                </ScrollView>
                                            ) : null}
                                        </View>
                                    );
                                })}

                                <Pressable onPress={addMtkComplexPair} style={[styles.actionButton, styles.ghostButton]}>
                                    <Text style={styles.ghostButtonText}>+ MTK-Complex elave et</Text>
                                </Pressable>

                                {loadingMtkComplexes ? (
                                    <Text style={[styles.helperText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                        MTK uzre complex siyahisi yuklenir...
                                    </Text>
                                ) : null}
                            </View>

                            <View style={styles.modalFooter}>
                                <Pressable
                                    onPress={() => {
                                        closeAllPickers();
                                        setFormOpen(false);
                                    }}
                                    style={[styles.actionButton, styles.ghostButton]}
                                >
                                    <Text style={styles.ghostButtonText}>Legv et</Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => void onSubmitCreate()}
                                    style={[styles.actionButton, styles.primaryButton]}
                                    disabled={formSaving}
                                >
                                    <Text style={styles.primaryButtonText}>{formSaving ? 'Gonderilir...' : 'Yadda saxla'}</Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal
                visible={viewOpen}
                transparent
                animationType="fade"
                onRequestClose={closeViewModal}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View style={[styles.modalPanel, isDark ? styles.modalPanelDark : styles.modalPanelLight]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                    Istifadeci melumatlari
                                </Text>
                                <Text style={[styles.modalSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                    Detalli baxis penceresi
                                </Text>
                            </View>

                            <Pressable onPress={closeViewModal} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>Bagla</Text>
                            </Pressable>
                        </View>

                        {viewLoading ? (
                            <View style={styles.viewLoaderWrap}>
                                <ActivityIndicator size="small" color="#2563eb" />
                                <Text style={[styles.viewLoaderText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                    Melumatlar yenilenir...
                                </Text>
                            </View>
                        ) : null}

                        <View style={[styles.formSection, isDark ? styles.sectionCardDark : styles.sectionCardLight]}>
                            <View style={styles.viewRow}>
                                <Text style={[styles.viewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Ad</Text>
                                <Text style={[styles.viewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{viewData?.name || '-'}</Text>
                            </View>
                            <View style={styles.viewRow}>
                                <Text style={[styles.viewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Username</Text>
                                <Text style={[styles.viewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{viewData?.username || '-'}</Text>
                            </View>
                            <View style={styles.viewRow}>
                                <Text style={[styles.viewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Email</Text>
                                <Text style={[styles.viewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{viewData?.email || '-'}</Text>
                            </View>
                            <View style={styles.viewRow}>
                                <Text style={[styles.viewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Telefon</Text>
                                <Text style={[styles.viewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{viewData?.phone || '-'}</Text>
                            </View>
                            <View style={styles.viewRow}>
                                <Text style={[styles.viewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Rol</Text>
                                <Text style={[styles.viewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{viewData?.roleName || '-'}</Text>
                            </View>
                            <View style={styles.viewRow}>
                                <Text style={[styles.viewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Status</Text>
                                <Text style={[styles.viewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{getStatusLabel(viewData?.status || '-')}</Text>
                            </View>
                            <View style={styles.viewRow}>
                                <Text style={[styles.viewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Dogum tarixi</Text>
                                <Text style={[styles.viewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{viewData?.birthday || '-'}</Text>
                            </View>
                            <View style={styles.viewRow}>
                                <Text style={[styles.viewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Sexsiyyet nomresi</Text>
                                <Text style={[styles.viewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{viewData?.personalCode || '-'}</Text>
                            </View>
                            <View style={styles.viewRow}>
                                <Text style={[styles.viewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Tip</Text>
                                <Text style={[styles.viewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{viewData?.typeLabel || '-'}</Text>
                            </View>
                            <View style={styles.viewRow}>
                                <Text style={[styles.viewLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Kateqoriya</Text>
                                <Text style={[styles.viewValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{viewData?.userKind || '-'}</Text>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </AppPageLayout>
    );
}

const styles = StyleSheet.create({
    layoutContent: {
        backgroundColor: APP_LAYOUT_COLORS.backgroundLight,
        paddingBottom: 24,
    },
    feedback: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    feedbackError: {
        borderColor: '#fecaca',
        backgroundColor: '#fef2f2',
    },
    feedbackSuccess: {
        borderColor: '#bbf7d0',
        backgroundColor: '#f0fdf4',
    },
    feedbackText: {
        color: '#0f172a',
        fontFamily: 'WorkSans-SemiBold',
        fontSize: 12,
    },

    heroCard: {
        overflow: 'hidden',
        borderRadius: 28,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
    },
    heroGlowOne: {
        position: 'absolute',
        top: -40,
        right: -30,
        width: 140,
        height: 140,
        borderRadius: 999,
        backgroundColor: 'rgba(37,99,235,0.18)',
    },
    heroGlowTwo: {
        position: 'absolute',
        bottom: -50,
        left: -30,
        width: 130,
        height: 130,
        borderRadius: 999,
        backgroundColor: 'rgba(99,102,241,0.15)',
    },
    heroEyebrow: {
        fontSize: 12,
        fontFamily: 'WorkSans-Bold',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 28,
        fontFamily: 'WorkSans-Bold',
    },
    heroDescription: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
        fontFamily: 'WorkSans-Medium',
        maxWidth: 280,
    },
    heroStatsRow: {
        marginTop: 14,
        flexDirection: 'row',
        gap: 10,
    },
    statsCard: {
        minWidth: 96,
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsCardLight: {
        backgroundColor: '#f8fbff',
        borderColor: '#dbeafe',
    },
    statsCardDark: {
        backgroundColor: '#151a22',
        borderColor: '#1f3b68',
    },
    statsLabel: {
        fontSize: 11,
        fontFamily: 'WorkSans-Medium',
    },
    statsValue: {
        marginTop: 4,
        fontSize: 20,
        fontFamily: 'WorkSans-Bold',
    },

    toolbarCard: {
        marginBottom: 14,
        borderRadius: 24,
        borderWidth: 1,
        padding: 14,
        gap: 12,
    },
    panelLight: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
    },
    panelDark: {
        backgroundColor: '#111114',
        borderColor: '#27272a',
    },
    searchInput: {
        minHeight: 52,
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 16,
        fontFamily: 'WorkSans-Medium',
        fontSize: 14,
    },
    searchInputLight: {
        backgroundColor: '#f8fafc',
        borderColor: '#dbe4ef',
        color: '#0f172a',
    },
    searchInputDark: {
        backgroundColor: '#18181b',
        borderColor: '#303036',
        color: '#f4f4f5',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    actionButton: {
        minHeight: 46,
        borderRadius: 16,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    ghostButton: {
        backgroundColor: '#334155',
    },
    primaryButton: {
        backgroundColor: '#2563eb',
    },
    ghostButtonText: {
        color: '#fff',
        fontSize: 13,
        fontFamily: 'WorkSans-SemiBold',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 13,
        fontFamily: 'WorkSans-Bold',
    },

    loadingWrap: {
        minHeight: 260,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardsList: {
        gap: 12,
    },
    userCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 16,
    },
    userHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    avatarBubble: {
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontFamily: 'WorkSans-Bold',
        fontSize: 17,
    },
    entityMainContent: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontFamily: 'WorkSans-Bold',
    },
    userMeta: {
        marginTop: 4,
        fontSize: 12,
        fontFamily: 'WorkSans-Medium',
    },
    statusPill: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#dbeafe',
    },
    statusPillText: {
        color: '#1d4ed8',
        fontFamily: 'WorkSans-SemiBold',
        fontSize: 11,
    },
    previewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    previewItem: {
        minWidth: '48%',
        flexGrow: 1,
    },
    previewLabel: {
        fontSize: 11,
        fontFamily: 'WorkSans-Medium',
    },
    previewValue: {
        marginTop: 2,
        fontSize: 12,
        fontFamily: 'WorkSans-SemiBold',
    },
    cardActionRow: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    viewButton: {
        minHeight: 36,
        borderRadius: 12,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f766e',
    },
    viewButtonText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'WorkSans-Bold',
    },
    emptyCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: 'WorkSans-Medium',
        fontSize: 13,
    },
    loadMoreFooter: {
        marginTop: 10,
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loadMoreText: {
        fontSize: 12,
        fontFamily: 'WorkSans-SemiBold',
    },

    textPrimaryLight: {
        color: '#0f172a',
    },
    textPrimaryDark: {
        color: '#f5f5f5',
    },
    textMutedLight: {
        color: '#64748b',
    },
    textMutedDark: {
        color: '#a1a1aa',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(2,6,23,0.62)',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 20,
    },
    modalPanel: {
        width: '100%',
        maxHeight: '96%',
        borderRadius: 24,
        borderWidth: 1,
        padding: 16,
    },
    modalPanelLight: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
    },
    modalPanelDark: {
        backgroundColor: '#101012',
        borderColor: '#27272a',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
        // marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'WorkSans-Bold',
    },
    modalSubtitle: {
        marginTop: 4,
        fontSize: 12,
        fontFamily: 'WorkSans-Medium',
        lineHeight: 18,
        maxWidth: 250,
    },
    closeButton: {
        backgroundColor: '#334155',
        borderRadius: 10,
        minHeight: 34,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontFamily: 'WorkSans-SemiBold',
        fontSize: 12,
    },
    modalScroll: {
        maxHeight: 640,
    },
    formSection: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 12,
        marginBottom: 12,
    },
    sectionCardLight: {
        backgroundColor: '#f8fafc',
        borderColor: '#dbe4ef',
    },
    sectionCardDark: {
        backgroundColor: '#18181b',
        borderColor: '#303036',
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: 'WorkSans-Bold',
        marginBottom: 8,
    },
    fieldLabel: {
        marginTop: 8,
        marginBottom: 5,
        fontSize: 11,
        fontFamily: 'WorkSans-SemiBold',
    },
    formInput: {
        minHeight: 44,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        fontFamily: 'WorkSans-Medium',
        fontSize: 13,
    },
    textArea: {
        minHeight: 150,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    selectTrigger: {
        minHeight: 44,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectTriggerDisabled: {
        opacity: 0.6,
    },
    selectTriggerText: {
        fontSize: 12,
        fontFamily: 'WorkSans-SemiBold',
        flex: 1,
        paddingRight: 8,
    },
    selectCaret: {
        fontSize: 11,
        fontFamily: 'WorkSans-Bold',
        color: '#3b82f6',
    },
    optionsList: {
        marginTop: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#dbe4ef',
        padding: 6,
        maxHeight: 180,
    },
    optionRow: {
        minHeight: 38,
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 10,
        justifyContent: 'center',
        marginBottom: 6,
    },
    optionRowLight: {
        backgroundColor: '#f8fafc',
        borderColor: '#dbe4ef',
    },
    optionRowDark: {
        backgroundColor: '#18181b',
        borderColor: '#303036',
    },
    optionRowSelected: {
        backgroundColor: '#dbeafe',
        borderColor: '#60a5fa',
    },
    optionText: {
        fontSize: 12,
        fontFamily: 'WorkSans-SemiBold',
    },
    optionTextSelected: {
        color: '#1e3a8a',
        fontSize: 12,
        fontFamily: 'WorkSans-Bold',
    },
    pairCard: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 10,
        marginBottom: 10,
    },
    pairHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    pairTitle: {
        fontFamily: 'WorkSans-Bold',
        fontSize: 12,
    },
    removeBadge: {
        backgroundColor: '#dc2626',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    removeBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontFamily: 'WorkSans-Bold',
    },
    helperText: {
        marginTop: 6,
        fontFamily: 'WorkSans-Regular',
        fontSize: 11,
    },
    modalFooter: {
        marginTop: 4,
        flexDirection: 'row',
        gap: 10,
        marginBottom: 6,
    },
    viewLoaderWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    viewLoaderText: {
        fontSize: 11,
        fontFamily: 'WorkSans-Medium',
    },
    viewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 36,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#cbd5e1',
        gap: 10,
    },
    viewLabel: {
        fontSize: 12,
        fontFamily: 'WorkSans-SemiBold',
    },
    viewValue: {
        flexShrink: 1,
        textAlign: 'right',
        fontSize: 12,
        fontFamily: 'WorkSans-Bold',
    },
});

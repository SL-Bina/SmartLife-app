import React from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	useWindowDimensions,
	View,
} from 'react-native';

import AppPageLayout from '../../../components/common/app-page-layout';
import { useThemeMode } from '../../../hooks/use-theme';
import { permissionsAPI, rolesAPI } from '../../../services/management';
import { APP_LAYOUT_COLORS } from '../../../theme/layout-colors';

type Dictionary = Record<string, unknown>;
type Id = number | string;
type MessageType = 'success' | 'error';

type FeedbackState = {
	type: MessageType;
	message: string;
} | null;

type RoleItem = {
	id: Id;
	name: string;
};

type PermissionItem = {
	id: Id;
	permission: string;
	details: string;
};

type ModuleItem = {
	id: Id;
	name: string;
	permissions: PermissionItem[];
};

type RoleModalMode = 'create' | 'edit' | null;

const isRecord = (value: unknown): value is Dictionary => {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const toRecord = (value: unknown): Dictionary => {
	return isRecord(value) ? value : {};
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

const normalizeId = (value: unknown): Id | null => {
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

const assertApiSuccess = (payload: unknown, fallbackMessage: string): void => {
	const response = toRecord(payload);
	if (response.success === false) {
		const message = asString(response.message).trim();
		throw new Error(message || fallbackMessage);
	}
};

const mapRole = (item: unknown): RoleItem | null => {
	const row = toRecord(item);
	const id = normalizeId(row.id ?? row.role_id);
	const name = asString(row.name ?? row.role_name).trim();

	if (id === null || name.length === 0) {
		return null;
	}

	return { id, name };
};

const mapPermission = (item: unknown): PermissionItem | null => {
	const row = toRecord(item);
	const id = normalizeId(row.id ?? row.permission_id);
	const permission = asString(row.permission ?? row.permission_name ?? row.name).trim();
	const details = asString(row.details ?? row.detail ?? row.permission_detail).trim();

	if (id === null || permission.length === 0) {
		return null;
	}

	return {
		id,
		permission,
		details,
	};
};

const mapModule = (item: unknown): ModuleItem | null => {
	const row = toRecord(item);
	const moduleNode = toRecord(row.module ?? row);
	const id = normalizeId(moduleNode.id ?? row.module_id);
	const name = asString(moduleNode.name ?? row.module_name).trim();
	const permissionRows = Array.isArray(moduleNode.permissions)
		? moduleNode.permissions
		: Array.isArray(row.permissions)
			? row.permissions
			: [];

	if (id === null || name.length === 0) {
		return null;
	}

	const permissions = permissionRows
		.map(mapPermission)
		.filter((permission): permission is PermissionItem => permission !== null);

	return {
		id,
		name,
		permissions,
	};
};

const dedupeIds = (ids: Id[]): Id[] => {
	const seen = new Set<string>();
	const result: Id[] = [];

	ids.forEach(id => {
		const key = String(id);
		if (seen.has(key)) {
			return;
		}

		seen.add(key);
		result.push(id);
	});

	return result;
};

const compareId = (left: Id, right: Id): boolean => String(left) === String(right);

const getErrorMessage = (error: unknown, fallback: string): string => {
	if (error instanceof Error && error.message.length > 0) {
		return error.message;
	}

	const message = asString(toRecord(error).message).trim();
	if (message.length > 0) {
		return message;
	}

	return fallback;
};

export default function DashboardPermissionsScreen() {
	const { resolvedTheme } = useThemeMode();
	const isDark = resolvedTheme === 'dark';
	const { width } = useWindowDimensions();
	const isDesktop = width >= 1024;

	const [roles, setRoles] = React.useState<RoleItem[]>([]);
	const [modules, setModules] = React.useState<ModuleItem[]>([]);
	const [selectedRoleId, setSelectedRoleId] = React.useState<Id | null>(null);
	const [selectedPermissions, setSelectedPermissions] = React.useState<Record<string, Id[]>>({});

	const [loadingRoles, setLoadingRoles] = React.useState(false);
	const [loadingModules, setLoadingModules] = React.useState(false);
	const [loadingRolePermissions, setLoadingRolePermissions] = React.useState(false);
	const [savingPermissions, setSavingPermissions] = React.useState(false);

	const [feedback, setFeedback] = React.useState<FeedbackState>(null);
	const [roleSearch, setRoleSearch] = React.useState('');
	const [permissionSearch, setPermissionSearch] = React.useState('');
	const [mobilePanel, setMobilePanel] = React.useState<'roles' | 'permissions'>('roles');

	const [roleModalMode, setRoleModalMode] = React.useState<RoleModalMode>(null);
	const [roleModalVisible, setRoleModalVisible] = React.useState(false);
	const [roleDraftName, setRoleDraftName] = React.useState('');
	const [savingRole, setSavingRole] = React.useState(false);
	const [permissionCreateVisible, setPermissionCreateVisible] = React.useState(false);
	const [savingPermissionCreate, setSavingPermissionCreate] = React.useState(false);
	const [permissionDraft, setPermissionDraft] = React.useState({
		module_id: '',
		permission_name: '',
		permission_detail: '',
	});

	const [roleToEdit, setRoleToEdit] = React.useState<RoleItem | null>(null);
	const [roleToDelete, setRoleToDelete] = React.useState<RoleItem | null>(null);
	const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
	const [deletingRole, setDeletingRole] = React.useState(false);

	const loadRoles = React.useCallback(async () => {
		setLoadingRoles(true);

		try {
			const response = await rolesAPI.getAll({ page: 1, per_page: 1000 });
			const items = normalizeList(response)
				.map(mapRole)
				.filter((role): role is RoleItem => role !== null);

			setRoles(items);
			setSelectedRoleId(prev => {
				if (prev === null) {
					return null;
				}

				const stillExists = items.some(role => compareId(role.id, prev));
				return stillExists ? prev : null;
			});
		} catch (error) {
			setFeedback({
				type: 'error',
				message: getErrorMessage(error, 'Rollar yuklenmedi.'),
			});
		} finally {
			setLoadingRoles(false);
		}
	}, []);

	const loadModules = React.useCallback(async () => {
		setLoadingModules(true);

		try {
			const response = await permissionsAPI.getAll({ page: 1, per_page: 1000 });
			const items = normalizeList(response)
				.map(mapModule)
				.filter((module): module is ModuleItem => module !== null);

			setModules(items);
		} catch (error) {
			setFeedback({
				type: 'error',
				message: getErrorMessage(error, 'Icazeler yuklenmedi.'),
			});
		} finally {
			setLoadingModules(false);
		}
	}, []);

	const loadRolePermissions = React.useCallback(async (roleId: Id) => {
		setLoadingRolePermissions(true);

		try {
			const response = await rolesAPI.getById(roleId);
			const root = toRecord(response);
			const data = toRecord(root.data ?? root);
			const modulesList = Array.isArray(data.role_access_modules) ? data.role_access_modules : [];

			const nextSelected: Record<string, Id[]> = {};
			modulesList.forEach(moduleEntry => {
				const moduleRecord = toRecord(moduleEntry);
				const moduleName = asString(moduleRecord.module_name ?? moduleRecord.name).trim();
				if (moduleName.length === 0) {
					return;
				}

				const perms = Array.isArray(moduleRecord.permissions) ? moduleRecord.permissions : [];
				const ids = perms
					.map(permission => normalizeId(toRecord(permission).id ?? toRecord(permission).permission_id))
					.filter((id): id is Id => id !== null);

				if (ids.length > 0) {
					nextSelected[moduleName] = dedupeIds(ids);
				}
			});

			setSelectedPermissions(nextSelected);
		} catch (error) {
			setSelectedPermissions({});
			setFeedback({
				type: 'error',
				message: getErrorMessage(error, 'Rol icazeleri yuklenmedi.'),
			});
		} finally {
			setLoadingRolePermissions(false);
		}
	}, []);

	React.useEffect(() => {
		void Promise.all([loadRoles(), loadModules()]);
	}, [loadModules, loadRoles]);

	React.useEffect(() => {
		if (selectedRoleId === null) {
			setSelectedPermissions({});
			return;
		}

		void loadRolePermissions(selectedRoleId);
	}, [loadRolePermissions, selectedRoleId]);

	const filteredRoles = React.useMemo(() => {
		const query = roleSearch.trim().toLowerCase();
		if (!query) {
			return roles;
		}

		return roles.filter(role => role.name.toLowerCase().includes(query));
	}, [roleSearch, roles]);

	const filteredModules = React.useMemo(() => {
		const query = permissionSearch.trim().toLowerCase();
		if (!query) {
			return modules;
		}

		return modules
			.map(module => {
				const moduleMatches = module.name.toLowerCase().includes(query);
				if (moduleMatches) {
					return module;
				}

				const permissions = module.permissions.filter(permission => {
					const details = permission.details.toLowerCase();
					const code = permission.permission.toLowerCase();
					return details.includes(query) || code.includes(query);
				});

				if (permissions.length === 0) {
					return null;
				}

				return {
					...module,
					permissions,
				};
			})
			.filter((module): module is ModuleItem => module !== null);
	}, [modules, permissionSearch]);

	const selectedRole = React.useMemo(
		() => roles.find(role => selectedRoleId !== null && compareId(role.id, selectedRoleId)) ?? null,
		[roles, selectedRoleId],
	);

	const moduleOptions = React.useMemo(
		() => modules.map(module => ({ id: module.id, name: module.name })),
		[modules],
	);

	const totalPermissionCount = React.useMemo(() => {
		return modules.reduce((sum, module) => sum + module.permissions.length, 0);
	}, [modules]);

	const selectedPermissionCount = React.useMemo(() => {
		return Object.values(selectedPermissions).reduce((sum, ids) => sum + ids.length, 0);
	}, [selectedPermissions]);

	const isPermissionSelected = React.useCallback(
		(moduleName: string, permissionId: Id): boolean => {
			const ids = selectedPermissions[moduleName] ?? [];
			return ids.some(id => compareId(id, permissionId));
		},
		[selectedPermissions],
	);

	const isModuleAllSelected = React.useCallback(
		(moduleName: string, permissionIds: Id[]): boolean => {
			if (permissionIds.length === 0) {
				return false;
			}

			const ids = selectedPermissions[moduleName] ?? [];
			return permissionIds.every(permissionId => ids.some(id => compareId(id, permissionId)));
		},
		[selectedPermissions],
	);

	const togglePermission = React.useCallback((moduleName: string, permissionId: Id) => {
		setSelectedPermissions(prev => {
			const ids = prev[moduleName] ?? [];
			const exists = ids.some(id => compareId(id, permissionId));
			const nextIds = exists
				? ids.filter(id => !compareId(id, permissionId))
				: [...ids, permissionId];

			return {
				...prev,
				[moduleName]: dedupeIds(nextIds),
			};
		});
	}, []);

	const toggleModule = React.useCallback((moduleName: string, permissionIds: Id[]) => {
		setSelectedPermissions(prev => {
			const ids = prev[moduleName] ?? [];
			const allSelected = permissionIds.every(permissionId => ids.some(id => compareId(id, permissionId)));

			return {
				...prev,
				[moduleName]: allSelected ? [] : dedupeIds(permissionIds),
			};
		});
	}, []);

	const handleSelectRole = React.useCallback((role: RoleItem) => {
		setFeedback(null);
		setSelectedRoleId(role.id);
		if (!isDesktop) {
			setMobilePanel('permissions');
		}
	}, [isDesktop]);

	const openCreateRoleModal = React.useCallback(() => {
		setFeedback(null);
		setRoleModalMode('create');
		setRoleToEdit(null);
		setRoleDraftName('');
		setRoleModalVisible(true);
	}, []);

	const openEditRoleModal = React.useCallback((role: RoleItem) => {
		setFeedback(null);
		setRoleModalMode('edit');
		setRoleToEdit(role);
		setRoleDraftName(role.name);
		setRoleModalVisible(true);
	}, []);

	const closeRoleModal = React.useCallback(() => {
		if (savingRole) {
			return;
		}

		setRoleModalVisible(false);
		setRoleModalMode(null);
		setRoleToEdit(null);
		setRoleDraftName('');
	}, [savingRole]);

	const openDeleteRoleModal = React.useCallback((role: RoleItem) => {
		setFeedback(null);
		setRoleToDelete(role);
		setDeleteModalVisible(true);
	}, []);

	const openPermissionCreateModal = React.useCallback(() => {
		setFeedback(null);
		setPermissionDraft({
			module_id: moduleOptions[0] ? String(moduleOptions[0].id) : '',
			permission_name: '',
			permission_detail: '',
		});
		setPermissionCreateVisible(true);
	}, [moduleOptions]);

	const closePermissionCreateModal = React.useCallback(() => {
		if (savingPermissionCreate) {
			return;
		}

		setPermissionCreateVisible(false);
	}, [savingPermissionCreate]);

	const closeDeleteModal = React.useCallback(() => {
		if (deletingRole) {
			return;
		}

		setDeleteModalVisible(false);
		setRoleToDelete(null);
	}, [deletingRole]);

	const submitRole = React.useCallback(async () => {
		if (roleModalMode === null) {
			return;
		}

		const name = roleDraftName.trim();
		if (name.length === 0) {
			setFeedback({
				type: 'error',
				message: 'Rol adi bos ola bilmez.',
			});
			return;
		}

		setSavingRole(true);
		try {
			if (roleModalMode === 'create') {
				const response = await rolesAPI.create({ name });
				assertApiSuccess(response, 'Rol yaradilarken xeta bas verdi.');

				const root = toRecord(response);
				const created = toRecord(root.data);
				const newRoleId = normalizeId(created.role_id ?? created.id);

				await loadRoles();
				if (newRoleId !== null) {
					setSelectedRoleId(newRoleId);
				}

				setFeedback({
					type: 'success',
					message: 'Yeni rol ugurla yaradildi.',
				});
			} else {
				const editingRoleId = roleToEdit?.id;
				if (editingRoleId === undefined) {
					throw new Error('Redakte olunacaq rol tapilmadi.');
				}

				const response = await rolesAPI.update(editingRoleId, { name });
				assertApiSuccess(response, 'Rol yenilenmedi.');

				await loadRoles();
				setFeedback({
					type: 'success',
					message: 'Rol ugurla yenilendi.',
				});
			}

			setRoleModalVisible(false);
			setRoleModalMode(null);
			setRoleToEdit(null);
			setRoleDraftName('');
		} catch (error) {
			setFeedback({
				type: 'error',
				message: getErrorMessage(error, 'Rol emeliyyati tamamlanmadi.'),
			});
		} finally {
			setSavingRole(false);
		}
	}, [loadRoles, roleDraftName, roleModalMode, roleToEdit?.id]);

	const confirmDeleteRole = React.useCallback(async () => {
		if (!roleToDelete) {
			return;
		}

		setDeletingRole(true);
		try {
			const response = await rolesAPI.delete(roleToDelete.id);
			assertApiSuccess(response, 'Rol silinmedi.');

			await loadRoles();

			setSelectedRoleId(prev => {
				if (prev !== null && compareId(prev, roleToDelete.id)) {
					return null;
				}

				return prev;
			});

			setFeedback({
				type: 'success',
				message: 'Rol ugurla silindi.',
			});

			setDeleteModalVisible(false);
			setRoleToDelete(null);
		} catch (error) {
			setFeedback({
				type: 'error',
				message: getErrorMessage(error, 'Rol silinerken xeta bas verdi.'),
			});
		} finally {
			setDeletingRole(false);
		}
	}, [loadRoles, roleToDelete]);

	const savePermissions = React.useCallback(async () => {
		if (selectedRoleId === null) {
			return;
		}

		setSavingPermissions(true);

		try {
			const ids = dedupeIds(
				Object.values(selectedPermissions)
					.flat()
					.filter((id): id is Id => id !== null && id !== undefined && `${id}`.trim() !== ''),
			);

			const response = await rolesAPI.bindPermissions(selectedRoleId, ids);
			assertApiSuccess(response, 'Icazeler yadda saxlanmadi.');

			setFeedback({
				type: 'success',
				message: 'Icazeler ugurla yadda saxlanildi.',
			});
		} catch (error) {
			setFeedback({
				type: 'error',
				message: getErrorMessage(error, 'Icazeler yadda saxlanmadi.'),
			});
		} finally {
			setSavingPermissions(false);
		}
	}, [selectedPermissions, selectedRoleId]);

	const submitPermissionCreate = React.useCallback(async () => {
		const moduleId = permissionDraft.module_id.trim();
		const permissionName = permissionDraft.permission_name.trim();
		const permissionDetail = permissionDraft.permission_detail.trim();

		if (!moduleId || !permissionName) {
			setFeedback({
				type: 'error',
				message: 'Modul ve icaze kodu mutleqdir.',
			});
			return;
		}

		setSavingPermissionCreate(true);
		try {
			const response = await permissionsAPI.create({
				module_id: moduleId,
				permission_name: permissionName,
				permission_detail: permissionDetail,
			});
			assertApiSuccess(response, 'Icaze elave olunmadi.');

			await loadModules();

			setFeedback({
				type: 'success',
				message: 'Yeni icaze ugurla elave olundu.',
			});
			setPermissionCreateVisible(false);
		} catch (error) {
			setFeedback({
				type: 'error',
				message: getErrorMessage(error, 'Icaze elave edilen zaman xeta bas verdi.'),
			});
		} finally {
			setSavingPermissionCreate(false);
		}
	}, [loadModules, permissionDraft]);

	return (
		<AppPageLayout
			title="Permissions"
			isDark={isDark}
			scrollable
			contentStyle={styles.layoutContent}
			profileRouteKey="profile"
			settingsRouteKey="settings"
			devicesRouteKey="my_devices"
			notificationsRouteKey="notifications"
		>
			{feedback ? (
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

				<Text style={[styles.heroTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
					Rol ve Icaze Idareetmesi
				</Text>
				<Text style={[styles.heroSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
					Rol secin, icazeleri aktiv edin ve bir toxunusla yadda saxlayin.
				</Text>

				<View style={styles.statsRow}>
					<View style={[styles.statBadge, isDark ? styles.statBadgeDark : styles.statBadgeLight]}>
						<Text style={[styles.statLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Rollar</Text>
						<Text style={[styles.statValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{roles.length}</Text>
					</View>

					<View style={[styles.statBadge, isDark ? styles.statBadgeDark : styles.statBadgeLight]}>
						<Text style={[styles.statLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>Icazeler</Text>
						<Text style={[styles.statValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
							{selectedPermissionCount}/{totalPermissionCount}
						</Text>
					</View>

					<Pressable
						onPress={() => {
							void savePermissions();
						}}
						disabled={selectedRoleId === null || savingPermissions || loadingRolePermissions}
						style={[
							styles.saveButton,
							(selectedRoleId === null || savingPermissions || loadingRolePermissions)
								? styles.saveButtonDisabled
								: null,
						]}
					>
						<Text style={styles.saveButtonText}>
							{savingPermissions ? 'Yaddas saxlanir...' : 'Icazeleri Saxla'}
						</Text>
					</Pressable>
				</View>
			</View>

			{!isDesktop ? (
				<View style={[styles.mobileTabs, isDark ? styles.mobileTabsDark : styles.mobileTabsLight]}>
					<Pressable
						onPress={() => setMobilePanel('roles')}
						style={[
							styles.mobileTabButton,
							mobilePanel === 'roles'
								? styles.mobileTabButtonActive
								: isDark
									? styles.mobileTabButtonDark
									: styles.mobileTabButtonLight,
						]}
					>
						<Text
							style={[
								styles.mobileTabText,
								mobilePanel === 'roles' ? styles.mobileTabTextActive : isDark ? styles.textMutedDark : styles.textMutedLight,
							]}
						>
							Rollar
						</Text>
					</Pressable>

					<Pressable
						onPress={() => setMobilePanel('permissions')}
						disabled={selectedRoleId === null}
						style={[
							styles.mobileTabButton,
							mobilePanel === 'permissions'
								? styles.mobileTabButtonActive
								: isDark
									? styles.mobileTabButtonDark
									: styles.mobileTabButtonLight,
							selectedRoleId === null ? styles.saveButtonDisabled : null,
						]}
					>
						<Text
							style={[
								styles.mobileTabText,
								mobilePanel === 'permissions'
									? styles.mobileTabTextActive
									: isDark
										? styles.textMutedDark
										: styles.textMutedLight,
							]}
						>
							Icazeler
						</Text>
					</Pressable>
				</View>
			) : null}

			<View style={[styles.contentStack, isDesktop ? styles.contentStackDesktop : null]}>
				<View
					style={[
						styles.panelCard,
						isDark ? styles.panelDark : styles.panelLight,
						isDesktop ? styles.rolesPanelDesktop : null,
						!isDesktop && mobilePanel !== 'roles' ? styles.hiddenPanel : null,
					]}
				>
					<View style={styles.panelHeaderRow}>
						<Text style={[styles.panelTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
							Rollar
						</Text>
						<Pressable onPress={openCreateRoleModal} style={styles.primaryMiniButton}>
							<Text style={styles.primaryMiniButtonText}>+ Yeni Rol</Text>
						</Pressable>
					</View>

					<TextInput
						value={roleSearch}
						onChangeText={setRoleSearch}
						placeholder="Rol axtar"
						placeholderTextColor={isDark ? '#6b7280' : '#94a3b8'}
						style={[styles.searchInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
					/>

					{loadingRoles ? (
						<View style={styles.loadingWrap}>
							<ActivityIndicator size="small" color="#2563eb" />
						</View>
					) : filteredRoles.length === 0 ? (
						<View style={styles.emptyWrap}>
							<Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
								Rol tapilmadi.
							</Text>
						</View>
					) : (
						<View style={styles.rolesList}>
							{filteredRoles.map(role => {
								const selected = selectedRoleId !== null && compareId(role.id, selectedRoleId);
								return (
									<Pressable
										key={String(role.id)}
										onPress={() => handleSelectRole(role)}
										style={[
											styles.roleRow,
											isDark ? styles.roleRowDark : styles.roleRowLight,
											selected ? styles.roleRowSelected : null,
										]}
									>
										<View style={styles.roleRowLeft}>
											<View style={[styles.roleDot, selected ? styles.roleDotActive : styles.roleDotIdle]} />
											<Text
												style={[
													styles.roleName,
													selected ? styles.roleNameSelected : isDark ? styles.textPrimaryDark : styles.textPrimaryLight,
												]}
											>
												{role.name}
											</Text>
										</View>

										<View style={styles.roleActions}>
											<Pressable onPress={() => openEditRoleModal(role)} style={styles.inlineActionBtn}>
												<Text style={styles.inlineActionText}>Duzelt</Text>
											</Pressable>
											<Pressable onPress={() => openDeleteRoleModal(role)} style={styles.inlineDeleteBtn}>
												<Text style={styles.inlineDeleteText}>Sil</Text>
											</Pressable>
										</View>
									</Pressable>
								);
							})}
						</View>
					)}
				</View>

				<View
					style={[
						styles.panelCard,
						isDark ? styles.panelDark : styles.panelLight,
						isDesktop ? styles.permissionsPanelDesktop : null,
						!isDesktop && mobilePanel !== 'permissions' ? styles.hiddenPanel : null,
					]}
				>
					<View style={styles.panelHeaderRow}>
						<Text style={[styles.panelTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
							{selectedRole ? `${selectedRole.name} - Icazeler` : 'Icazeler'}
						</Text>
						<Pressable
							onPress={openPermissionCreateModal}
							disabled={moduleOptions.length === 0}
							style={[
								styles.primaryMiniButton,
								moduleOptions.length === 0 ? styles.saveButtonDisabled : null,
							]}
						>
							<Text style={styles.primaryMiniButtonText}>+ Yeni Icaze</Text>
						</Pressable>
					</View>

					{selectedRoleId === null ? (
						<View style={styles.emptyWrapLarge}>
							<Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
								Icazeleri gormek ucun evvelce rol secin.
							</Text>
						</View>
					) : loadingModules || loadingRolePermissions ? (
						<View style={styles.loadingWrapLarge}>
							<ActivityIndicator size="large" color="#2563eb" />
						</View>
					) : (
						<>
							<TextInput
								value={permissionSearch}
								onChangeText={setPermissionSearch}
								placeholder="Icaze axtar"
								placeholderTextColor={isDark ? '#6b7280' : '#94a3b8'}
								style={[styles.searchInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
							/>

							{filteredModules.length === 0 ? (
								<View style={styles.emptyWrapLarge}>
									<Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
										Icaze tapilmadi.
									</Text>
								</View>
							) : (
								<View style={styles.modulesStack}>
									{filteredModules.map(module => {
										const permissionIds = module.permissions.map(permission => permission.id);
										const moduleAllSelected = isModuleAllSelected(module.name, permissionIds);

										return (
											<View
												key={String(module.id)}
												style={[styles.moduleCard, isDark ? styles.moduleCardDark : styles.moduleCardLight]}
											>
												<Pressable
													onPress={() => toggleModule(module.name, permissionIds)}
													style={styles.moduleHeader}
												>
													<View style={[styles.checkbox, moduleAllSelected ? styles.checkboxChecked : null]}>
														{moduleAllSelected ? <Text style={styles.checkboxTick}>✓</Text> : null}
													</View>
													<Text style={[styles.moduleName, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
														{module.name}
													</Text>
													<Text style={[styles.moduleCounter, isDark ? styles.textMutedDark : styles.textMutedLight]}>
														{selectedPermissions[module.name]?.length ?? 0}/{module.permissions.length}
													</Text>
												</Pressable>

												<View style={styles.permissionList}>
													{module.permissions.map(permission => {
														const checked = isPermissionSelected(module.name, permission.id);
														return (
															<Pressable
																key={String(permission.id)}
																onPress={() => togglePermission(module.name, permission.id)}
																style={[
																	styles.permissionRow,
																	checked ? styles.permissionRowSelected : null,
																	isDark ? styles.permissionRowDark : styles.permissionRowLight,
																]}
															>
																<View style={[styles.checkbox, checked ? styles.checkboxChecked : null]}>
																	{checked ? <Text style={styles.checkboxTick}>✓</Text> : null}
																</View>
																<View style={styles.permissionTextWrap}>
																	<Text
																		style={[
																			styles.permissionTitle,
																			isDark ? styles.textPrimaryDark : styles.textPrimaryLight,
																		]}
																	>
																		{permission.details || permission.permission}
																	</Text>
																	<Text style={[styles.permissionCode, isDark ? styles.textMutedDark : styles.textMutedLight]}>
																		{permission.permission}
																	</Text>
																</View>
															</Pressable>
														);
													})}
												</View>
											</View>
										);
									})}
								</View>
							)}
						</>
					)}
				</View>
			</View>

			<Modal
				transparent
				visible={roleModalVisible}
				animationType="slide"
				onRequestClose={closeRoleModal}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					style={styles.modalRoot}
				>
					<Pressable style={styles.modalBackdrop} onPress={closeRoleModal} />
					<View style={[styles.modalCard, isDark ? styles.modalDark : styles.modalLight]}>
						<Text style={[styles.modalTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
							{roleModalMode === 'create' ? 'Yeni Rol' : 'Rolu Redakte Et'}
						</Text>

						<TextInput
							value={roleDraftName}
							onChangeText={setRoleDraftName}
							placeholder="Rol adi"
							placeholderTextColor={isDark ? '#6b7280' : '#94a3b8'}
							style={[styles.modalInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
						/>

						<View style={styles.modalActions}>
							<Pressable onPress={closeRoleModal} style={styles.modalGhostBtn}>
								<Text style={styles.modalGhostBtnText}>Legv Et</Text>
							</Pressable>
							<Pressable
								onPress={() => {
									void submitRole();
								}}
								disabled={savingRole}
								style={[styles.modalPrimaryBtn, savingRole ? styles.saveButtonDisabled : null]}
							>
								<Text style={styles.modalPrimaryBtnText}>
									{savingRole ? 'Yaddas saxlanir...' : 'Yaddas Saxla'}
								</Text>
							</Pressable>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>

			<Modal
				transparent
				visible={permissionCreateVisible}
				animationType="slide"
				onRequestClose={closePermissionCreateModal}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					style={styles.modalRoot}
				>
					<Pressable style={styles.modalBackdrop} onPress={closePermissionCreateModal} />
					<View style={[styles.modalCard, isDark ? styles.modalDark : styles.modalLight]}>
						<Text style={[styles.modalTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
							Yeni Icaze Elave Et
						</Text>

						<Text style={[styles.modalLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
							Modul
						</Text>
						<View style={styles.modulePickerWrap}>
							{moduleOptions.map(option => {
								const active = String(option.id) === permissionDraft.module_id;
								return (
									<Pressable
										key={String(option.id)}
										onPress={() =>
											setPermissionDraft(prev => ({ ...prev, module_id: String(option.id) }))
										}
										style={[styles.moduleChip, active ? styles.moduleChipActive : null]}
									>
										<Text style={[styles.moduleChipText, active ? styles.moduleChipTextActive : null]}>
											{option.name}
										</Text>
									</Pressable>
								);
							})}
						</View>

						<Text style={[styles.modalLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
							Icaze kodu
						</Text>
						<TextInput
							value={permissionDraft.permission_name}
							onChangeText={value =>
								setPermissionDraft(prev => ({ ...prev, permission_name: value }))
							}
							placeholder="meselen: users.create"
							placeholderTextColor={isDark ? '#6b7280' : '#94a3b8'}
							style={[styles.modalInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
						/>

						<Text style={[styles.modalLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
							Aciqlama
						</Text>
						<TextInput
							value={permissionDraft.permission_detail}
							onChangeText={value =>
								setPermissionDraft(prev => ({ ...prev, permission_detail: value }))
							}
							placeholder="icazenin qisa aciqlamasi"
							placeholderTextColor={isDark ? '#6b7280' : '#94a3b8'}
							style={[styles.modalInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
						/>

						<View style={styles.modalActions}>
							<Pressable onPress={closePermissionCreateModal} style={styles.modalGhostBtn}>
								<Text style={styles.modalGhostBtnText}>Legv Et</Text>
							</Pressable>
							<Pressable
								onPress={() => {
									void submitPermissionCreate();
								}}
								disabled={savingPermissionCreate}
								style={[styles.modalPrimaryBtn, savingPermissionCreate ? styles.saveButtonDisabled : null]}
							>
								<Text style={styles.modalPrimaryBtnText}>
									{savingPermissionCreate ? 'Elave olunur...' : 'Icazeni Elave Et'}
								</Text>
							</Pressable>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>

			<Modal
				transparent
				visible={deleteModalVisible}
				animationType="fade"
				onRequestClose={closeDeleteModal}
			>
				<View style={styles.modalRoot}>
					<Pressable style={styles.modalBackdrop} onPress={closeDeleteModal} />
					<View style={[styles.modalCard, isDark ? styles.modalDark : styles.modalLight]}>
						<Text style={[styles.modalTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
							Rolu silmek istediyinize eminsiniz?
						</Text>
						<Text style={[styles.modalSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
							{roleToDelete ? `Rol: ${roleToDelete.name}` : ''}
						</Text>

						<View style={styles.modalActions}>
							<Pressable onPress={closeDeleteModal} style={styles.modalGhostBtn}>
								<Text style={styles.modalGhostBtnText}>Legv Et</Text>
							</Pressable>
							<Pressable
								onPress={() => {
									void confirmDeleteRole();
								}}
								disabled={deletingRole}
								style={[styles.modalDangerBtn, deletingRole ? styles.saveButtonDisabled : null]}
							>
								<Text style={styles.modalDangerBtnText}>{deletingRole ? 'Silinir...' : 'Sil'}</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</AppPageLayout>
	);
}

const styles = StyleSheet.create({
	layoutContent: {
		paddingBottom: 40,
		gap: 16,
	},
	feedback: {
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderWidth: 1,
	},
	feedbackError: {
		backgroundColor: '#fef2f2',
		borderColor: '#fecaca',
	},
	feedbackSuccess: {
		backgroundColor: '#ecfdf5',
		borderColor: '#bbf7d0',
	},
	feedbackText: {
		color: '#111827',
		fontSize: 13,
		fontWeight: '600',
	},
	heroCard: {
		borderRadius: 18,
		borderWidth: 1,
		overflow: 'hidden',
		padding: 16,
		gap: 10,
	},
	heroGlowOne: {
		position: 'absolute',
		top: -28,
		right: -36,
		width: 118,
		height: 118,
		borderRadius: 59,
		backgroundColor: 'rgba(37,99,235,0.16)',
	},
	heroGlowTwo: {
		position: 'absolute',
		bottom: -36,
		left: -28,
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: 'rgba(14,165,233,0.12)',
	},
	heroTitle: {
		fontSize: 18,
		fontWeight: '800',
		letterSpacing: 0.2,
	},
	heroSubtitle: {
		fontSize: 13,
		lineHeight: 18,
		marginBottom: 2,
	},
	statsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		flexWrap: 'wrap',
	},
	statBadge: {
		minWidth: 96,
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderWidth: 1,
		gap: 2,
	},
	statBadgeLight: {
		backgroundColor: '#f8fafc',
		borderColor: '#e2e8f0',
	},
	statBadgeDark: {
		backgroundColor: '#0f172a',
		borderColor: '#1f2937',
	},
	statLabel: {
		fontSize: 11,
		fontWeight: '600',
	},
	statValue: {
		fontSize: 15,
		fontWeight: '800',
	},
	saveButton: {
		marginLeft: 'auto',
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 10,
		backgroundColor: '#2563eb',
	},
	saveButtonDisabled: {
		opacity: 0.5,
	},
	saveButtonText: {
		color: '#ffffff',
		fontSize: 12,
		fontWeight: '700',
	},
	contentStack: {
		gap: 14,
	},
	contentStackDesktop: {
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	hiddenPanel: {
		display: 'none',
	},
	rolesPanelDesktop: {
		width: 320,
		flexShrink: 0,
	},
	permissionsPanelDesktop: {
		flex: 1,
	},
	mobileTabs: {
		borderRadius: 12,
		borderWidth: 1,
		padding: 4,
		flexDirection: 'row',
		gap: 6,
	},
	mobileTabsLight: {
		backgroundColor: '#ffffff',
		borderColor: '#e2e8f0',
	},
	mobileTabsDark: {
		backgroundColor: '#0f172a',
		borderColor: '#334155',
	},
	mobileTabButton: {
		flex: 1,
		borderRadius: 10,
		paddingVertical: 9,
		alignItems: 'center',
		justifyContent: 'center',
	},
	mobileTabButtonLight: {
		backgroundColor: '#f8fafc',
	},
	mobileTabButtonDark: {
		backgroundColor: '#111827',
	},
	mobileTabButtonActive: {
		backgroundColor: '#2563eb',
	},
	mobileTabText: {
		fontSize: 12,
		fontWeight: '700',
	},
	mobileTabTextActive: {
		color: '#ffffff',
	},
	panelCard: {
		borderRadius: 16,
		borderWidth: 1,
		padding: 14,
		gap: 10,
	},
	panelLight: {
		backgroundColor: '#ffffff',
		borderColor: APP_LAYOUT_COLORS.borderLight,
		shadowColor: '#0f172a',
		shadowOpacity: 0.05,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 5 },
		elevation: 2,
	},
	panelDark: {
		backgroundColor: '#0f172a',
		borderColor: APP_LAYOUT_COLORS.borderDark,
	},
	panelHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 10,
	},
	panelTitle: {
		fontSize: 16,
		fontWeight: '800',
		flexShrink: 1,
	},
	primaryMiniButton: {
		borderRadius: 10,
		backgroundColor: '#2563eb',
		paddingHorizontal: 10,
		paddingVertical: 7,
	},
	primaryMiniButtonText: {
		color: '#ffffff',
		fontSize: 11,
		fontWeight: '700',
	},
	searchInput: {
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: 12,
		paddingVertical: 9,
		fontSize: 13,
		fontWeight: '500',
	},
	searchInputLight: {
		borderColor: '#dbeafe',
		backgroundColor: '#f8fafc',
		color: '#0f172a',
	},
	searchInputDark: {
		borderColor: '#334155',
		backgroundColor: '#0b1220',
		color: '#f8fafc',
	},
	loadingWrap: {
		paddingVertical: 10,
		alignItems: 'center',
	},
	loadingWrapLarge: {
		paddingVertical: 26,
		alignItems: 'center',
	},
	emptyWrap: {
		paddingVertical: 10,
		alignItems: 'center',
	},
	emptyWrapLarge: {
		paddingVertical: 26,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 13,
		textAlign: 'center',
		fontWeight: '500',
	},
	rolesList: {
		gap: 8,
	},
	roleRow: {
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: 10,
		paddingVertical: 9,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 8,
	},
	roleRowLight: {
		borderColor: '#e2e8f0',
		backgroundColor: '#ffffff',
	},
	roleRowDark: {
		borderColor: '#334155',
		backgroundColor: '#0b1220',
	},
	roleRowSelected: {
		borderColor: '#2563eb',
		backgroundColor: '#dbeafe',
	},
	roleRowLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		flexShrink: 1,
	},
	roleDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	roleDotIdle: {
		backgroundColor: '#94a3b8',
	},
	roleDotActive: {
		backgroundColor: '#2563eb',
	},
	roleName: {
		fontSize: 13,
		fontWeight: '700',
	},
	roleNameSelected: {
		color: '#1d4ed8',
	},
	roleActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	inlineActionBtn: {
		borderRadius: 8,
		paddingHorizontal: 8,
		paddingVertical: 4,
		backgroundColor: '#eff6ff',
	},
	inlineActionText: {
		color: '#1e40af',
		fontSize: 11,
		fontWeight: '700',
	},
	inlineDeleteBtn: {
		borderRadius: 8,
		paddingHorizontal: 8,
		paddingVertical: 4,
		backgroundColor: '#fee2e2',
	},
	inlineDeleteText: {
		color: '#b91c1c',
		fontSize: 11,
		fontWeight: '700',
	},
	modulesStack: {
		gap: 10,
	},
	moduleCard: {
		borderRadius: 12,
		borderWidth: 1,
		overflow: 'hidden',
	},
	moduleCardLight: {
		borderColor: '#dbeafe',
		backgroundColor: '#ffffff',
	},
	moduleCardDark: {
		borderColor: '#334155',
		backgroundColor: '#0b1220',
	},
	moduleHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingHorizontal: 10,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#e2e8f0',
	},
	moduleName: {
		flex: 1,
		fontSize: 13,
		fontWeight: '700',
	},
	moduleCounter: {
		fontSize: 11,
		fontWeight: '600',
	},
	checkbox: {
		width: 18,
		height: 18,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#94a3b8',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#ffffff',
	},
	checkboxChecked: {
		borderColor: '#2563eb',
		backgroundColor: '#2563eb',
	},
	checkboxTick: {
		color: '#ffffff',
		fontSize: 12,
		fontWeight: '800',
		lineHeight: 13,
	},
	permissionList: {
		gap: 6,
		padding: 8,
	},
	permissionRow: {
		borderRadius: 10,
		borderWidth: 1,
		paddingHorizontal: 8,
		paddingVertical: 8,
		flexDirection: 'row',
		gap: 8,
		alignItems: 'center',
	},
	permissionRowLight: {
		borderColor: '#e2e8f0',
		backgroundColor: '#f8fafc',
	},
	permissionRowDark: {
		borderColor: '#334155',
		backgroundColor: '#0f172a',
	},
	permissionRowSelected: {
		borderColor: '#2563eb',
		backgroundColor: '#dbeafe',
	},
	permissionTextWrap: {
		flex: 1,
		gap: 2,
	},
	permissionTitle: {
		fontSize: 12,
		fontWeight: '700',
	},
	permissionCode: {
		fontSize: 11,
		fontWeight: '500',
	},
	modalRoot: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	modalBackdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(15, 23, 42, 0.48)',
	},
	modalCard: {
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		borderWidth: 1,
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 24,
		gap: 12,
	},
	modalLight: {
		backgroundColor: '#ffffff',
		borderColor: '#e2e8f0',
	},
	modalDark: {
		backgroundColor: '#0b1220',
		borderColor: '#334155',
	},
	modalTitle: {
		fontSize: 16,
		fontWeight: '800',
	},
	modalSubtitle: {
		fontSize: 13,
		fontWeight: '500',
	},
	modalInput: {
		borderRadius: 12,
		borderWidth: 1,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 14,
		fontWeight: '500',
	},
	modalLabel: {
		fontSize: 12,
		fontWeight: '700',
		marginTop: -2,
	},
	modulePickerWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	moduleChip: {
		paddingHorizontal: 10,
		paddingVertical: 7,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#cbd5e1',
		backgroundColor: '#f8fafc',
	},
	moduleChipActive: {
		borderColor: '#2563eb',
		backgroundColor: '#dbeafe',
	},
	moduleChipText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#334155',
	},
	moduleChipTextActive: {
		color: '#1d4ed8',
	},
	modalActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 8,
	},
	modalGhostBtn: {
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#cbd5e1',
		paddingHorizontal: 12,
		paddingVertical: 9,
		backgroundColor: '#f8fafc',
	},
	modalGhostBtnText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#334155',
	},
	modalPrimaryBtn: {
		borderRadius: 10,
		backgroundColor: '#2563eb',
		paddingHorizontal: 12,
		paddingVertical: 9,
	},
	modalPrimaryBtnText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#ffffff',
	},
	modalDangerBtn: {
		borderRadius: 10,
		backgroundColor: '#dc2626',
		paddingHorizontal: 12,
		paddingVertical: 9,
	},
	modalDangerBtnText: {
		fontSize: 12,
		fontWeight: '700',
		color: '#ffffff',
	},
	textPrimaryLight: {
		color: APP_LAYOUT_COLORS.textLight,
	},
	textPrimaryDark: {
		color: APP_LAYOUT_COLORS.textDark,
	},
	textMutedLight: {
		color: '#64748b',
	},
	textMutedDark: {
		color: '#94a3b8',
	},
});

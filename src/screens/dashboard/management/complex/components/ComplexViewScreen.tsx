import React from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import {
    ArrowLeft,
    BadgeCheck,
    Building2,
    CalendarDays,
    FilePenLine,
    FileText,
    Globe,
    Mail,
    MapPin,
    MapPinned,
    Palette,
    Phone,
    SlidersHorizontal,
    Trash2,
} from 'lucide-react-native';

import { getValueByPath } from '../../../../../components/management/management-utils';
import { complexStyles as styles } from '../styles';
import { EntityItem } from '../types';
import { asText, getComplexName, normalizeDateTime, pickMeta, statusToLabel } from '../utils';

type ComplexViewScreenProps = {
    isDark: boolean;
    item: EntityItem | null;
    onClose: () => void;
    onEdit: (item: EntityItem) => void;
    onParams: (item: EntityItem) => void;
    onDelete: (item: EntityItem) => void;
};

type ViewRow = {
    key: string;
    label: string;
    value: string;
    icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
    kind?: 'default' | 'color';
};

export function ComplexViewScreen({ isDark, item, onClose, onEdit, onParams, onDelete }: ComplexViewScreenProps) {
    const meta = pickMeta(item);
    const statusLabel = statusToLabel(item?.status);
    const createdAt = normalizeDateTime(getValueByPath(item, 'created_at'));
    const colorCodeRaw = asText(meta.color_code) || '-';
    const hasValidHexColor = /^#([\da-fA-F]{3}|[\da-fA-F]{6}|[\da-fA-F]{8})$/.test(colorCodeRaw.trim());
    const colorPreview = hasValidHexColor ? colorCodeRaw.trim() : isDark ? '#3f3f46' : '#cbd5e1';
    const pulseAnim = React.useRef(new Animated.Value(0)).current;
    const entryAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ]),
        );

        pulseLoop.start();

        return () => {
            pulseLoop.stop();
        };
    }, [pulseAnim]);

    React.useEffect(() => {
        const entry = Animated.timing(entryAnim, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
        });

        entry.start();

        return () => {
            entry.stop();
        };
    }, [entryAnim]);

    const pulseScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.18],
    });
    const pulseOpacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 0.05],
    });
    const badgeScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.06],
    });
    const entryTranslateY = entryAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0],
    });
    const entryScale = entryAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.985, 1],
    });

    const identityRows: ViewRow[] = [
        { key: 'name', label: 'Ad', value: item ? getComplexName(item) : '-', icon: Building2 },
        { key: 'status', label: 'Status', value: statusLabel, icon: BadgeCheck },
        { key: 'description', label: 'Tesvir', value: asText(meta.desc) || '-', icon: FileText },
        { key: 'created', label: 'Yaradilma tarixi', value: createdAt, icon: CalendarDays },
    ];

    const contactRows: ViewRow[] = [
        { key: 'address', label: 'Unvan', value: asText(meta.address) || '-', icon: MapPinned },
        { key: 'phone', label: 'Telefon', value: asText(meta.phone) || '-', icon: Phone },
        { key: 'email', label: 'Email', value: asText(meta.email) || '-', icon: Mail },
        { key: 'website', label: 'Website', value: asText(meta.website) || '-', icon: Globe },
    ];

    const locationRows: ViewRow[] = [
        {
            key: 'coordinates',
            label: 'Koordinatlar',
            value: `${asText(meta.lat) || '-'}, ${asText(meta.lng) || '-'}`,
            icon: MapPin,
        },
        {
            key: 'color_code',
            label: 'Reng kodu',
            value: colorCodeRaw,
            icon: Palette,
            kind: 'color',
        },
    ];

    const isStatusActive = String(item?.status).toLowerCase() !== 'inactive';

    return (
        <Animated.View
            style={[
                styles.viewScreenContainer,
                isDark ? styles.viewScreenContainerDark : styles.viewScreenContainerLight,
                styles.detailEntryContainer,
                {
                    opacity: entryAnim,
                    transform: [{ translateY: entryTranslateY }, { scale: entryScale }],
                },
            ]}
        >
            <View style={styles.viewScreenHeader}>
                <Pressable
                    onPress={onClose}
                    hitSlop={10}
                    style={[styles.detailBackButton, isDark ? styles.detailBackButtonDark : styles.detailBackButtonLight]}
                >
                    <ArrowLeft size={16} color={isDark ? '#f5f5f5' : '#0f172a'} strokeWidth={2.4} />
                    <Text style={[styles.detailBackButtonText, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>Geri</Text>
                </Pressable>


            </View>

            <View style={styles.formScreenBody}>
                <ScrollView style={styles.modalScroll} contentContainerStyle={[styles.modalScrollContent, styles.detailScreenScrollContent]}>
                    <View style={styles.detailHeroBlock}>
                        <View style={[styles.detailHeaderCard, isDark ? styles.detailHeaderCardDark : styles.detailHeaderCardLight]}>
                            <View style={styles.detailHeaderRow}>
                                <View style={[styles.detailHeaderIconWrap, isDark ? styles.detailHeaderIconWrapDark : styles.detailHeaderIconWrapLight]}>
                                    <Building2 size={17} color={isDark ? '#7dd3fc' : '#0369a1'} strokeWidth={2.2} />
                                </View>

                                <View style={styles.detailHeaderTextWrap}>
                                    <Text style={[styles.detailHeaderTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                                        Kompleks Melumatlari
                                    </Text>
                                    <Text style={[styles.detailHeaderSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                                        {item ? getComplexName(item) : '-'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.detailHeaderMetaRow}>
                                <View style={[
                                    styles.detailHeaderBadge,
                                    isStatusActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
                                ]}
                                >
                                    <BadgeCheck
                                        size={13}
                                        color={isStatusActive ? '#15803d' : '#b91c1c'}
                                        strokeWidth={2.2}
                                    />
                                    <Text style={[
                                        styles.detailHeaderBadgeText,
                                        isStatusActive ? styles.statusTextActive : styles.statusTextInactive,
                                    ]}
                                    >
                                        {statusLabel}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.viewSectionCard, isDark ? styles.viewSectionCardDark : styles.viewSectionCardLight]}>
                        <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                            Esas melumat
                        </Text>
                        {identityRows.map(row => (
                            <View key={row.key} style={[styles.viewInfoRow, styles.viewInfoRowModern]}>
                                <View style={[styles.viewInfoIconWrap, isDark ? styles.viewInfoIconWrapDark : styles.viewInfoIconWrapLight]}>
                                    <row.icon size={15} color={isDark ? '#a1a1aa' : '#475569'} strokeWidth={2.1} />
                                </View>
                                <View style={styles.viewInfoContent}>
                                    <Text style={[styles.viewInfoLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>{row.label}</Text>
                                    <Text style={[styles.viewInfoValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{row.value}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={[styles.viewSectionCard, isDark ? styles.viewSectionCardDark : styles.viewSectionCardLight]}>
                        <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                            Elaqe
                        </Text>
                        {contactRows.map(row => (
                            <View key={row.key} style={[styles.viewInfoRow, styles.viewInfoRowModern]}>
                                <View style={[styles.viewInfoIconWrap, isDark ? styles.viewInfoIconWrapDark : styles.viewInfoIconWrapLight]}>
                                    <row.icon size={15} color={isDark ? '#a1a1aa' : '#475569'} strokeWidth={2.1} />
                                </View>
                                <View style={styles.viewInfoContent}>
                                    <Text style={[styles.viewInfoLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>{row.label}</Text>
                                    <Text style={[styles.viewInfoValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{row.value}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={[styles.viewSectionCard, isDark ? styles.viewSectionCardDark : styles.viewSectionCardLight]}>
                        <Text style={[styles.viewSectionTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>
                            Yerlesme
                        </Text>
                        {locationRows.map(row => (
                            <View key={row.key} style={[styles.viewInfoRow, styles.viewInfoRowModern]}>
                                <View style={[styles.viewInfoIconWrap, isDark ? styles.viewInfoIconWrapDark : styles.viewInfoIconWrapLight]}>
                                    <row.icon size={15} color={isDark ? '#a1a1aa' : '#475569'} strokeWidth={2.1} />
                                </View>
                                <View style={styles.viewInfoContent}>
                                    <Text style={[styles.viewInfoLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>{row.label}</Text>

                                    {row.kind === 'color' ? (
                                        <View style={styles.viewColorValueRow}>
                                            <View style={[styles.viewColorSwatch, { backgroundColor: colorPreview }]} />
                                            <Text style={[styles.viewInfoValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{row.value}</Text>
                                        </View>
                                    ) : (
                                        <Text style={[styles.viewInfoValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}>{row.value}</Text>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={[styles.detailActionPanel, isDark ? styles.detailActionPanelDark : styles.detailActionPanelLight]}>
                        <Text style={[styles.detailActionPanelTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                            Emeliyyatlar
                        </Text>

                        <View style={[styles.screenActionsRow, styles.screenActionsRowCompact]}>
                            <Pressable
                                onPress={onClose}
                                style={[
                                    styles.screenActionButton,
                                    styles.screenActionBackButton,
                                    isDark ? styles.screenActionBackButtonDark : styles.screenActionBackButtonLight,
                                ]}
                            >
                                <ArrowLeft size={14} color={isDark ? '#e4e4e7' : '#334155'} strokeWidth={2.5} />
                                <Text style={[styles.screenActionGhostText, isDark && styles.screenActionGhostTextDark]}>Geri qayit</Text>
                            </Pressable>
                        </View>

                        <View style={styles.detailActionSubRow}>
                            <Pressable
                                onPress={() => {
                                    if (item) {
                                        onEdit(item);
                                    }
                                }}
                                style={[styles.screenActionButton, styles.screenActionPrimaryButton]}
                            >
                                <FilePenLine size={14} color="#ffffff" strokeWidth={2.3} />
                                <Text style={styles.screenActionPrimaryText}>Duzelis et</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    if (item) {
                                        onParams(item);
                                    }
                                }}
                                style={[styles.screenActionButton, styles.screenActionInfoButton]}
                            >
                                <SlidersHorizontal size={14} color="#ffffff" strokeWidth={2.3} />
                                <Text style={styles.screenActionPrimaryText}>Parametr</Text>
                            </Pressable>
                        </View>

                        <View style={[styles.screenActionsRow, styles.screenActionsRowCompact]}>
                            <Pressable
                                onPress={() => {
                                    if (item) {
                                        onDelete(item);
                                    }
                                }}
                                style={[styles.screenActionButton, styles.screenActionDangerButton, styles.screenActionWide]}
                            >
                                <Trash2 size={14} color="#ffffff" strokeWidth={2.3} />
                                <Text style={styles.screenActionPrimaryText}>Sil</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Animated.View>
    );
}

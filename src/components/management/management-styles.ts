import { StyleSheet } from 'react-native';
import { APP_LAYOUT_COLORS } from '../../theme/layout-colors';

export const managementStyles = StyleSheet.create({
  layoutContent: {
    paddingHorizontal: 14,
  },

  screen: {
    flex: 1,
    paddingBottom: 24,
  },
  screenLight: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundLight,
  },
  screenDark: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundDark,
  },

  heroCard: {
    overflow: 'hidden',
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  heroCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  heroCardDark: {
    backgroundColor: '#111114',
    borderColor: '#27272a',
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
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTextWrap: {
    flex: 1,
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

  statsCard: {
    minWidth: 96,
    borderRadius: 20,
    paddingVertical: 14,
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
    fontSize: 24,
    fontFamily: 'WorkSans-Bold',
  },

  activeMtkBadge: {
    alignSelf: 'flex-start',
    marginTop: 16,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  activeMtkBadgeLight: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  activeMtkBadgeDark: {
    backgroundColor: '#172554',
    borderColor: '#1d4ed8',
  },
  activeMtkText: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  activeMtkTextLight: {
    color: '#1d4ed8',
  },
  activeMtkTextDark: {
    color: '#bfdbfe',
  },

  complexFilterSection: {
    marginTop: 12,
    gap: 8,
  },
  complexFilterTitle: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  complexSelectTrigger: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  complexSelectTriggerLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  complexSelectTriggerDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  complexSelectTriggerDisabled: {
    opacity: 0.78,
  },
  complexSelectValue: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  complexSelectCaret: {
    fontSize: 11,
    marginLeft: 10,
    fontFamily: 'WorkSans-Bold',
  },
  complexOptionsList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe4ef',
    padding: 6,
    gap: 6,
  },
  complexOptionRow: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  complexOptionRowLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  complexOptionRowDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  complexOptionRowSelectedLight: {
    backgroundColor: '#dbeafe',
    borderColor: '#60a5fa',
  },
  complexOptionRowSelectedDark: {
    backgroundColor: '#1e3a8a',
    borderColor: '#60a5fa',
  },
  complexOptionText: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  complexOptionTextSelectedLight: {
    color: '#1e3a8a',
  },
  complexOptionTextSelectedDark: {
    color: '#dbeafe',
  },

  toolbarCard: {
    marginTop: 16,
    gap: 12,
  },
  searchInput: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'WorkSans-Medium',
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
  },
  ghostButton: {
    backgroundColor: '#334155',
  },
  ghostButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'WorkSans-SemiBold',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },

  loadingBox: {
    minHeight: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadMoreFooter: {
    marginTop: 12,
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

  cardsList: {
    gap: 12,
  },
  entityCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  panelLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  panelDark: {
    backgroundColor: '#111114',
    borderColor: '#27272a',
  },
  entityCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarBubble: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'WorkSans-Bold',
  },
  entityMainContent: {
    flex: 1,
  },
  entityTitle: {
    fontSize: 17,
    fontFamily: 'WorkSans-Bold',
  },
  entitySubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'WorkSans-Regular',
  },
  idPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  idPillLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  idPillDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  idPillText: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
  },
  idPillTextLight: {
    color: '#475569',
  },
  idPillTextDark: {
    color: '#d4d4d8',
  },
  entityDivider: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.16)',
    marginVertical: 14,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewItem: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  previewItemLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  previewItemDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  previewLabel: {
    fontSize: 10,
    fontFamily: 'WorkSans-SemiBold',
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  cardHintRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHintText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  cardHintArrow: {
    fontSize: 18,
    fontFamily: 'WorkSans-Bold',
  },

  emptyStateCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'WorkSans-Bold',
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
    textAlign: 'center',
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
  textAccentLight: {
    color: '#2563eb',
  },
  textAccentDark: {
    color: '#60a5fa',
  },

  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.62)',
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 0,
  },
  modalPanel: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    padding: 18,
    maxHeight: '92%',
    width: '100%',
    alignSelf: 'stretch',
  },
  detailsPanel: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    padding: 18,
    maxHeight: '90%',
    width: '100%',
    alignSelf: 'stretch',
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalEyebrow: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'WorkSans-Bold',
  },
  closeIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeIconButtonLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  closeIconButtonDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  closeIconText: {
    fontSize: 16,
    fontFamily: 'WorkSans-Bold',
  },

  modalScroll: {
    maxHeight: 500,
  },
  modalScrollContent: {
    paddingBottom: 12,
  },
  formGrid: {
    gap: 12,
  },
  formBlock: {
    gap: 6,
  },
  latLngRow: {
    flexDirection: 'row',
    gap: 10,
  },
  latLngColumn: {
    flex: 1,
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  formInput: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'WorkSans-Medium',
  },
  formInputLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
    color: '#0f172a',
  },
  formInputDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
    color: '#f4f4f5',
  },
  formInputMultiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  selectRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  selectChip: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectChipLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  selectChipDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  selectChipText: {
    fontSize: 13,
    fontFamily: 'WorkSans-SemiBold',
  },
  selectChipTextLight: {
    color: '#334155',
  },
  selectChipTextDark: {
    color: '#d4d4d8',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe4ef',
  },
  colorInput: {
    flex: 1,
  },
  mapPickerContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 250,
  },
  mapPickerLight: {
    borderColor: '#dbe4ef',
    backgroundColor: '#f8fafc',
  },
  mapPickerDark: {
    borderColor: '#303036',
    backgroundColor: '#18181b',
  },
  mapWebView: {
    flex: 1,
    minHeight: 250,
  },
  mapHint: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  mapHintLight: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: '#dbe4ef',
  },
  mapHintDark: {
    backgroundColor: 'rgba(24,24,27,0.88)',
    borderColor: '#303036',
  },
  mapHintText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  mapHintTextLight: {
    color: '#0f172a',
  },
  mapHintTextDark: {
    color: '#d4d4d8',
  },
  mapPickerError: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  mapOpenButton: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  mapOpenButtonLight: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  mapOpenButtonDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  mapOpenButtonText: {
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  mapOpenButtonTextLight: {
    color: '#1d4ed8',
  },
  mapOpenButtonTextDark: {
    color: '#bfdbfe',
  },

  sectionCard: {
    marginTop: 16,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
  },
  sectionCardLight: {
    backgroundColor: '#f8fbff',
    borderColor: '#dbeafe',
  },
  sectionCardDark: {
    backgroundColor: '#141923',
    borderColor: '#1f3b68',
  },
  bindSectionLight: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  bindSectionDark: {
    backgroundColor: '#221214',
    borderColor: '#7f1d1d',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'WorkSans-Bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
    marginBottom: 12,
  },

  inlineButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
  },

  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  footerButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerGhostButton: {
    backgroundColor: '#334155',
  },
  footerPrimaryButton: {
    backgroundColor: '#2563eb',
  },
  footerGhostText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'WorkSans-Bold',
  },
  footerPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'WorkSans-Bold',
  },
  detailsActionRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  detailsGrid: {
    gap: 10,
  },
  detailRowCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  detailRowCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  detailRowCardDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  detailRowLabel: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
    marginBottom: 4,
  },
  detailRowPath: {
    fontSize: 10,
    fontFamily: 'WorkSans-Regular',
    marginBottom: 2,
  },
  detailRowValue: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'WorkSans-SemiBold',
  },
  emptyDetailsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  emptyDetailsCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  emptyDetailsCardDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  emptyDetailsText: {
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
  },
  jsonInput: {
    fontFamily: 'Courier',
  },

  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittingLoader: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

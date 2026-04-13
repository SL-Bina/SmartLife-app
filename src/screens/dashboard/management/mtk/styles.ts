import { StyleSheet } from 'react-native';

import { APP_LAYOUT_COLORS } from '../../../../theme/layout-colors';

export const mtkStyles = StyleSheet.create({
  layoutContent: {
    paddingBottom: 120,
  },
  screen: {
    flex: 1,
    gap: 12,
  },
  screenLight: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundLight,
  },
  screenDark: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundDark,
  },
  detailRouteRoot: {
    flex: 1,
    paddingHorizontal: 14,
  },
  detailRouteRootLight: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundLight,
  },
  detailRouteRootDark: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundDark,
  },
  formPageContentWrap: {
    paddingHorizontal: 0,
    flex: 1,
  },
  detailEntryContainer: {
    flex: 1,
  },
  detailHeroBlock: {
    marginBottom: 2,
  },
  detailBackButton: {
    minHeight: 38,
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    marginBottom: 10,
  },
  detailBackButtonLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  detailBackButtonDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
  },
  detailBackButtonText: {
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  detailHeaderCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  detailHeaderCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  detailHeaderCardDark: {
    backgroundColor: '#11141b',
    borderColor: '#2f3745',
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailHeaderIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  detailHeaderIconWrapLight: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  detailHeaderIconWrapDark: {
    backgroundColor: '#0f2231',
    borderColor: '#1e3a4b',
  },
  detailHeaderTextWrap: {
    flex: 1,
  },
  detailHeaderTitle: {
    fontSize: 20,
    fontFamily: 'WorkSans-Bold',
  },
  detailHeaderSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  detailHeaderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailHeaderBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailHeaderBadgeText: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
  },

  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroCardLight: {
    borderColor: '#dbe4ef',
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroCardDark: {
    borderColor: '#27272a',
    backgroundColor: '#101012',
  },
  heroGradient: {
    padding: 14,
    gap: 8,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  heroTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  heroEyebrow: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 1,
    fontSize: 20,
    fontFamily: 'WorkSans-Bold',
  },
  heroSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  createButton: {
    minHeight: 36,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
  },
  searchInputLight: {
    backgroundColor: '#fff',
    borderColor: '#dbe4ef',
    color: '#0f172a',
  },
  searchInputDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
    color: '#f4f4f5',
  },
  searchButton: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonPrimary: {
    backgroundColor: '#0f766e',
  },
  searchButtonText: {
    color: '#f0fdfa',
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  clearButton: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#334155',
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },

  listWrap: {
    flexDirection: 'column',
    gap: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    minHeight: 168,
    justifyContent: 'space-between',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#cfd8e3',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#11141b',
    borderColor: '#2f3745',
  },
  cardPressed: {
    transform: [{ scale: 0.987 }],
    opacity: 0.93,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitleWrap: {
    flex: 1,
    paddingRight: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'WorkSans-Bold',
  },
  cardBody: {
    marginTop: 8,
    gap: 8,
  },
  cardMetaLine: {
    fontSize: 11,
    fontFamily: 'WorkSans-Medium',
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'WorkSans-Medium',
  },
  metaRow: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 3,
  },
  metaRowLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  metaRowDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeInactive: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: 'WorkSans-Bold',
  },
  statusTextActive: {
    color: '#15803d',
  },
  statusTextInactive: {
    color: '#b91c1c',
  },
  cardFooter: {
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardFooterLight: {
    borderTopColor: '#e2e8f0',
  },
  cardFooterDark: {
    borderTopColor: '#303036',
  },
  cardActionText: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  cardChevron: {
    fontSize: 17,
    fontFamily: 'WorkSans-Bold',
    opacity: 0.75,
  },

  centerStateWrap: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
  },
  loadMoreWrap: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.62)',
    justifyContent: 'flex-end',
  },
  formScreenKeyboardWrap: {
    flex: 1,
  },
  formScreenContainer: {
    flex: 1,
    paddingHorizontal: 2,
    paddingTop: 2,
    paddingBottom: 0,
  },
  formScreenContainerLight: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundLight,
  },
  formScreenContainerDark: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundDark,
  },
  formScreenHeader: {
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  formScreenBody: {
    flex: 1,
    minHeight: 120,
  },
  viewScreenContainer: {
    flex: 1,
    paddingHorizontal: 2,
    paddingTop: 2,
    paddingBottom: 0,
  },
  viewScreenContainerLight: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundLight,
  },
  viewScreenContainerDark: {
    backgroundColor: APP_LAYOUT_COLORS.backgroundDark,
  },
  viewScreenHeader: {
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  viewHeroRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  viewHeroCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 6,
  },
  viewHeroCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  viewHeroCardDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  viewHeroLabel: {
    fontSize: 10,
    fontFamily: 'WorkSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  viewHeroValue: {
    fontSize: 12,
    fontFamily: 'WorkSans-SemiBold',
  },
  viewStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    minWidth: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewStatusWrap: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewStatusPulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  viewStatusPulseActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.35)',
  },
  viewStatusPulseInactive: {
    backgroundColor: 'rgba(220, 38, 38, 0.35)',
  },
  viewSectionCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 9,
  },
  viewSectionCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  viewSectionCardDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  viewSectionTitle: {
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  viewInfoRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: 8,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  viewInfoRowModern: {
    paddingTop: 10,
    paddingBottom: 2,
  },
  viewInfoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  viewInfoIconWrapLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
  },
  viewInfoIconWrapDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
  },
  viewInfoContent: {
    flex: 1,
    gap: 3,
  },
  viewInfoLabel: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
    textTransform: 'uppercase',
  },
  viewInfoValue: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'WorkSans-SemiBold',
  },
  viewColorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewColorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  modalPanel: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    width: '100%',
    maxHeight: '92%',
    minHeight: '60%',
  },
  modalPanelLight: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
  },
  modalPanelDark: {
    backgroundColor: '#101012',
    borderColor: '#27272a',
  },
  modalHeader: {
    marginBottom: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalCloseButtonLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  modalCloseButtonDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  modalCloseButtonText: {
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'WorkSans-Bold',
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'WorkSans-Medium',
  },
  modalBody: {
    flex: 1,
    minHeight: 120,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 12,
    gap: 10,
  },
  detailScreenScrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  screenActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  screenActionsRowTwoCol: {
    justifyContent: 'space-between',
  },
  screenActionsRowThreeCol: {
    justifyContent: 'space-between',
  },
  screenActionButton: {
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  screenActionButtonLightGhost: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
    flex: 1,
  },
  screenActionButtonDarkGhost: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
    flex: 1,
  },
  screenActionPrimaryButton: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
    flex: 1,
  },
  screenActionDangerButton: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
    flex: 1,
  },
  screenActionGhostText: {
    color: '#334155',
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  screenActionGhostTextDark: {
    color: '#e4e4e7',
  },
  screenActionPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  footerLight: {
    borderTopColor: '#e2e8f0',
  },
  footerDark: {
    borderTopColor: '#303036',
  },
  footerButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerGhostButton: {
    backgroundColor: '#334155',
  },
  footerPrimaryButton: {
    backgroundColor: '#2563eb',
  },
  footerDangerButton: {
    backgroundColor: '#dc2626',
  },
  footerGhostText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  footerPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'WorkSans-Bold',
  },
  footerButtonDisabled: {
    opacity: 0.7,
  },

  formColorPreviewCard: {
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  formColorPreviewCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  formColorPreviewCardDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  formColorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  formColorMetaLabel: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
    textTransform: 'uppercase',
  },
  formColorMetaValue: {
    marginTop: 3,
    fontSize: 14,
    fontFamily: 'WorkSans-Bold',
  },

  formSectionTitle: {
    fontSize: 11,
    fontFamily: 'WorkSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formFieldBlock: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  formFieldBlockModern: {
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  formFieldBlockLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  formFieldBlockDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  formFieldLabel: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
    textTransform: 'uppercase',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 42,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'WorkSans-Medium',
  },
  formInputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ef',
    color: '#0f172a',
  },
  formInputDark: {
    backgroundColor: '#11141b',
    borderColor: '#303036',
    color: '#f4f4f5',
  },
  formInputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formHalfField: {
    flex: 1,
  },
  formStatusGroup: {
    gap: 8,
  },
  formStatusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formStatusOption: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formStatusOptionIdleLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  formStatusOptionIdleDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  formStatusOptionActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#15803d',
  },
  formStatusOptionInactive: {
    backgroundColor: '#fee2e2',
    borderColor: '#b91c1c',
  },
  formStatusOptionText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  formStatusOptionTextActive: {
    color: '#15803d',
  },
  formStatusOptionTextInactive: {
    color: '#b91c1c',
  },

  fieldCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  fieldCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  fieldCardDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'WorkSans-SemiBold',
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'WorkSans-SemiBold',
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: 'WorkSans-Medium',
  },
  inputLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
    color: '#0f172a',
  },
  inputDark: {
    backgroundColor: '#18181b',
    borderColor: '#303036',
    color: '#f4f4f5',
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionIdle: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4ef',
  },
  statusOptionActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#15803d',
  },
  statusOptionInactive: {
    backgroundColor: '#fee2e2',
    borderColor: '#b91c1c',
  },
  statusOptionText: {
    fontSize: 12,
    fontFamily: 'WorkSans-Bold',
  },
  statusOptionTextIdle: {
    color: '#334155',
  },
  statusOptionTextActive: {
    color: '#15803d',
  },
  statusOptionTextInactive: {
    color: '#b91c1c',
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
    color: '#7dd3fc',
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

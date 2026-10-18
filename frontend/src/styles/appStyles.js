import { StyleSheet, Platform } from 'react-native';
import { THEME, SERIF_FONT } from '../constants/theme';

export const styles = StyleSheet.create({
  // Desktop outer backdrop (centers the phone)
  desktopBackdrop: {
    flex: 1,
    backgroundColor: '#EBE4DB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  // Top control bar for web preview
  desktopControlBar: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  desktopControlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desktopBrand: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  desktopModeTag: {
    fontSize: 11,
    color: THEME.textSecondary,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  desktopViewToggle: {
    backgroundColor: THEME.paper,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  desktopViewToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.text,
  },

  // The Phone Bezel Frame
  phoneFrameWrapper: {
    width: '100%',
    maxWidth: 412,
    height: Platform.OS === 'web' ? '92vh' : '100%',
    maxHeight: 860,
    backgroundColor: '#1E1B18', // Titanium bezel color
    borderRadius: 44,
    padding: 10,
    borderWidth: 2,
    borderColor: '#38332F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.35,
    shadowRadius: 35,
    elevation: 20,
    overflow: 'hidden',
  },
  phoneContentContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: THEME.bg,
  },

  // Dynamic Island / Speaker notch
  phoneDynamicIsland: {
    height: 18,
    width: 90,
    backgroundColor: '#12100E',
    alignSelf: 'center',
    borderRadius: 10,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  phoneCameraDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2622',
  },
  phoneSpeakerBar: {
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#2A2622',
  },

  // Inner Phone Screen Canvas
  phoneInnerCanvas: {
    flex: 1,
    backgroundColor: THEME.bg,
    borderRadius: 34,
    overflow: 'hidden',
  },

  // Mobile Status Bar
  mobileStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 4,
  },
  mobileStatusTime: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text,
  },
  mobileStatusIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  mobileStatusIconItem: {
    fontSize: 11,
  },

  // Mobile Header
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  appHeaderTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: -0.3,
  },
  appHeaderSub: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: THEME.green,
    borderWidth: 1.5,
    borderColor: THEME.bg,
  },
  headerDevBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  headerDevBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Incomplete profile banner
  incompleteProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.amberBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(194, 94, 26, 0.2)',
    gap: 8,
  },
  incompleteIcon: {
    fontSize: 13,
  },
  incompleteText: {
    flex: 1,
    fontSize: 11,
    color: THEME.amber,
    fontWeight: '600',
  },
  incompleteArrow: {
    fontSize: 14,
    color: THEME.amber,
    fontWeight: '700',
  },

  // Scroll Body
  screenScrollView: {
    flex: 1,
  },
  screenScrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  // Auth Card
  authCard: {
    backgroundColor: THEME.paper,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16,
    alignItems: 'center',
  },
  authKicker: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  authTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  authDesc: {
    fontSize: 11,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  authBtnContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  googleBtnBox: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleNativeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0C9BE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    gap: 10,
    marginBottom: 4,
  },
  googleLogo: {
    width: 18,
    height: 18,
  },
  googleNativeBtnText: {
    color: '#1F1B18',
    fontSize: 13,
    fontWeight: '700',
  },
  fastDevBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: THEME.primaryLight,
    borderWidth: 1,
    borderColor: THEME.primaryBorder,
    borderRadius: 6,
  },
  fastDevBtnText: {
    color: THEME.primary,
    fontSize: 11,
    fontWeight: '700',
  },

  // Active Screen Frame
  activeScreenBox: {
    width: '100%',
  },
  screenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  screenTitleSerif: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '700',
    color: THEME.text,
  },
  screenStepBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.primary,
    backgroundColor: THEME.primaryLight,
    borderWidth: 1,
    borderColor: THEME.primaryBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  impactSubText: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 14,
  },

  // Form Fields (Add Trip)
  formGroup: {
    marginBottom: 12,
  },
  fieldKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.paper,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  airportCode: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.text,
  },
  cityName: {
    fontSize: 13,
    color: THEME.textSecondary,
  },
  inputRegularText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text,
  },
  inputIconRight: {
    fontSize: 13,
    color: THEME.textSecondary,
  },
  primaryTerracottaBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryTerracottaBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // Subtabs (Dashboard)
  subtabsRow: {
    flexDirection: 'row',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 6,
    marginBottom: 12,
  },
  subtabBtn: {
    paddingBottom: 4,
  },
  subtabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: THEME.primary,
  },
  subtabText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  subtabTextActive: {
    color: THEME.primary,
    fontWeight: '700',
  },

  routeBox: {
    backgroundColor: THEME.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    marginBottom: 12,
  },
  routeTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 2,
  },
  routeDateText: {
    fontSize: 11,
    color: THEME.textSecondary,
  },

  // Segments
  segmentList: {
    gap: 8,
  },
  segmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 10,
    gap: 10,
  },
  segmentCardAlert: {
    borderColor: THEME.primary,
    backgroundColor: '#FFFBF9',
  },
  segmentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: THEME.paperSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentEmoji: {
    fontSize: 15,
  },
  segmentName: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text,
  },
  segmentDetail: {
    fontSize: 10,
    color: THEME.textSecondary,
  },
  viewImpactHint: {
    fontSize: 9,
    color: THEME.primary,
    fontWeight: '700',
    marginTop: 2,
  },

  // Badges
  badgeGreen: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.green,
    backgroundColor: THEME.greenBg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeAmber: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.amber,
    backgroundColor: THEME.amberBg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeMuted: {
    fontSize: 10,
    color: THEME.textMuted,
    paddingHorizontal: 6,
  },

  // Impact View
  delayHeroCard: {
    backgroundColor: THEME.paper,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.primaryBorder,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  delayHeroKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  delayHeroTime: {
    fontFamily: SERIF_FONT,
    fontSize: 34,
    fontWeight: '800',
    color: THEME.primary,
    marginVertical: 2,
  },
  delayHeroLocation: {
    fontSize: 11,
    color: THEME.textSecondary,
    textAlign: 'center',
  },
  affectedHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  impactItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    marginBottom: 8,
  },
  impactItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 2,
  },
  impactItemSub: {
    fontSize: 10,
    color: THEME.textSecondary,
  },

  // Recovery Options
  recoveryOptionCard: {
    backgroundColor: THEME.paper,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    marginBottom: 10,
  },
  recoveryOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recoveryOptionBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 0.5,
  },
  recoveryOptionTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  recoveryOptionDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: THEME.textSecondary,
    marginBottom: 10,
  },
  recoveryOptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.paperSubtle,
    paddingTop: 8,
  },
  recoveryTimeText: {
    fontSize: 10,
    color: THEME.textMuted,
  },
  approveActionBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approveActionBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  outlineActionBtn: {
    borderWidth: 1,
    borderColor: THEME.borderDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  outlineActionBtnText: {
    color: THEME.text,
    fontSize: 11,
    fontWeight: '600',
  },

  // Action Tracker
  trackerGroup: {
    backgroundColor: THEME.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    marginBottom: 10,
  },
  trackerGroupHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  trackerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  trackerBullet: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  trackerBulletAmber: {
    fontSize: 12,
    color: THEME.amber,
  },
  trackerBulletDone: {
    fontSize: 12,
    color: THEME.green,
    fontWeight: '800',
  },
  trackerItemText: {
    fontSize: 11,
    color: THEME.text,
    flex: 1,
  },
  trackerItemDone: {
    color: THEME.textMuted,
    textDecorationLine: 'line-through',
  },
  scopeNoteBox: {
    backgroundColor: THEME.paperSubtle,
    borderWidth: 1,
    borderColor: THEME.borderDark,
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  scopeNoteTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.primary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  scopeNoteBody: {
    fontSize: 10,
    color: THEME.textSecondary,
    lineHeight: 14,
  },

  // Bottom Navigation Bar
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.paper,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabBarItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    position: 'relative',
  },
  tabBarIcon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.6,
  },
  tabBarIconActive: {
    opacity: 1,
  },
  tabBarLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  tabBarLabelActive: {
    color: THEME.primary,
    fontWeight: '700',
  },
  activeIndicatorDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.primary,
  },

  // Home Indicator Bar
  homeIndicatorBar: {
    width: 120,
    height: 4,
    backgroundColor: '#D1C9BE',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 4,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 27, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: THEME.paper,
    borderRadius: 16,
    width: '100%',
    maxWidth: 380,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: THEME.borderDark,
    overflow: 'hidden',
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  modalKicker: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  modalTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  closeModalBtn: {
    padding: 6,
  },
  closeModalBtnText: {
    fontSize: 15,
    color: THEME.textSecondary,
    fontWeight: '700',
  },
  modalScrollBody: {
    padding: 18,
  },
  modalAvatarBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatarPic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: THEME.primary,
    marginBottom: 8,
  },
  modalAvatarInitials: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalAvatarLetter: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  verifiedIdentityPill: {
    backgroundColor: THEME.primaryLight,
    borderColor: THEME.primaryBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedIdentityPillText: {
    color: THEME.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  saveAlertSuccess: {
    backgroundColor: THEME.greenBg,
    borderColor: THEME.green,
    borderWidth: 1,
    color: THEME.green,
    padding: 8,
    borderRadius: 6,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 11,
    fontWeight: '600',
  },
  modalFieldGroup: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: THEME.paperSubtle,
    borderWidth: 1,
    borderColor: THEME.borderDark,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: THEME.text,
    fontSize: 13,
  },
  disabledInputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  disabledInput: {
    backgroundColor: THEME.bgAlt,
    color: THEME.textMuted,
    paddingRight: 32,
  },
  lockBadge: {
    position: 'absolute',
    right: 10,
    fontSize: 12,
  },
  genderButtonRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: THEME.paperSubtle,
    borderWidth: 1,
    borderColor: THEME.borderDark,
  },
  genderSelectBtnActive: {
    backgroundColor: THEME.primaryLight,
    borderColor: THEME.primary,
  },
  genderSelectText: {
    color: THEME.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  genderSelectTextActive: {
    color: THEME.primary,
    fontWeight: '700',
  },
  ageAutoBadge: {
    color: THEME.green,
    fontSize: 10,
    fontWeight: '700',
  },
  saveProfileBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  saveProfileBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  signOutButton: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  signOutButtonText: {
    color: THEME.primary,
    fontWeight: '600',
    fontSize: 12,
  },
});

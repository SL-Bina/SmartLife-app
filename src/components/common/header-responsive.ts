const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const round = (value: number) => Math.round(value);

export type HeaderResponsiveMetrics = {
  horizontalPadding: number;
  topOffset: number;
  topButtonSize: number;
  topCenterInset: number;
  topTitleCollapsedHeight: number;
  topTitleExpandedBase: number;
  topTitlePaddingHorizontal: number;
  topTitlePaddingTop: number;
  topTitleTouchMinHeight: number;
  topTitleRowGap: number;
  topTitleFontSize: number;
  topChevronSize: number;
  topCheckSize: number;
  topDropdownRowHeight: number;
  topDropdownExtraPadding: number;
  topDropdownMaxHeight: number;
  topDropdownItemMinHeight: number;
  topDropdownItemPaddingHorizontal: number;
  topDropdownItemRadius: number;
  topDropdownItemMarginHorizontal: number;
  topDropdownItemMarginVertical: number;
  topDropdownTextSize: number;
  topInlineDropdownPaddingBottom: number;
  bottomOffset: number;
  bottomButtonSize: number;
  bottomActionGap: number;
  bottomTitleMarginHorizontal: number;
  bottomTitlePaddingHorizontal: number;
  bottomTitleFontSize: number;
  bottomBadgeSize: number;
  bottomBadgeInset: number;
  bottomBadgeHorizontalPadding: number;
  bottomBadgeFontSize: number;
  bottomBadgeLineHeight: number;
  sideIconSize: number;
  bellIconSize: number;
  layoutTopBlock: number;
  layoutTopPadding: number;
  layoutBottomPadding: number;
};

export const getHeaderResponsiveMetrics = (
  width: number,
  fontScale: number,
): HeaderResponsiveMetrics => {
  const boundedWidth = clamp(width || 360, 320, 460);
  const widthT = (boundedWidth - 320) / 140;
  const compactT = clamp((350 - boundedWidth) / 30, 0, 1);
  const boundedFontScale = clamp(fontScale || 1, 1, 1.35);
  const sizeFactor = 1 + (boundedFontScale - 1) * 0.18;
  const fontFactor = 1 + (boundedFontScale - 1) * 0.45;
  const compactSizeScale = lerp(1, 0.9, compactT);
  const compactSpaceScale = lerp(1, 0.86, compactT);
  const compactFontScale = lerp(1, 0.94, compactT);

  const compactSize = (value: number, min: number) =>
    round(Math.max(min, value * compactSizeScale));
  const compactSpace = (value: number, min: number) =>
    round(Math.max(min, value * compactSpaceScale));

  const horizontalPadding = compactSpace(round(lerp(14, 20, widthT)), 12);
  const topButtonSize = compactSize(round(lerp(48, 56, widthT) * sizeFactor), 44);
  const bottomButtonSize = compactSize(round(lerp(48, 54, widthT) * sizeFactor), 44);

  const sideIconSize = compactSize(round(lerp(21, 25, widthT)), 19);

  return {
    horizontalPadding,
    topOffset: compactSpace(round(lerp(6, 10, widthT)), 5),
    topButtonSize,
    topCenterInset:
      horizontalPadding + topButtonSize + compactSpace(round(lerp(8, 12, widthT)), 6),
    topTitleCollapsedHeight: compactSize(round(lerp(50, 58, widthT) * sizeFactor), 46),
    topTitleExpandedBase: compactSize(round(lerp(84, 94, widthT) * sizeFactor), 76),
    topTitlePaddingHorizontal: compactSpace(round(lerp(14, 18, widthT)), 12),
    topTitlePaddingTop: compactSpace(round(lerp(6, 8, widthT)), 5),
    topTitleTouchMinHeight: compactSize(round(lerp(42, 48, widthT) * sizeFactor), 40),
    topTitleRowGap: compactSpace(round(lerp(6, 9, widthT)), 5),
    topTitleFontSize: compactSize(
      round(lerp(14, 17, widthT) * fontFactor * compactFontScale),
      13,
    ),
    topChevronSize: compactSize(round(lerp(16, 20, widthT)), 15),
    topCheckSize: compactSize(round(lerp(16, 20, widthT)), 15),
    topDropdownRowHeight: compactSize(round(lerp(46, 54, widthT) * sizeFactor), 42),
    topDropdownExtraPadding: compactSpace(round(lerp(10, 14, widthT)), 8),
    topDropdownMaxHeight: compactSize(round(lerp(220, 280, widthT)), 200),
    topDropdownItemMinHeight: compactSize(round(lerp(46, 52, widthT) * sizeFactor), 42),
    topDropdownItemPaddingHorizontal: compactSpace(round(lerp(14, 18, widthT)), 12),
    topDropdownItemRadius: compactSpace(round(lerp(14, 18, widthT)), 12),
    topDropdownItemMarginHorizontal: compactSpace(round(lerp(6, 10, widthT)), 5),
    topDropdownItemMarginVertical: compactSpace(round(lerp(2, 4, widthT)), 2),
    topDropdownTextSize: compactSize(
      round(lerp(13, 15, widthT) * fontFactor * compactFontScale),
      12,
    ),
    topInlineDropdownPaddingBottom: compactSpace(round(lerp(6, 10, widthT)), 5),
    bottomOffset: compactSpace(round(lerp(10, 14, widthT)), 8),
    bottomButtonSize,
    bottomActionGap: compactSpace(round(lerp(8, 12, widthT)), 7),
    bottomTitleMarginHorizontal: compactSpace(round(lerp(8, 12, widthT)), 7),
    bottomTitlePaddingHorizontal: compactSpace(round(lerp(14, 20, widthT)), 12),
    bottomTitleFontSize: compactSize(
      round(lerp(14, 17, widthT) * fontFactor * compactFontScale),
      13,
    ),
    bottomBadgeSize: compactSize(round(lerp(16, 20, widthT)), 15),
    bottomBadgeInset: compactSpace(round(lerp(5, 7, widthT)), 4),
    bottomBadgeHorizontalPadding: compactSpace(round(lerp(4, 6, widthT)), 3),
    bottomBadgeFontSize: compactSize(
      round(lerp(9, 11, widthT) * fontFactor * compactFontScale),
      8,
    ),
    bottomBadgeLineHeight: compactSize(
      round(lerp(10, 12, widthT) * fontFactor * compactFontScale),
      9,
    ),
    sideIconSize,
    bellIconSize: compactSize(sideIconSize + 1, sideIconSize),
    layoutTopBlock: compactSize(round(topButtonSize * 0.92), 40),
    layoutTopPadding: compactSpace(round(topButtonSize * 0.62), 26),
    layoutBottomPadding: compactSpace(round(bottomButtonSize + 40), 78),
  };
};

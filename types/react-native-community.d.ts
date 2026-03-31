declare module '@aashu-dubey/react-native-rating-bar' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  interface RatingBarProps extends ViewProps {
    count?: number;
    rating?: number;
    initialRating?: number;
    direction?: 'horizontal' | 'vertical' | 'vertical-reverse';
    allowHalfRating?: boolean;
    itemCount?: number;
    itemSize?: number;
    glowColor?: string;
    ratingElement?: {
      full: JSX.Element | React.ReactNode;
      half: JSX.Element | React.ReactNode;
      empty: JSX.Element | React.ReactNode;
    };
    size?: number;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    starStyle?: any;
    containerStyle?: any;
    onGiveRating?: (rating: number) => void;
  }

  export default class RatingBar extends Component<RatingBarProps> {}
}

declare module '@miblanchard/react-native-slider' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  interface SliderProps extends ViewProps {
    value?: number | number[];
    disabled?: boolean;
    maximumValue?: number;
    minimumValue?: number;
    onValueChange?: (value: number | number[]) => void;
    onSlidingStart?: (value: number | number[]) => void;
    onSlidingComplete?: (value: number | number[]) => void;
    step?: number;
    maximumTrackTintColor?: string;
    minimumTrackTintColor?: string;
    thumbTintColor?: string;
  }

  export default class Slider extends Component<SliderProps> {}
}

declare module '@ptomasroos/react-native-multi-slider' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  interface MultiSliderProps extends ViewProps {
    values: number[];
    onValuesChange?: (values: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    selectedStyle?: any;
    sliderLength?: number;
    trackStyle?: any;
    customMarker?: React.ComponentType<any>;
    customMarkerLeft?: React.ComponentType<any>;
    customMarkerRight?: React.ComponentType<any>;
    customLabel?: React.ComponentType<any>;
    isMarkersSeparated?: boolean;
    markerContainerStyle?: any;
    markerOffsetY?: number;
    minMarkerOverlapDistance?: number;
    allowOverlap?: boolean;
    enableLabel?: boolean;
    snapped?: boolean;
    containerStyle?: any;
  }

  export default class MultiSlider extends Component<MultiSliderProps> {}
}

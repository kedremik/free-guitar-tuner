import RNAnimated from 'react-native-reanimated';

import * as TW from './index';

/**
 * Reanimated wrappers around the CSS-enabled primitives so `className` and
 * animated `style` work together (plain `Animated.View` skips className).
 */
export const Animated = {
  ...RNAnimated,
  View: RNAnimated.createAnimatedComponent(TW.View),
  Text: RNAnimated.createAnimatedComponent(TW.Text),
};

/**
 * react-native-css requires every styled element to be wrapped with
 * `useCssElement` so that the `className` prop is compiled to styles. These thin
 * wrappers are the universal (iOS / Android / web) building blocks used across
 * the app — import from `@/tw` instead of `react-native`.
 */
import React from 'react';
import {
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  Text as RNText,
  TextInput as RNTextInput,
  View as RNView,
} from 'react-native';
import {
  useCssElement,
  useNativeVariable as useFunctionalVariable,
} from 'react-native-css';

export type ViewProps = React.ComponentProps<typeof RNView> & { className?: string };
export const View = (props: ViewProps) => useCssElement(RNView, props, { className: 'style' });
View.displayName = 'CSS(View)';

export type TextProps = React.ComponentProps<typeof RNText> & { className?: string };
export const Text = (props: TextProps) => useCssElement(RNText, props, { className: 'style' });
Text.displayName = 'CSS(Text)';

export type TextInputProps = React.ComponentProps<typeof RNTextInput> & { className?: string };
export const TextInput = (props: TextInputProps) =>
  useCssElement(RNTextInput, props, { className: 'style' });
TextInput.displayName = 'CSS(TextInput)';

// Pressable/ScrollView have prop unions too large for `useCssElement` to infer,
// so the component arg is widened internally — the public props stay precise.
// Pressable/ScrollView have prop unions too large for `useCssElement` to infer,
// so the generic is pinned to just the className props it maps — the public
// function signature still exposes the full, precise prop types.
type ClassNameProps = {
  className?: string;
  contentContainerClassName?: string;
  style?: unknown;
  contentContainerStyle?: unknown;
};

export type PressableProps = React.ComponentProps<typeof RNPressable> & { className?: string };
export const Pressable = (props: PressableProps) =>
  useCssElement(RNPressable as React.ComponentType<ClassNameProps>, props as ClassNameProps, {
    className: 'style',
  });
Pressable.displayName = 'CSS(Pressable)';

export type ScrollViewProps = React.ComponentProps<typeof RNScrollView> & {
  className?: string;
  contentContainerClassName?: string;
};
export const ScrollView = (props: ScrollViewProps) =>
  useCssElement(RNScrollView as React.ComponentType<ClassNameProps>, props as ClassNameProps, {
    className: 'style',
    contentContainerClassName: 'contentContainerStyle',
  });
ScrollView.displayName = 'CSS(ScrollView)';

/** Read a CSS custom property (e.g. `--tuner-in-tune`) from JS. */
export const useCSSVariable =
  process.env.EXPO_OS !== 'web'
    ? useFunctionalVariable
    : (variable: string) => `var(${variable})`;

/// <reference types="nativewind/types" />

// Allow importing global stylesheets and CSS modules from TypeScript.
declare module '*.css' {
  const content: { readonly [className: string]: string };
  export default content;
}

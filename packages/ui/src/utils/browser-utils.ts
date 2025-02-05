import { Breakpoint } from '../interfaces/breakpoints';


export const addBreakpointListener = (
    breakpoint: Breakpoint,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listener: (this: MediaQueryList, ev: MediaQueryListEvent) => any,
): MediaQueryList => {
  // get the value of '--breakpoint-*'
  const breakpointPixel = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue(`--breakpoint-${breakpoint}`), 10);

  const mediaQueryList = window.matchMedia(`(min-width: ${breakpointPixel}px)`);

  // add event listener
  mediaQueryList.addEventListener('change', listener);

  return mediaQueryList;
};

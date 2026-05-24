export const motionTimings = {
  fast: 0.12,
  normal: 0.18,
  slow: 0.24,
  page: 0.3,
} as const;

export const motionEase = [0.22, 1, 0.36, 1] as const;

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: motionTimings.page,
    ease: motionEase,
  },
} as const;

export const softPopTransition = {
  type: "spring",
  stiffness: 520,
  damping: 32,
  mass: 0.7,
} as const;

export const listItemMotion = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: {
    duration: motionTimings.normal,
    ease: motionEase,
  },
} as const;

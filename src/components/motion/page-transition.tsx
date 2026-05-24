"use client";

import { motion, useReducedMotion } from "framer-motion";

import { pageTransition } from "@/lib/motion";

type PageTransitionProps = Readonly<{
  children: React.ReactNode;
}>;

export function PageTransition({ children }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      animate={pageTransition.animate}
      initial={pageTransition.initial}
      transition={pageTransition.transition}
    >
      {children}
    </motion.div>
  );
}

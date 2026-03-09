import { motion, type HTMLMotionProps } from "framer-motion";
import React from "react";

// Reusable hover-lift card wrapper
export const MotionCard = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & { children: React.ReactNode }
>(({ children, ...props }, ref) => (
  <motion.div
    ref={ref}
    whileHover={{ y: -3, boxShadow: "0 8px 24px -8px hsl(224 40% 10% / 0.1)" }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    {...props}
  >
    {children}
  </motion.div>
));
MotionCard.displayName = "MotionCard";

// Hover-scale for icon containers
export const MotionIcon = ({ children, ...props }: HTMLMotionProps<"div"> & { children: React.ReactNode }) => (
  <motion.div
    whileHover={{ scale: 1.12, rotate: 2 }}
    whileTap={{ scale: 0.92 }}
    transition={{ type: "spring", stiffness: 500, damping: 20 }}
    {...props}
  >
    {children}
  </motion.div>
);

// Stagger container for lists
export const StaggerContainer = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: 0.05, delayChildren: delay } },
    }}
  >
    {children}
  </motion.div>
);

// Stagger child item
export const StaggerItem = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 12 },
      visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    }}
  >
    {children}
  </motion.div>
);

// Fade-in on mount
export const FadeIn = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {children}
  </motion.div>
);

// Button press effect
export const MotionButton = ({ children, className, ...props }: HTMLMotionProps<"div"> & { children: React.ReactNode; className?: string }) => (
  <motion.div
    className={className}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.96 }}
    transition={{ type: "spring", stiffness: 500, damping: 25 }}
    {...props}
  >
    {children}
  </motion.div>
);

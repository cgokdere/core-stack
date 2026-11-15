import React, { useEffect, useState } from 'react';
import { MotionConfig, animate, motion, useReducedMotion } from 'framer-motion';

// Shared motion language: short, springy entrances that settle quickly.
// Everything animates transform and opacity only, and "reducedMotion: user" turns movement off
// for people who asked their system for less motion.
export const EASE = [0.22, 1, 0.36, 1];

export const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.03 } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.34, ease: EASE } },
};

export function MotionRoot({ children }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
      {children}
    </MotionConfig>
  );
}

// A list whose direct <Item>s cascade in. New items added later animate in as well.
export function Stagger({ as = 'ul', className, children, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={listVariants} initial="hidden" animate="show" {...rest}>
      {children}
    </Tag>
  );
}

export function Item({ as = 'li', className, children, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={itemVariants} {...rest}>
      {children}
    </Tag>
  );
}

export function FadeUp({ as = 'div', delay = 0, y = 14, className, children, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Draws a ring from 0 to `value` percent. The number itself is plain text (see Stats).
export function ProgressRing({ value, size = 148, stroke = 12, children }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} className="ring-track" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="ring-fill"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.1 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

// A number that counts up from 0. It is decorative (aria-hidden): put the real value in text
// that screen readers and tests can read, for example a visually hidden span next to it.
export function CountUp({ value, duration = 1.2, delay = 0, format = (n) => String(n), className }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setShown(value);
      return undefined;
    }
    const controls = animate(0, value, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration, delay, reduce]);

  return (
    <span className={className} aria-hidden="true">
      {format(shown)}
    </span>
  );
}

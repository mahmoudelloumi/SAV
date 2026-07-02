import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Infobulle légère au survol.
export default function Tooltip({ label, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-xs text-white shadow-lg z-10"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

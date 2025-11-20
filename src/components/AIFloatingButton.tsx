import { Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { COLORS } from '../data/uiConstants';

type AIFloatingButtonProps = {
  onClick: () => void;
};

const AIFloatingButton = ({ onClick }: AIFloatingButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
        border: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        zIndex: 1001
      }}
      title="Open Quartermaster AI"
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <Bot size={28} />
      </motion.div>
    </motion.button>
  );
};

export default AIFloatingButton;

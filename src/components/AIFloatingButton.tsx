import { Bot } from 'lucide-react';
import { COLORS } from '../data/uiConstants';

type AIFloatingButtonProps = {
  onClick: () => void;
};

const AIFloatingButton = ({ onClick }: AIFloatingButtonProps) => {
  return (
    <button
      onClick={onClick}
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
        zIndex: 1001,
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      }}
      title="Open Quartermaster AI"
    >
      <Bot size={28} />
    </button>
  );
};

export default AIFloatingButton;

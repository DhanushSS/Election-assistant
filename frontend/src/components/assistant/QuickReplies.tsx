'use client';

import { motion } from 'framer-motion';
import type { QuickReply } from '../../lib/constants/india-elections';

interface QuickRepliesProps {
  replies: QuickReply[];
  language: 'en' | 'hi';
  onSelect: (query: string) => void;  // eslint-disable-line no-unused-vars
  disabled: boolean;
}

export function QuickReplies({ replies, language, onSelect, disabled }: QuickRepliesProps) {
  return (
    <div className="flex flex-wrap gap-2 py-2" role="group" aria-label="Suggested questions">
      {replies.map((reply, idx) => (
        <motion.button
          key={reply.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(reply.query)}
          disabled={disabled}
          className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-full hover:border-orange-300 hover:text-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          aria-label={`Ask: ${language === 'hi' ? reply.labelHi : reply.label}`}
        >
          {language === 'hi' ? reply.labelHi : reply.label}
        </motion.button>
      ))}
    </div>
  );
}

import React from 'react';

interface WhatsAppPreviewBubbleProps {
  message: string;
}

function renderFormattedLine(line: string, lineIdx: number): React.ReactNode {
  if (!line.trim()) {
    return <div key={lineIdx} className="h-2.5" />;
  }

  // Tokenize *bold* and _italic_ segments safely without dangerouslySetInnerHTML
  const tokens = line.split(/(\*[^*]+\*|_[^_]+_)/g);

  return (
    <div key={lineIdx} className="leading-[1.45] break-words">
      {tokens.map((tok, i) => {
        if (tok.startsWith('*') && tok.endsWith('*') && tok.length > 2) {
          return (
            <strong key={i} className="font-semibold text-slate-900">
              {tok.slice(1, -1)}
            </strong>
          );
        }
        if (tok.startsWith('_') && tok.endsWith('_') && tok.length > 2) {
          return (
            <em key={i} className="italic text-slate-700">
              {tok.slice(1, -1)}
            </em>
          );
        }
        return <span key={i}>{tok}</span>;
      })}
    </div>
  );
}

export const WhatsAppPreviewBubble: React.FC<WhatsAppPreviewBubbleProps> = ({
  message,
}) => {
  const lines = message.split('\n');

  return (
    <div className="rounded-xl border border-slate-200 bg-[#EFEAE2] p-4 sm:p-5">
      <div className="mx-auto max-w-xl rounded-xl rounded-tl-none border border-emerald-900/10 bg-[#D9FDD3] px-4 py-3 text-[13px] text-slate-800 shadow-xs">
        <div className="space-y-0.5">{lines.map(renderFormattedLine)}</div>
        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-500 tabular-nums">
          <span>Prévia WhatsApp</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownTextProps {
  content: string;
  className?: string;
}

export function MarkdownText({ content, className }: MarkdownTextProps) {
  return (
    <div className={`prose prose-sm max-w-none text-[#1D1D1F] prose-strong:text-[#1D1D1F] prose-strong:font-bold prose-p:leading-relaxed prose-li:marker:text-[#86868B] ${className}`}>
      <ReactMarkdown
        components={{
          // 移除默认的段落间距，由外部控制
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <span className="font-bold text-[#1D1D1F]">{children}</span>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

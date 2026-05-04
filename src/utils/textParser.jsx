import React from 'react';

/**
 * Parses a single line of text for markdown-like formatting.
 * Supports nesting by recursively calling itself.
 * @param {string} text - The line of text to parse.
 * @param {string} keyPrefix - Prefix for React keys.
 * @returns {React.ReactNode} - The parsed JSX.
 */
const parseLine = (text, keyPrefix) => {
  if (!text) return null;

  // Regex to find **bold**, *italic*, __underline__, ~~strikethrough~~, and `code`
  // Order of regex parts can matter if they share prefix characters
  const regex = /(\*\*.*?\*\*|\*.*?\*|__.*?__|~~.*?~~|`.*?`)/g;
  
  const parts = text.split(regex);
  if (parts.length === 1) return text; // Base case: no formatting found

  return parts.map((part, index) => {
    if (!part) return null;
    const key = `${keyPrefix}-${index}`;

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{parseLine(part.slice(2, -2), key)}</strong>;
    }
    
    // Underline: __text__
    if (part.startsWith('__') && part.endsWith('__')) {
      return <u key={key}>{parseLine(part.slice(2, -2), key)}</u>;
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={key}>{parseLine(part.slice(1, -1), key)}</em>;
    }
    
    // Strikethrough: ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return <del key={key}>{parseLine(part.slice(2, -2), key)}</del>;
    }

    // Inline code: `text`
    // Usually code doesn't contain other markdown
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={key} className="chatbot-inline-code">{part.slice(1, -1)}</code>;
    }
    
    return part;
  });
};

/**
 * Parses text and returns JSX with bold (**), italic (*), and line breaks handled.
 * @param {string} text - The text to parse.
 * @returns {React.ReactNode} - The parsed JSX.
 */
export const parseText = (text) => {
  if (!text) return text;

  // Split by newlines first to handle line breaks
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => (
    <React.Fragment key={lineIndex}>
      {parseLine(line, `line-${lineIndex}`)}
      {lineIndex < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};

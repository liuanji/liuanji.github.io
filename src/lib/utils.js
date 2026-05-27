import React from "react"
import clsx from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(...inputs))
}

export const isIframe = window.self !== window.top;

export function ParseMarkdown({ text, target = '_blank' }) {
  // Regex to find standard Markdown links: [text](url)
  // const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const linkRegex = /\[([^\[\]]+)\]\(([^)]+)\)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match;
    const matchIndex = match.index;

    // Push preceding text
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    // Push the clickable link
    parts.push(
      React.createElement(
        'a',
        {
          key: matchIndex,
          href: url,
          target: target,
          rel: 'noopener noreferrer',
          className: 'text-blue-500 hover:underline font-medium',
        },
        linkText
      )
    );

    lastIndex = linkRegex.lastIndex;
  }

  // Push any remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  const initialParts =  parts.length > 0 ? parts : text;

  const finalParts = [];
  
  initialParts.forEach((part, index) => {
    // If the part is a string, we check it for bold text
    if (typeof part === 'string') {
      const boldRegex = /\*\*(.*?)\*\*/g;
      let boldLastIndex = 0;
      let boldMatch;

      while ((boldMatch = boldRegex.exec(part)) !== null) {
        const [fullMatch, boldText] = boldMatch;
        const matchIndex = boldMatch.index;

        // Push preceding normal text
        if (matchIndex > boldLastIndex) {
          finalParts.push(part.substring(boldLastIndex, matchIndex));
        }

        // Push the bold element
        finalParts.push(
          React.createElement(
            'span',
            {
              key: `bold-${index}-${matchIndex}`,
              className: 'text-inkwell font-medium',
            },
            boldText
          )
        );

        boldLastIndex = boldRegex.lastIndex;
      }

      // Push any remaining normal text after the last bold match
      if (boldLastIndex < part.length) {
        finalParts.push(part.substring(boldLastIndex));
      }
    } else {
      // If the part is already a React element (like our link), just keep it
      finalParts.push(part);
    }
  });

  return finalParts.length > 0 ? finalParts : text;
}
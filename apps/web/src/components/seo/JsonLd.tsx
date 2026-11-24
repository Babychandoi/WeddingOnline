import React from 'react';

/**
 * Safe server-rendered JSON-LD script block.
 * Escapes `<` to `\u003c` to prevent closing-tag injection from user-supplied strings.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- serialized JSON-LD with `<` escaped
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

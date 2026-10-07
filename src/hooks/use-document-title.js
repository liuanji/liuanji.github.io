import { useEffect } from 'react';

// Sets the browser tab title while the page is shown, then restores the site's
// default title from index.html.
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

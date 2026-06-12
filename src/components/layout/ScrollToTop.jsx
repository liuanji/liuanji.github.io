import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router preserves the window scroll position across route changes.
// This resets scroll to the top whenever the path changes, so navigating to
// a new page (e.g. /group) always starts at the top instead of inheriting the
// previous page's scroll offset. In-page hash links are left untouched so the
// home page's anchor scrolling keeps working.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Page changes in a single page app keep the old scroll position, so jump back to the top.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

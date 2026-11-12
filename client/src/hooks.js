import { useEffect } from 'react';

// Sets the tab title (and optionally tells search engines not to index the page)
export function usePageMeta(title, { noindex = false } = {}) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    let meta;
    if (noindex) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, nofollow';
      document.head.appendChild(meta);
    }
    return () => {
      document.title = prev;
      meta?.remove();
    };
  }, [title, noindex]);
}

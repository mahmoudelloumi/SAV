import { useEffect, useState } from 'react';

// Utilisé pour adapter la mise en page (sidebar, tables) aux petits écrans.
// Exemple : const estMobile = useMediaQuery('(max-width: 768px)');
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

import { useEffect } from 'react';

export function useTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} · Merkwerk` : 'Merkwerk – Denkspiele für Gedächtnis, Tempo und Wissen';
  }, [title]);
}

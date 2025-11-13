import { useParams } from 'react-router-dom';
import { BabyNamesPage } from './BabyNamesPage';
import { BabyNameDetailPage } from './BabyNameDetailPage';

export function BabyNamesRouter() {
  const { letter } = useParams<{ letter: string }>();

  // If the parameter is a single letter (a-z or A-Z), show the letter-filtered page
  // Otherwise, treat it as a baby name slug and show the detail page
  if (letter && letter.length === 1 && /^[a-zA-Z]$/.test(letter)) {
    return <BabyNamesPage />;
  }

  // It's a baby name slug
  return <BabyNameDetailPage />;
}

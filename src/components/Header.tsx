import Link from 'next/link';
import { Film } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card/50 backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Film className="h-6 w-6" />
            <span className="font-headline">CineMagic</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-primary">
              Editor
            </Link>
            <Link href="/about" className="transition-colors hover:text-primary">
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

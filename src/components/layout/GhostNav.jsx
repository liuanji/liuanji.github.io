import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Research', href: '#research-direction' },
  { label: 'News', href: '#news' },
  { label: 'Publications', href: '#publications' },
  { label: 'Teaching', href: '#teaching' },
  { label: 'Group', href: '/group', isPage: true },
  { label: 'Contact', href: '#contact' },
];

export default function GhostNav() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (e, hash) => {
    if (isHome) {
      e.preventDefault();
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    // If not on home, let the <a href="/#about"> do a full navigation
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'nav-scrolled' : 'nav-ghost'}`}>
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="font-tight font-bold text-inkwell text-lg tracking-tight hover:text-synapse transition-colors"
        >
          Anji Liu
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.isPage ? (
              <Link
                key={link.label}
                to={link.href}
                className={`font-sans text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? 'text-inkwell'
                    : 'text-data-grey hover:text-inkwell'
                }`}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={isHome ? link.href : `/${link.href}`}
                onClick={(e) => handleNav(e, link.href)}
                className="font-sans text-sm font-medium text-data-grey hover:text-inkwell transition-colors"
              >
                {link.label}
              </a>
            )
          )}

        </div>
        {/* Mobile menu placeholder */}
        <button className="md:hidden text-data-grey">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
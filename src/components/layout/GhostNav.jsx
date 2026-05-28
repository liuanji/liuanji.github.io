import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinksPI = [
  { label: 'About', href: '#about' },
  { label: 'Group', href: '/group', isPage: true },
  { label: 'Research', href: '#research-direction' },
  { label: 'News', href: '#news' },
  { label: 'Publications', href: '#publications' },
  { label: 'Teaching', href: '#teaching' },
  { label: 'Contact', href: '#contact' },
];

const navLinksGroup = [
  { label: 'Director', href: '#about' },
  { label: 'Group', href: '/group', isPage: true },
  { label: 'Research', href: '#research-direction' },
  { label: 'News', href: '#news' },
  { label: 'Publications', href: '#publications' },
  { label: 'Teaching', href: '#teaching' },
  { label: 'Contact', href: '#contact' },
];

export default function GhostNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  const isGroup = location.pathname.startsWith('/group');

  const navLinks = isGroup ? navLinksGroup : navLinksPI;

  const handleNav = (e, hash) => {
    setMobileMenuOpen(false);
    if (isHome) {
      e.preventDefault();
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all duration-300">
      {/* The navigation bar is now permanently fixed with a white background and slight blur effect */}
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
        
        {/* Name and Mini Logo Container */}
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
        >
          <span className="font-tight font-bold text-inkwell text-lg tracking-tight group-hover:text-synapse transition-colors">
            {isGroup ? 'NUS Tractable Bakery Lab' : 'Anji Liu'}
          </span>
          {/* Ensure your logo image is placed in the public/logos directory and update the file name below */}
          <img 
            src="/logos/logo-plain.png" 
            alt="Logo" 
            className="w-6 h-6 object-contain"
          />
        </Link>
        
        {/* Desktop Menu */}
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

        {/* Mobile menu toggle button */}
        <button 
          className="md:hidden text-data-grey p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg pb-4">
          <div className="flex flex-col px-8 pt-4 space-y-4">
            {navLinks.map((link) =>
              link.isPage ? (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-sans text-base font-medium transition-colors ${
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
                  className="font-sans text-base font-medium text-data-grey hover:text-inkwell transition-colors"
                >
                  {link.label}
                </a>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
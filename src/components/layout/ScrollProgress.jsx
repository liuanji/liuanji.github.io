import { useState, useEffect } from 'react';

const sections = [
  { id: 'about', label: 'Bio' },
  { id: 'research-direction', label: 'Research' },
  { id: 'news', label: 'News' }, 
  { id: 'publications', label: 'Publications' },
  { id: 'teaching', label: 'Teaching' },
  { id: 'contact', label: 'Contact' },
];

export default function ScrollProgress() {
  const [active, setActive] = useState('about');

  useEffect(() => {
    // Set up the observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // If the section crosses our threshold, make it active
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        // This creates a "trigger line" near the top of the screen.
        // It triggers when a section hits 120px from the top.
        rootMargin: '-120px 0px -70% 0px', 
      }
    );

    // Observe all section elements
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    // Cleanup
    return () => observer.disconnect();
  }, []);

  const handleClick = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-3">
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => handleClick(s.id)}
          title={s.label}
          className={`w-1.5 rounded-full transition-all duration-300 ${
            active === s.id
              ? 'h-8 bg-synapse'
              : 'h-3 bg-border-light hover:bg-data-grey/50'
          }`}
        />
      ))}
    </div>
  );
}
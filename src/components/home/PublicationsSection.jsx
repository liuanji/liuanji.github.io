import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Link, Code, ChevronDown } from 'lucide-react';
import { parseBib } from '../../lib/parseBib';
import bibRaw from '/publications.bib?url&raw';

const MY_NAME = 'Anji Liu';
const publications = parseBib(bibRaw);

function SmartAuthorList({ authorsStr }) {
  const containerRef = useRef(null);
  const fullTextRef = useRef(null);
  const [shouldTruncate, setShouldTruncate] = useState(false);

  // Dynamically measure text width vs container width
  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current && fullTextRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const fullTextWidth = fullTextRef.current.scrollWidth;
        // Add a 5px buffer to prevent rapid flickering on edge cases
        setShouldTruncate(fullTextWidth > containerWidth + 5);
      }
    };

    const observer = new ResizeObserver(checkWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    checkWidth();
    return () => observer.disconnect();
  }, [authorsStr]);

  const authorArray = authorsStr.split(',').map((a) => a.trim());
  
  const renderAuthor = (text, key) => {
    const isMe = text.includes(MY_NAME) || text.includes('A. Chen');
    return (
      <span key={key} className={isMe ? 'text-synapse font-semibold' : 'text-data-grey'}>
        {text}
      </span>
    );
  };

  const dots = (key) => <span key={key} className="text-data-grey">, ..., </span>;
  const comma = (key) => <span key={key} className="text-data-grey">, </span>;

  const buildList = (truncate) => {
    // If it fits, or if there are 3 or fewer authors, show everyone
    if (!truncate || authorArray.length <= 3) {
      return authorArray.map((author, i) => (
        <span key={`full-${i}`}>
          {renderAuthor(author, `fa-${i}`)}
          {i < authorArray.length - 1 && comma(`fc-${i}`)}
        </span>
      ));
    }

    // Smart Truncation Logic
    const myIndex = authorArray.findIndex((a) => a.includes(MY_NAME) || a.includes('A. Chen'));
    const result = [];

    if (myIndex <= 1 || myIndex === -1) {
      result.push(renderAuthor(authorArray[0], 'start-0'));
      result.push(comma('c1'));
      result.push(renderAuthor(authorArray[1], 'start-1'));
      result.push(dots('d1'));
      result.push(renderAuthor(authorArray[authorArray.length - 1], 'end'));
    } else if (myIndex >= authorArray.length - 2) {
      result.push(renderAuthor(authorArray[0], 'start-0'));
      result.push(dots('d1'));
      result.push(renderAuthor(authorArray[authorArray.length - 2], 'end-2'));
      result.push(comma('c1'));
      result.push(renderAuthor(authorArray[authorArray.length - 1], 'end-1'));
    } else {
      result.push(renderAuthor(authorArray[0], 'start-0'));
      result.push(dots('d1'));
      result.push(renderAuthor(authorArray[myIndex], 'mid'));
      result.push(dots('d2'));
      result.push(renderAuthor(authorArray[authorArray.length - 1], 'end'));
    }
    return result;
  };

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      {/* Invisible shadow element for measuring true one-line width */}
      <div 
        ref={fullTextRef} 
        className="absolute top-0 left-0 opacity-0 pointer-events-none whitespace-nowrap"
        aria-hidden="true"
      >
        {buildList(false)}
      </div>
      
      {/* Visible content that updates dynamically */}
      <div className="relative truncate">
        {buildList(shouldTruncate)}
      </div>
    </div>
  );
}

function PublicationRow({ pub }) {
  const [showBibtex, setShowBibtex] = useState(false);

  return (
    <div className="pub-row px-0 py-5">
      <div className="flex gap-6 items-start">
        <div className="font-mono text-sm text-data-grey/60 w-12 flex-shrink-0 pt-0.5">
          {pub.year}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-tight font-semibold text-inkwell text-base mb-1 leading-snug">
            {pub.title}
          </h4>
          
          {/* Replaced standard <p> with our new Smart Component */}
          <div className="text-sm mb-1.5">
            <SmartAuthorList authorsStr={pub.authors} />
          </div>

          <div className="font-mono text-xs text-data-grey italic flex items-center gap-2 flex-wrap">
            {pub.venue}
            {pub.highlight && (() => {
              const h = pub.highlight.toLowerCase();
              const cls = /oral/.test(h)
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : /spotlight/.test(h)
                ? 'bg-violet-50 text-violet-700 border-violet-200'
                : /best paper|outstanding paper/.test(h)
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200';
              return (
                <span className={`not-italic inline-block px-2 py-0.5 rounded-sm text-xs font-semibold border ${cls}`}>
                  {pub.highlight}
                </span>
              );
            })()}
          </div>
          <div className="pub-actions flex items-center gap-3 mt-2.5">
            {pub.pdf_url && (
              <a href={pub.pdf_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-synapse hover:underline">
                <FileText size={13} /> PDF
              </a>
            )}
            {pub.project_url && (
              <a href={pub.project_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-data-grey hover:text-inkwell">
                <Link size={13} /> Project
              </a>
            )}
            {pub.bibtex && (
              <button
                onClick={() => setShowBibtex(!showBibtex)}
                className="flex items-center gap-1.5 text-xs font-medium text-data-grey hover:text-inkwell">
                <Code size={13} /> BibTeX
                <ChevronDown size={11} className={`transition-transform ${showBibtex ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          {showBibtex && (
            <pre className="mt-2 p-3 bg-inkwell/3 rounded-lg font-mono text-xs text-data-grey whitespace-pre-wrap leading-relaxed border border-border-light">
              {pub.bibtex}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PublicationsSection() {
  const [activeYear, setActiveYear] = useState('All');

  const { recentYears, cutoffYear } = useMemo(() => {
    const sorted = Array.from(new Set(publications.map(p => Number(p.year)))).sort((a, b) => b - a);
    const recent = sorted.slice(0, 5);
    const cutoff = recent[recent.length - 1];
    return { recentYears: recent.map(String), cutoffYear: cutoff };
  }, []);

  const yearOptions = ['All', ...recentYears, `Before ${cutoffYear}`];

  const filtered = useMemo(() => {
    if (activeYear === 'All') return publications;
    if (activeYear === `Before ${cutoffYear}`) return publications.filter(p => p.year < cutoffYear);
    return publications.filter(p => String(p.year) === activeYear);
  }, [activeYear, cutoffYear]);

  return (
    <section id="publications" className="py-16" style={{ background: '#F8FAFC' }}>
      <div className="max-w-6xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <div className="font-mono text-sm text-data-grey mb-3">04 / Publications</div>
          <h2 className="font-tight font-bold text-4xl lg:text-5xl text-inkwell">
            Publications
          </h2>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-36 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="font-mono text-xs text-data-grey/70 uppercase tracking-widest mb-3">Year</div>
              <div className="space-y-1">
                {yearOptions.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setActiveYear(yr)}
                    className={`block w-full text-left font-mono text-sm px-3 py-1.5 rounded-lg transition-all ${
                      activeYear === yr
                        ? 'bg-inkwell text-white font-medium'
                        : 'text-data-grey hover:text-inkwell hover:bg-inkwell/5'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <div className="text-data-grey font-mono text-sm py-12 text-center">
                No publications found.
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[600px] pr-3 scrollbar-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}>
                {filtered.map((pub) => (
                  <PublicationRow key={pub.key} pub={pub} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
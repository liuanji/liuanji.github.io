import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Link as LinkIcon, Code, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import GhostNav from '../components/layout/GhostNav';
import { parseBib } from '../lib/parseBib';
import bibRaw from '/publications.bib?url&raw';
import { ParseMarkdown } from '@/lib/utils';

const MY_NAME = 'Anji Liu';
const publications = parseBib(bibRaw);

function SmartAuthorList({ authorsStr }) {
  const containerRef = useRef(null);
  const fullTextRef = useRef(null);
  const [shouldTruncate, setShouldTruncate] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current && fullTextRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const fullTextWidth = fullTextRef.current.scrollWidth;
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
    if (!truncate || authorArray.length <= 3) {
      return authorArray.map((author, i) => (
        <span key={`full-${i}`}>
          {renderAuthor(author, `fa-${i}`)}
          {i < authorArray.length - 1 && comma(`fc-${i}`)}
        </span>
      ));
    }

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
      <div 
        ref={fullTextRef} 
        className="absolute top-0 left-0 opacity-0 pointer-events-none whitespace-nowrap"
        aria-hidden="true"
      >
        {buildList(false)}
      </div>
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
                <LinkIcon size={13} /> Project
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

export default function Publications() {
  const [activeYear, setActiveYear] = useState('All');

  // Add this block to instantly scroll to the top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { recentYears, cutoffYear, hasOlderYears } = useMemo(() => {
    // Note: ensure you are using selectedPubs or publications based on your file
    const sorted = Array.from(new Set(publications.map(p => Number(p.year)))).sort((a, b) => b - a);
    const recent = sorted.slice(0, 8);
    const cutoff = recent[recent.length - 1];
    
    // Check if there are actually any years older than the 5 we just sliced
    const hasOlder = sorted.length > 8;

    return { 
      recentYears: recent.map(String), 
      cutoffYear: cutoff,
      hasOlderYears: hasOlder
    };
  }, [publications]); // make sure to include dependencies if needed

  // Conditionally add the "Before" string using the spread operator
  const yearOptions = [
    'All', 
    ...recentYears, 
    ...(hasOlderYears ? [`Before ${cutoffYear}`] : [])
  ];

  const processedPubs = useMemo(() => {
    const seenGroups = new Set();
    return publications.map(pub => {
      const group = pub.year >= cutoffYear ? String(pub.year) : `Before ${cutoffYear}`;
      const isFirstInGroup = !seenGroups.has(group);
      if (isFirstInGroup) seenGroups.add(group);
      return { ...pub, group, isFirstInGroup };
    });
  }, [cutoffYear]);

  useEffect(() => {
    const handleScroll = () => {
      const offset = 100; 
      let currentActive = 'All';

      for (const yr of yearOptions.slice(1)) {
        const element = document.getElementById(`group-${yr.replace(/\s+/g, '-')}`);
        if (element && element.getBoundingClientRect().top <= offset) {
          currentActive = yr;
        }
      }
      
      if (window.scrollY < 100) currentActive = 'All';

      setActiveYear((prev) => prev !== currentActive ? currentActive : prev);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [yearOptions]);

  const handleScrollToGroup = (yr) => {
    setActiveYear(yr);
    
    if (yr === 'All') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const elementId = `group-${yr.replace(/\s+/g, '-')}`;
    const element = document.getElementById(elementId);
    
    if (element) {
      const yOffset = -80; 
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-paper min-h-screen page-enter">
      <GhostNav />
      <main className="pt-24 pb-28">
        <div className="max-w-6xl mx-auto px-8">
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-16"
            >
            <Link to="/#publications" className="font-mono text-sm text-data-grey hover:text-inkwell transition-colors mb-4 inline-block">
                ← Back
            </Link>
            <div className="font-mono text-sm text-data-grey mb-3">Publications</div>
            <h1 className="font-tight font-bold text-5xl lg:text-6xl text-inkwell">
                Publications
            </h1>
            <p className="mt-4 text-data-grey max-w-2xl text-lg">
                <ParseMarkdown text="A full index of publications. Please also refer to my [Google Scholar](https://scholar.google.com/citations?hl=en&user=k_4zYecAAAAJ) page."/>
            </p>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="hidden lg:block w-36 flex-shrink-0 sticky top-32 self-start">
                <div>
                <div className="font-mono text-xs text-data-grey/70 uppercase tracking-widest mb-3">Year</div>
                <div className="space-y-1">
                    {yearOptions.map((yr) => (
                    <button
                        key={yr}
                        onClick={() => handleScrollToGroup(yr)}
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
                {processedPubs.length === 0 ? (
                <div className="text-data-grey font-mono text-sm py-12 text-center">
                    No publications found.
                </div>
                ) : (
                <div className="overflow-y-auto pr-3">
                    {processedPubs.map((pub) => (
                    <div 
                        key={pub.key} 
                        id={pub.isFirstInGroup ? `group-${pub.group.replace(/\s+/g, '-')}` : undefined}
                    >
                        <PublicationRow pub={pub} />
                    </div>
                    ))}
                </div>
                )}
            </div>
            </div>
        </div>
      </main>
    </div>
  );
}
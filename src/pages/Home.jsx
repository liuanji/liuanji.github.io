import GhostNav from '../components/layout/GhostNav';
import ScrollProgress from '../components/layout/ScrollProgress';
import HeroSection from '../components/home/HeroSection';
import ResearchDirectionSection from '../components/home/ResearchDirectionSection';
import ResearchSection from '../components/home/ResearchSection';
import NewsSection from '../components/home/NewsSection';
import PublicationsSection from '../components/home/PublicationsSection';
import TeachingSection from '../components/home/TeachingSection';
import ContactSection from '../components/home/ContactSection';
import { myCopyrightBody, myUpdateInfo } from '../data/profile';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      // Remove the '#' to get the pure ID string
      const targetId = location.hash.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);
  
  return (
    <div className="bg-paper min-h-screen page-enter">
      <GhostNav />
      <ScrollProgress />
      <main>
        <HeroSection />
        <ResearchDirectionSection />
        <NewsSection />
        <PublicationsSection />
        <TeachingSection />
        <ContactSection />
      </main>
      <footer className="py-8 border-t border-border-light">
        <div className="max-w-6xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-xs text-data-grey/60">
            {myCopyrightBody}
          </div>
          <div className="font-mono text-xs text-data-grey/40">
            {myUpdateInfo}
          </div>
        </div>
      </footer>
    </div>
  );
}
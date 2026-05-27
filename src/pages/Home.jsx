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

export default function Home() {
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
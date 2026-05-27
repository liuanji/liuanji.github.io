import { motion } from 'framer-motion';
import { Mail, BookOpen } from 'lucide-react';
import { FaXTwitter, FaLinkedin } from 'react-icons/fa6';
import profile from '../../data/profile';
import { ParseMarkdown } from '../../lib/utils';

const XIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
  </svg>
);

const BlueskyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 600 530" fill="currentColor">
    <path d="M135.72 44.03C202.216 93.951 273.74 195.17 300 249.49c26.262-54.316 97.782-155.54 164.28-205.46C512.26 8.009 590-19.862 590 68.825c0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.38-3.69-10.832-3.708-7.896-.017-2.936-1.193.516-3.707 7.896-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.449-163.25-81.433C20.15 217.613 10 86.535 10 68.825c0-88.687 77.742-60.816 125.72-24.795z"/>
  </svg>
);

export default function HeroSection() {
  return (
    <section id="about" className="flex items-center pt-16 bg-paper">
      <div className="max-w-6xl mx-auto px-8 w-full pt-20 pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
          {/* Portrait — 2/5 */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2 flex justify-center lg:justify-start"
          >
            <div className="relative">
              <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-2xl overflow-hidden ring-1 ring-border-light">
                <img
                  src={profile.avatarUrl}
                  alt="Anji Liu"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Abstract accent shape */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-xl bg-synapse/5 border border-synapse/10 -z-10" />
              <div className="absolute -top-4 -left-4 w-16 h-16 rounded-lg bg-inkwell/3 border border-inkwell/5 -z-10" />
            </div>
          </motion.div>

          {/* Identity — 3/5 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-3"
          >
            <div className="font-mono text-sm text-data-grey mb-4 tracking-wide">
              Assistant Professor · National University of Singapore
            </div>
            <h1 className="font-tight font-bold text-5xl lg:text-6xl text-inkwell leading-tight mb-4">
              Anji Liu
            </h1>
            <p className="text-2xl text-inkwell/80 leading-relaxed mb-2 font-sans">
              I build generative AI with sound reasoning.
            </p>
            <p className="text-base text-data-grey leading-relaxed mb-4 max-w-xl">
              My research focuses on building reliable, mathematically grounded generative AI.
              I integrate the expressiveness of deep generative models with the rigor of probabilistic reasoning. 
              <ParseMarkdown text=" My work spans designing scalable architectures for exact inference, developing efficient [systems](https://github.com/Tractables/pyjuice) to support them, "/>
              and applying these models to reasoning-intensive tasks, ranging from controllable generation to reliable decision-making.
            </p>

            {/* Social links */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { icon: Mail, label: 'Email', href: 'mailto:anjiliu@nus.edu.sg' },
                { icon: BookOpen, label: 'Google Scholar', href: 'https://scholar.google.com/citations?hl=en&user=k_4zYecAAAAJ' },
                { icon: FaXTwitter, label: 'X', href: 'https://x.com/liu_anji' },
                { icon: BlueskyIcon, label: 'Bluesky', href: 'https://bsky.app/profile/anjiliu.bsky.social' },
                { icon: FaLinkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/in/anji-liu-7610b7190/' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={label === 'Email' ? '_self' : '_blank'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-light text-data-grey hover:text-inkwell hover:border-inkwell/30 transition-all text-sm font-medium"
                >
                  <Icon size={15} />
                  {label}
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Research interests */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 pt-4"
        >
          <div className="font-mono text-xs text-data-grey/70 uppercase tracking-widest mb-6">Research Interests</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Probabilistic Machine Learning',
                desc: (
                  <ParseMarkdown 
                    text="Developing probabilistic models (e.g., [probabilistic circuits](https://yoojungchoi.github.io/files/ProbCirc20.pdf)) that scale to real-world complexity." 
                  />
                ),
              },
              {
                title: 'Deep Generative Models',
                desc: 'Advancing the expressiveness and scalability of architectures like diffusion LLMs.',
              },
              {
                title: 'Reliable Decision-Making',
                desc: 'Achieving reliable and efficient decision-making and problem solving with sound probabilistic inference.',
              },
            ].map((item) => (
              <div key={item.title} className="group">
                <div className="w-6 h-0.5 bg-synapse mb-3 transition-all duration-300 group-hover:w-10" />
                <h3 className="font-tight font-semibold text-inkwell text-sm mb-2">{item.title}</h3>
                <p className="text-data-grey text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
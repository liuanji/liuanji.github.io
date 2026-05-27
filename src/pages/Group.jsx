import { motion } from 'framer-motion';
import GhostNav from '../components/layout/GhostNav';
import { Home } from 'lucide-react';
import { FaXTwitter, FaLinkedin } from 'react-icons/fa6';
import { myCopyrightBody, myUpdateInfo } from '../data/profile';
import { ParseMarkdown } from '../lib/utils';

const PI = {
  name: 'Anji Liu',
  role: 'Principal Investigator',
  photo: '/photos/anji.png',
  bio: 'Assistant Professor at NUS SoC.',
  website: '/#',
  twitter: 'https://x.com/liu_anji',
  linkedin: 'https://linkedin.com/liuanji',
};

const currentMembers = [
  {
    name: 'Vit Chun Yap',
    role: 'Research Assistant',
    year: '',
    photo: '/photos/vitchun.jpeg',
    interests: 'Constrained/Controlled Generation',
    linkedin: 'https://sg.linkedin.com/in/vitchun',
    website: '#',
  },
  {
    name: 'Zhiyu Zhao',
    role: 'Research Assistant',
    year: '',
    photo: '/photos/zhiyu.jpg',
    interests: 'Reinforcement Learning, Probabilistic Inference',
    // twitter: '#',
    linkedin: 'https://www.linkedin.com/in/%E7%A5%89%E7%91%9C-%E8%B5%B5-7362b6399/',
    // website: '#',
  },
  {
    name: 'Xuejie Liu',
    role: 'PhD Student',
    year: '3rd year',
    photo: '/photos/xuejie.jpg',
    interests: 'Probabilistic Circuits, Diffusion Language Models',
    // twitter: '#',
    // linkedin: '#',
    website: 'https://scholar.google.com/citations?user=vxqpWKUAAAAJ',
    remarks: <ParseMarkdown text='Co-advised with [Muhan Zhang](https://muhanzhang.github.io/).'/>
  },
  {
    name: 'Kodai Kawamura',
    role: 'PhD Student',
    year: '1st year',
    photo: '/photos/kodai.png',
    interests: 'Diffusion Language Models',
    // twitter: '#',
    linkedin: 'https://www.linkedin.com/in/kodai-kawamura-498b75251/',
    website: 'https://kodaikawamura.github.io/kodaikawamura/',
    remarks: <ParseMarkdown text='Co-advised with [Kenji Kawaguchi](https://www.comp.nus.edu.sg/cs/people/kenji/).'/>
  },
  {
    name: 'Zak Guang Hong Tng',
    role: 'Undergraduate Student',
    year: '',
    photo: '/photos/default.jpg',
    interests: 'Diffusion Language Models',
    // twitter: '#',
    linkedin: 'https://www.linkedin.com/in/zaktng/',
    // website: '#',
  },
  {
    name: 'Kewei Lian',
    role: 'PhD Student',
    year: '1st year',
    photo: '/photos/kewei.jpg',
    interests: 'Probabilistic Inference',
    // twitter: '#',
    linkedin: 'https://www.linkedin.com/in/kewei-lian-1172b026a/',
    website: 'https://kevin-lkw.github.io/',
  },
];

const alumni = [
  {
    name: 'Anabel Yong',
    role: 'Intern 2026',
    placement: 'PhD Student at EPFL',
    topic: 'Topic: Probabilistic Circuit parameter learning.',
    website: 'https://anabelyong.github.io/',
  },
];

function MemberCard({ member, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white rounded-2xl border border-border-light p-6 hover:border-inkwell/20 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-border-light">
          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-tight font-semibold text-inkwell text-base leading-tight">{member.name}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="font-mono text-xs text-synapse">{member.role}</span>
            {member.year && (
              <span className="font-mono text-xs text-data-grey/60">· {member.year}</span>
            )}
          </div>
          {/* Optional Remarks: Below the role, still to the right of the photo */}
          {member.remarks && (
            <div className="mt-1.5 text-xs text-gray-600 leading-snug">
              {member.remarks}
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-data-grey mt-3 leading-relaxed">{member.interests}</p>
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-light">
        {member.website && (
          <a href={member.website} className="text-data-grey hover:text-inkwell transition-colors" target="_blank" title="Website">
            <Home size={14} />
          </a>
        )}
        {member.linkedin && (
          <a href={member.linkedin} className="text-data-grey hover:text-inkwell transition-colors" target="_blank" title="LinkedIn">
            <FaLinkedin size={14} />
          </a>
        )}
        {member.twitter && (
          <a href={member.twitter} className="text-data-grey hover:text-inkwell transition-colors" target="_blank" title="X">
            <FaXTwitter size={14} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default function Group() {
  return (
    <div className="bg-paper min-h-screen page-enter">
      <GhostNav />
      <main className="pt-24 pb-28">
        <div className="max-w-6xl mx-auto px-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-14"
          >
            <div className="font-mono text-sm text-data-grey mb-3">The Lab</div>
            {/* <h1 className="font-tight font-bold text-5xl lg:text-6xl text-inkwell mb-5">The Tractable Bakery Lab</h1> */}
            <div className="flex items-center gap-4 mb-5">
              <img 
                src="/logos/logo-plain.png" 
                alt="Tractable Bakery Lab Icon" 
                className="w-12 h-12 lg:w-16 lg:h-16 object-contain"
              />
              <h1 className="font-tight font-bold text-5xl lg:text-6xl text-inkwell">
                The Tractable Bakery Lab
              </h1>
            </div>
            <p className="text-data-grey max-w-2xl text-base leading-relaxed">
              We develop tractable probabilistic architectures and integrate exact inference into deep generative models to build reliable, mathematically grounded AI.
            </p>
          </motion.div>

          {/* PI */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-16"
          >
            <div className="font-mono text-xs text-data-grey/70 uppercase tracking-widest mb-5 mt-0">Principal Investigator</div>
            <div className="bg-inkwell rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-20 h-20 rounded-xl overflow-hidden ring-2 ring-white/20 flex-shrink-0">
                <img src={PI.photo} alt={PI.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h2 className="font-tight font-bold text-2xl text-white">{PI.name}</h2>
                <div className="font-mono text-sm text-synapse/80 mt-0.5 mb-2">{PI.role}</div>
                <p className="text-white/60 text-sm leading-relaxed max-w-xl">{PI.bio}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <a href={PI.website} className="text-white/50 hover:text-white transition-colors" target="_blank"><Home size={16} /></a>
                <a href={PI.twitter} className="text-white/50 hover:text-white transition-colors" target="_blank"><FaXTwitter size={16} /></a>
                <a href={PI.linkedin} className="text-white/50 hover:text-white transition-colors" target="_blank"><FaLinkedin size={16} /></a>
              </div>
            </div>
          </motion.div>

          {/* Current Members */}
          <div className="mb-20">
            <div className="font-mono text-xs text-data-grey/70 uppercase tracking-widest mb-5">
              Current Members <span className="text-data-grey/40">({currentMembers.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {currentMembers.map((member, i) => (
                <MemberCard key={member.name} member={member} index={i} />
              ))}
            </div>
          </div>

          {/* Alumni */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-mono text-xs text-data-grey/70 uppercase tracking-widest mb-5">
              Alumni <span className="text-data-grey/40">({alumni.length})</span>
            </div>
            <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
            {alumni.map((person, i) => (
              <div
                key={person.name}
                className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-7 py-5 ${i < alumni.length - 1 ? 'border-b border-border-light' : ''} hover:bg-inkwell/2 transition-colors`}
              >
                <div className="flex-1 min-w-0">
                  
                  {/* Flex container to align name and website icon side-by-side */}
                  <div className="flex items-center gap-2">
                    <span className="font-tight font-semibold text-inkwell text-sm">{person.name}</span>
                    
                    {/* Conditional rendering for the website logo */}
                    {person.website && (
                      <a 
                        href={person.website} 
                        className="text-data-grey/50 hover:text-inkwell transition-colors" 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Home size={14} />
                      </a>
                    )}
                  </div>

                  {person.topic && (
                    <p className="font-mono text-xs text-data-grey/60 mt-0.5 truncate">{person.topic}</p>
                  )}
                </div>
                <div className="font-mono text-xs text-data-grey/60 flex-shrink-0 w-24">{person.role}</div>
                <div className="font-mono text-xs text-synapse flex-shrink-0 sm:text-right">{person.placement}</div>
              </div>
            ))}
          </div>
          </motion.div>

          {/* Join CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 p-10 rounded-2xl border border-synapse/20 bg-synapse/4 text-center"
          >
            <h3 className="font-tight font-bold text-2xl text-inkwell mb-3">Join the Lab</h3>
            <p className="text-data-grey text-sm leading-relaxed max-w-lg mx-auto mb-6">
              We're actively recruiting students/researchers at all levels (e.g., PhD, Post-doc, Intern).
              Please reach out if you are interested.
            </p>
            <a
              href="mailto:anjiliu@nus.edu.sg"
              className="inline-flex items-center gap-2 bg-inkwell text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-inkwell/90 transition-colors"
            >
              Get in Touch
            </a>
          </motion.div>

        </div>
      </main>
      <footer className="py-8 border-t border-border-light">
        <div className="max-w-6xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-xs text-data-grey/60">{myCopyrightBody}</div>
          <div className="font-mono text-xs text-data-grey/40">{myUpdateInfo}</div>
        </div>
      </footer>
    </div>
  );
}
import { motion } from 'framer-motion';
import { Mail, MapPin } from 'lucide-react';
import { FaXTwitter, FaGithub } from 'react-icons/fa6';

export default function ContactSection() {
  return (
    <section id="contact" className="py-20" style={{ background: '#F8FAFC' }}>
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-mono text-sm text-data-grey mb-3">06 / Contact</div>
            <h2 className="font-tight font-bold text-4xl lg:text-5xl text-inkwell mb-6">
              Get in Touch
            </h2>
            <p className="text-data-grey leading-relaxed mb-8 text-base max-w-md">
              I'm always open to research collaborations, speaking invitations, 
              and connecting with students interested in AI. The best way to reach 
              me is via email.
            </p>
            <div className="space-y-4">
              {[
                { icon: Mail, label: 'anjiliu [at] nus.edu.sg', href: 'mailto:anjiliu@nus.edu.sg' },
                { icon: MapPin, label: 'COM2-03-51, 15 Computing Dr, Singapore', href: 'https://maps.app.goo.gl/B8cNrgw4k1tZsJ3f6' },
                { icon: FaXTwitter, label: '@liu_anji', href: 'https://x.com/liu_anji' },
                { icon: FaGithub, label: 'github.com/liuanji', href: 'https://github.com/liuanji' },
              ].map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={label === 'Email' ? '_self' : '_blank'}
                  className="flex items-center gap-4 text-sm text-data-grey hover:text-synapse transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-inkwell/5 flex items-center justify-center group-hover:bg-synapse/10 transition-colors">
                    <Icon size={15} className="text-inkwell group-hover:text-synapse transition-colors" />
                  </div>
                  {label}
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bg-inkwell rounded-2xl p-10 mt-2">
              <h3 className="font-tight font-bold text-xl text-white mb-6">Prospective Students</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                I'm actively looking for motivated students and postdoc researchers. If you are interested in working on topics described above, I would love to hear from you.
              </p>
              <div className="space-y-3">
                <div className="font-mono text-xs text-white/40 uppercase tracking-widest">Currently seeking</div>
                {['PhD Students (Spring/Fall 2027)', 'Postdoctoral Researchers', 'Research Interns (on-site or remote)'].map((role) => (
                  <div key={role} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-synapse" />
                    <span className="text-sm text-white/80">{role}</span>
                  </div>
                ))}
              </div>
              <a 
                href="mailto:anjiliu@nus.edu.sg" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail size={18} />
                Apply
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
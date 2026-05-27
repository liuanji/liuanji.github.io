import { motion } from 'framer-motion';

const projects = [
  {
    title: 'Tractable Probabilistic Circuits',
    area: 'Probabilistic ML',
    description: 'Developing scalable circuit representations that enable exact inference in polynomial time, bridging the gap between expressiveness and tractability.',
    impact: 'Enabling real-time probabilistic reasoning for safety-critical systems.',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&q=80',
    tag: 'Active',
  },
  {
    title: 'Neurosymbolic Reasoning',
    area: 'AI Foundations',
    description: 'Combining deep learning with symbolic logic to create systems that can learn from data while respecting hard logical constraints.',
    impact: 'Achieving human-like reasoning with provable guarantees.',
    image: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800&q=80',
    tag: 'Active',
  },
  {
    title: 'Uncertainty Quantification in LLMs',
    area: 'NLP',
    description: 'Novel methods for calibrating confidence in large language models, enabling reliable deployment in high-stakes decision-making environments.',
    impact: 'Making LLMs trustworthy for medical and legal applications.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    tag: 'Active',
  },
  {
    title: 'Causal Representation Learning',
    area: 'Causality',
    description: 'Discovering causal structure from observational data using a novel identifiability framework grounded in information geometry.',
    impact: 'Advancing scientific discovery through principled causal inference.',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80',
    tag: 'Past',
  },
];

const tagColors = {
  Active: 'text-synapse bg-synapse/8 border-synapse/20',
  Past: 'text-data-grey bg-data-grey/8 border-data-grey/20',
};

export default function ResearchSection() {
  return (
    <section id="research" className="py-28 bg-paper">
      <div className="max-w-6xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <div className="font-mono text-sm text-data-grey mb-3">02 / Research</div>
          <h2 className="font-tight font-bold text-4xl lg:text-5xl text-inkwell">
            Research Projects
          </h2>
          <p className="text-data-grey mt-4 max-w-2xl text-base leading-relaxed">
            Mapping the frontier of intelligent systems — from the mathematics of uncertainty
            to the architecture of reasoning machines.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="research-card relative h-72 rounded-2xl overflow-hidden cursor-pointer group"
            >
              {/* Background image */}
              <img
                src={project.image}
                alt={project.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Dark overlay */}
              <div className="card-overlay absolute inset-0 bg-inkwell/70" />
              {/* Static content */}
              <div className="absolute inset-0 p-7 flex flex-col justify-end">
                <div className={`font-mono text-xs border px-2 py-0.5 rounded w-fit mb-3 ${tagColors[project.tag]}`}>
                  {project.area}
                </div>
                <h3 className="font-tight font-bold text-xl text-white mb-2 leading-tight">
                  {project.title}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed line-clamp-2 group-hover:hidden transition-all">
                  {project.description}
                </p>
                {/* Impact on hover */}
                <p className="card-impact text-white text-sm leading-relaxed font-medium">
                  {project.impact}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
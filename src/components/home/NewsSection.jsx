import { motion } from 'framer-motion';
import { ParseMarkdown } from '../../lib/utils';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Edit this array to update news items
const newsItems = [
  {
    month: 'May',
    year: 2026,
    text: <ParseMarkdown text="I gave an oral presentation at [AISTATS 2026](https://virtual.aistats.org/virtual/2026/calendar) about an effective and scalable optimizer for Probabilistic Circuits. Check out our [paper](https://arxiv.org/pdf/2505.19982)!"/>
  },
  {
    month: 'April',
    year: 2026,
    text: <ParseMarkdown text="Four papers accepted to ICML 2026. Huge congrats to Ian, Zoe, Xuejie, Zihao, and Vit Chun!"/>
  },
  {
    month: 'April',
    year: 2026,
    text: <ParseMarkdown text="I gave a talk about diffusion language models and reasoning at the EEE department of Imperial College London, hosted by [Eleonora Giunchiglia](https://profiles.imperial.ac.uk/e.giunchiglia)."/>
  },
  {
    month: 'August',
    year: 2025,
    text: <ParseMarkdown text="I officially joined NUS SoC as an Assistant Professor ([Presidential Young Professor](https://www.nus.edu.sg/careers/nus-programmes/))."/>,
  },
  {
    month: 'April',
    year: 2025,
    text: <ParseMarkdown text="I successfully defended my PhD thesis [Towards Controllable Generative AI with Intrinsic Reasoning Capabilities](https://escholarship.org/content/qt4xc1x5bb/qt4xc1x5bb_noSplash_6acd65b313cdbcc06103f7b9b1103f4c.pdf)."/>,
  },
  {
    month: 'March',
    year: 2025,
    text: <ParseMarkdown text="Can discrete diffusion models generalize well to any conditional generation tasks? We demonstrate a significant gap and propose a better architecture [Tracformer](https://arxiv.org/pdf/2502.07616) in our paper accepted to ICML 2025."/>,
  },
  {
    month: 'January',
    year: 2025,
    text: <ParseMarkdown text='I gave a talk "Towards Controllable Generative AI with Intrinsic Reasoning Capabilities" at the Helmholtz AI Center in Munich, hosted by [Vincent Fortuin](https://fortuin.github.io/).'/>
  },
  {
    month: 'January',
    year: 2025,
    text: <ParseMarkdown text="Our recent work on improving few-step generation performance of discrete diffusion models is accepted to ICLR 2025 as oral presentation. Check it out at [https://arxiv.org/pdf/2410.01949](https://arxiv.org/pdf/2410.01949)."/>,
  },
  {
    month: 'September',
    year: 2024,
    text: <ParseMarkdown text="Check our [recent work](https://arxiv.org/pdf/2311.00094) accepted to NeurIPS 2024. It demonstrates the importance of performing tractable inference in Offline Reinforcement Learning."/>
  },
  {
    month: 'August',
    year: 2024,
    text: <ParseMarkdown text="I gave an invitated talk about Probabilistic Circuits at Prof. [Steffen Staab](https://scholar.google.com/citations?user=QvpcUn8AAAAJ&hl=en)'s group at University of Stuttgart."/>
  },
  {
    month: 'June',
    year: 2024,
    text: <ParseMarkdown text="I will co-organize the workshop on [Open-World Agents](https://sites.google.com/view/open-world-agents) at NeurIPS 2024."/>
  },
  {
    month: 'May',
    year: 2024,
    text: <ParseMarkdown text="Our [paper](https://arxiv.org/pdf/2406.00766) describing the technical details of [PyJuice](https://github.com/Tractables/pyjuice) is accepted to ICML 2024."/>
  },
];

export default function NewsSection() {
  return (
    <section id="news" className="py-0 bg-paper">
      <div className="max-w-6xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <div className="font-mono text-sm text-data-grey mb-3">03 / News</div>
          <h2 className="font-tight font-bold text-4xl lg:text-5xl text-inkwell">
            News
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl border border-border-light overflow-hidden"
        >
          <div
            className="overflow-y-auto max-h-80 divide-y divide-border-light"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}
          >
            {newsItems.map((item, i) => (
              <div key={i} className="flex gap-6 px-7 py-4 hover:bg-slate-50 transition-colors">
                <div className="font-mono text-xs text-data-grey/60 flex-shrink-0 w-16 pt-0.5">
                  {item.month.slice(0, 3)} {item.year}
                </div>
                <p className="text-sm text-inkwell/80 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
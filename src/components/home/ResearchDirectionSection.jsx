import { motion } from 'framer-motion';
import { ParseMarkdown } from '../../lib/utils';

// Edit these paragraphs to describe your research direction
const paragraphs = [
  <ParseMarkdown text="Our [lab](/group)'s research is driven by a fundamental question: **is making generative AI increasingly expressive sufficient?**
   While scaling models and curating massive datasets has led to tremendous success, 
   current AI systems still exhibit critical flaws: they hallucinate, 
   fail to follow simple instructions, and rely on opaque reasoning logic." target="_self"/>,

  <>
    I believe that developing more expressive models alone cannot solve these problems. 
    Learning a complex distribution only determines how accurate a model's "proxy" of the real world is; 
    the missing piece is how we explore and reason about that proxy. Formally, while modern generative AI excels at learning complex distributions, 
    it struggles to answer rigorous probabilistic queries about them.
    {" "}
    <ParseMarkdown text="To reason reliably, models must be **tractable**, i.e., 
    capable of supporting exact and efficient probabilistic inference."/>
  </>,

  `To bridge this gap, some of the key questions that I'm trying to answer are:`,

  <ul className="list-disc list-outside space-y-2 ml-2 pl-5">
    <li>
      <strong>Can we build models that are simultaneously highly expressive and tractable?</strong> 
      <ParseMarkdown text=" This is both a fundamental theoretical question [[1](https://arxiv.org/pdf/2605.12940),[2](https://arxiv.org/pdf/2102.06137),[3](https://arxiv.org/pdf/2302.08086)] and a practical empirical challenge [[4](https://arxiv.org/pdf/2210.04398),[5](https://arxiv.org/pdf/2406.00766),[6](https://arxiv.org/pdf/2505.19982)]."/>
    </li>
    <li>
      <strong>What specific forms of tractability do we need</strong> to perform reliable decision-making and complex reasoning
      <ParseMarkdown text=" [[7](https://arxiv.org/pdf/2311.00094),[8](https://arxiv.org/pdf/2401.03349),[9](https://arxiv.org/pdf/2111.11632)]?"/>
    </li>
    <li>
      <strong>How can we integrate these techniques into existing LLM-based frameworks</strong> to make them structurally robust and reliable
      <ParseMarkdown text=" [[10](https://arxiv.org/pdf/2603.00045),[11](https://arxiv.org/pdf/2511.16054)]?"/>
    </li>
  </ul>,

  <ParseMarkdown text="More broadly, I am interested in techniques that make deep generative models more efficient [[12](https://arxiv.org/pdf/2410.01949),[13](https://arxiv.org/pdf/2405.15506)], robust [[14](https://arxiv.org/pdf/2502.07616)], and controllable [[15](https://arxiv.org/pdf/2310.08235)]."/>,
];

export default function ResearchDirectionSection() {
  return (
    <section id="research-direction" className="pt-10 pb-16 bg-paper">
      <div className="max-w-6xl mx-auto px-8">
        <div className="font-mono text-xs text-data-grey/70 uppercase tracking-widest mb-6">
          Research Directions
        </div>
        <div className="space-y-5">
          {paragraphs.map((para, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-base text-data-grey leading-relaxed"
            >
              {para}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}
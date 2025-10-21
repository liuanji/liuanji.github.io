---
permalink: /
title: ""
excerpt: ""
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

{% if site.google_scholar_stats_use_cdn %}
{% assign gsDataBaseUrl = "https://cdn.jsdelivr.net/gh/" | append: site.repository | append: "@" %}
{% else %}
{% assign gsDataBaseUrl = "https://raw.githubusercontent.com/" | append: site.repository | append: "/" %}
{% endif %}
{% assign url = gsDataBaseUrl | append: "google-scholar-stats/gs_data_shieldsio.json" %}

<span class='anchor' id='about-me'></span>

I am an **Assistant Professor** (Presidential Young Professor, PYP) in the Department of Computer Science within the [School of Computing](https://www.comp.nus.edu.sg/) (SoC) at the [National University of Singapore](https://www.nus.edu.sg/) (NUS). Before joining NUS, I completed my PhD at the [StarAI lab](https://starai.cs.ucla.edu/members/) at the [University of California, Los Angeles](https://www.ucla.edu/), where I was advised by Prof. [Guy Van den Broeck](https://web.cs.ucla.edu/~guyvdb/). I am currently visiting Prof. [Mathias Niepert](https://www.matlog.net/)'s lab at the University of Stuttgart.

<span class='anchor' id='interests'></span>

# 🎯 Research Interests

My primary research focus is **deep generative models** (diffusion models [[1](https://arxiv.org/pdf/2410.01949),[2](https://arxiv.org/pdf/2401.03349),[3](https://arxiv.org/pdf/2405.15506)], probabilistic circuits [[5](https://arxiv.org/pdf/2406.00766),[6](https://arxiv.org/pdf/2210.04398),[7](https://arxiv.org/pdf/2111.11632)], variational autoencoders [[4](https://arxiv.org/pdf/2310.08235)]). Other than understanding and mitigating the fundamental challenges toward good modeling performance [[1](https://arxiv.org/pdf/2410.01949),[6](https://arxiv.org/pdf/2210.04398),[8](https://arxiv.org/pdf/2302.08086)], I am especially interested in **efficient exact/approximate inference with guarantees** of various deep generative models from both theoretical perspectives [[9](https://arxiv.org/pdf/2102.06137)] and empirical perspectives [[7](https://arxiv.org/pdf/2111.11632),[10](https://arxiv.org/pdf/2401.03349)].

# 🎓 Prospective Students

I am actively looking for motivated and curious individuals to join my research group. Multiple positions are available for **PhD students**, **postdoctoral researchers**, and **research interns** (both on-site and remote) at my lab in NUS. If you are interested in working on topics including generative modeling, reasoning, and tractable inference, I would love to hear from you.

To apply, please send an email to *anjiliu@nus.edu.sg*. Use the subject line to specify the position you are applying for (e.g., [PhD], [Postdoc], or [Intern]), and include the following materials:
- Your CV and transcript;
- (Optional) A short research statement describing your interests;
- (Optional) A brief overview of one reseach problem that has inspired your enthusiasm (you don't need to have an answer).

I welcome applications from individuals with diverse backgrounds and levels of experience.

<span class='anchor' id='directions'></span>

# 📊 Research Directions

Generative AI has become a transformative paradigm that enables machines to produce high-quality content such as images, language, and audio. However, beyond creating charming and coherent
outputs, these systems must reason -- steering their generations to satisfy specific properties. While **sound reasoning techniques** from classical symbolic AI can rigorously guarantee these properties, they are often computationally prohibitive and difficult to scale. As a result, many recent approaches rely on **scalable yet unsound methods**, such as chain-of-thought prompting, which prioritize efficiency over rigorous correctness.

My research aims to **design generative AI models as drop-in replacements of existing models like autoregressive Transformers and diffusion models, with the distinguishing capability of sound reasoning**. This enables high-fidelity yet controllable generations that align with user requests or domain constraints. Towards this goal, I pursue research in the following directions:

- **Advancing and designing tractable deep generative models.** Are there generative models that are expressive enough and at the same time support sound reasoning? Perhaps surprisingly, the answer is yes! I am among the first to enhance the expressiveness of [Probabilistic Circuits](https://starai.cs.ucla.edu/papers/ProbCirc20.pdf), a class of models known for their ability to compute probabilistic queries exactly and efficiently. My work has pushed these models from underfitting simple tabular data to achieving competitive performance with autoregressive and diffusion models on image and text modeling tasks (e.g., [[8](https://arxiv.org/pdf/2302.08086),[11](https://arxiv.org/pdf/2406.13892)]). Building on this progress, I aim to further explore the frontier of tractable and expressive generative models, making them more capable and broadly applicable in reasoning-intensive domains.

- **Demonstrating the benefit of tractable reasoning.** While expressiveness is often viewed as the most important aspect of generative models, I argue that their ability to reason tractably is equally critical. Specifically, in many reasoning-demanding tasks such as lossless data compression [[7](https://arxiv.org/pdf/2111.11632)], controlled image generation [[12](https://arxiv.org/pdf/2401.03349)], and population genetic studies [[13](https://www.biorxiv.org/content/10.1101/2023.05.16.541036v1.full.pdf)], the capacity to compute the desired inference query is essential. When a model lacks this capability, the resulting approximation error can outweigh any gains achieved through increased expressiveness. Looking ahead, I aim to make generative models more suitable for reasoning-demanding applications, by either **improving their inherent reasoning capability**, or **designing better exact/approximate inference algorithms**.

Beyond these directions, I am also interested in several related questions at the intersection of modeling and reasoning. One example is the interplay between learning to reason and having intrinsic reasoning capabilities.

<span class='anchor' id='news'></span>

# 🔥 News
- *2025.03*: &nbsp;🎉🎉 Can discrete diffusion models generalize well to any conditional generation tasks? We demonstrate a significant gap and propose a better architecture [Tracformer](https://arxiv.org/pdf/2502.07616) in our paper accepted to ICML 2025.
- *2025.01*: &nbsp;🎉🎉 Our recent work on improving few-step generation performance of discrete diffusion models is accepted to ICLR 2025. Check it out at [https://arxiv.org/pdf/2410.01949](https://arxiv.org/pdf/2410.01949).
- *2024.09*: &nbsp;🎉🎉 Check our [recent work](https://arxiv.org/pdf/2311.00094) accepted to NeurIPS 2024. It demonstrates the importance of performing tractable inference in Offline Reinforcement Learning.
- *2024.08*: &nbsp;🎉🎉 I gave an invitated talk about Probabilistic Circuits at Prof. [Steffen Staab](https://scholar.google.com/citations?user=QvpcUn8AAAAJ&hl=en)'s group at University of Stuttgart
- *2024.06*: &nbsp;🎉🎉 I will co-organize the workshop on [Open-World Agents](https://sites.google.com/view/open-world-agents) at NeurIPS 2024
- *2024.05*: &nbsp;🎉🎉 Our [paper](https://arxiv.org/pdf/2406.00766) describing the technical details of [PyJuice](https://github.com/Tractables/pyjuice) is accepted to ICML 2024.

<!-- # 🎖 Honors and Awards
- *2021.10* Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
- *2021.09* Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. -->

# 📖 Education
- *2020.09 - 2025.06*, Computer Science PhD student at UCLA, United States
- *2015.09 - 2019.06*, Bachelor's degree in Automation, Beihang University, China

<span class='anchor' id='invited-talks'></span>

# 💬 Invited Talks
- *2025.01*, Towards Controllable Generative AI with Intrinsic Reasoning Capabilities, [ELPIS lab](https://fortuinlab.github.io/), TU Munich, Germany
- *2024.08*, Scaling Up Tractable Probabilistic Circuits for Inference-Demanding Application, University of Stuttgart, Germany
- *2023.07*, Tractable Probabilistic Circuits, Dagstuhl, Germany
- *2023.05*, Scaling Up Probabilistic Circuits by Latent Variable Distillation, ICLR oral presentation
- *2022.02*, Tractable Probabilistic Circuits, Peking University, China

# <img src="./images/pyjuice.png" alt="PyJuice" width="25"> PyJuice

I am the main developer of [PyJuice](https://github.com/Tractables/pyjuice), which enables fast and scalable training and inference of Probabilistic Circuits. PyJuice has been used to train state-of-the-art PCs [[8](https://arxiv.org/pdf/2302.08086)] and and has supported many related projects. Feel free to give it a try!

<span class='anchor' id='teaching'></span>

# 📖 Teaching
- Lecturer (with Mathias Niepert), Reinforcement Learning, University of Stuttgart, Spring 2025
- Lecturer (with Mathias Niepert), Introduction to AI, University of Stuttgart, Winter 2024
- Teaching assistant, Reinforcement Learning, University of Stuttgart, Spring 2024

<span class='anchor' id='services'></span>

# 💗 Services
- PC member of ICML, NeurIPS, ICLR, AISTATS, AAAI
- Co-organizer of the Workshop on [Open-World Agents](https://sites.google.com/view/open-world-agents) at NeurIPS 2024

<span class='anchor' id='publications'></span>

# 📝 Publications 

Below is a list of selected publications. Please refer to my [Google Scholar](https://scholar.google.com/citations?hl=en&user=k_4zYecAAAAJ) page for the full list of publications.

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICLR 2025</div><img src='thumbnails/DCD.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Discrete Copula Diffusion**

**Anji Liu**, Oliver Broadrick, Mathias Niepert, Guy Van den Broeck

[**ICLR 2025**](https://iclr.cc/Conferences/2025) / [Paper](https://arxiv.org/pdf/2410.01949) / [Code](https://github.com/liuanji/Copula-Diffusion)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICLR 2025</div><img src='thumbnails/LD3.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Learning to Discretize Denoising Diffusion ODEs**

Vinh Tong, Trung-Dung Hoang, **Anji Liu**, Guy Van den Broeck, Mathias Niepert

[**ICLR 2025**](https://iclr.cc/Conferences/2025) <span style="color: red; font-weight: bold">(Oral; top 1.8%)</span> / [Paper](https://arxiv.org/pdf/2405.15506) / [Code](https://github.com/vinhsuhi/LD3)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICLR 2025</div><img src='thumbnails/GROOT2.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**GROOT-2: Weakly Supervised Multi-Modal Instruction Following Agents**

Shaofei Cai, Bowei Zhang, Zihao Wang, Haowei Lin, Xiaojian Ma, **Anji Liu**, Yitao Liang

[**ICLR 2025**](https://iclr.cc/Conferences/2025) / [Paper](https://arxiv.org/pdf/2412.10410)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2024</div><img src='thumbnails/Trifle.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**A Tractable Inference Perspective of Offline RL**

Xuejie Liu<sup>*</sup>, **Anji Liu<sup>*</sup>**, Guy Van den Broeck, Yitao Liang

[**NeurIPS 2024**](https://neurips.cc/Conferences/2024) / [Paper](https://arxiv.org/pdf/2311.00094) / [Code](https://github.com/liebenxj/Trifle)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2024</div><img src='thumbnails/OmniJarvis.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**OmniJARVIS: Unified Vision-Language-Action Tokenization Enables Open-World Instruction Following Agents**

Zihao Wang, Shaofei Cai, Zhancun Mu, Haowei Lin, Ceyao Zhang, Xuejie Liu, Qing Li, **Anji Liu**, Xiaojian Ma, Yitao Liang

[**NeurIPS 2024**](https://neurips.cc/Conferences/2024) / [Paper](https://arxiv.org/pdf/2407.00114) / [Website](https://omnijarvis.github.io/) / [Code](https://github.com/CraftJarvis/OmniJarvis)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICML 2024</div><img src='thumbnails/PyJuice.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Scaling Tractable Probabilistic Circuits: A Systems Perspective**

**Anji Liu**, Kareem Ahmed, Guy Van den Broeck

[**ICML 2024**](https://icml.cc/Conferences/2024) / [Paper](https://arxiv.org/pdf/2406.00766) / [Code](https://github.com/Tractables/pyjuice)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICLR 2024</div><img src='thumbnails/Tiramisu.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Image Inpainting via Tractable Steering of Diffusion Models**

**Anji Liu**, Mathias Niepert, Guy Van den Broeck

[**ICLR 2024**](https://iclr.cc/Conferences/2024) / [Paper](https://arxiv.org/pdf/2401.03349) / [Code](https://github.com/UCLA-StarAI/Tiramisu)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICLR 2024</div><img src='thumbnails/Groot.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Groot: Learning to follow instructions by watching gameplay videos**

Shaofei Cai, Bowei Zhang, Zihao Wang, Xiaojian Ma, **Anji Liu**, Yitao Liang

[**ICLR 2024**](https://iclr.cc/Conferences/2024) <span style="color: red; font-weight: bold">(Spotlight; top 6.2%)</span> / [Paper](https://arxiv.org/pdf/2310.08235) / [Website](https://craftjarvis.github.io/GROOT/) / [Code](https://github.com/CraftJarvis/GROOT)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2023</div><img src='thumbnails/DEPS.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Describe, Explain, Plan and Select: Interactive Planning with Large Language Models Enables Open-World Multi-Task Agents**

Zihao Wang, Shaofei Cai, Guanzhou Chen, **Anji Liu**, Xiaojian Ma, Yitao Liang

[**NeurIPS 2023**](https://neurips.cc/Conferences/2023/) <span style="color: red; font-weight: bold;">(Best paper award at the TEACH workshop at ICML 2023)</span> / [Paper](https://arxiv.org/pdf/2302.01560) / [Code](https://github.com/CraftJarvis/MC-Planner)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICML 2023</div><img src='thumbnails/LVD-PG.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Understanding the distillation process from deep generative models to tractable probabilistic circuits**

Xuejie Liu<sup>*</sup>, **Anji Liu<sup>*</sup>**, Guy Van den Broeck, Yitao Liang

[**ICML 2023**](https://icml.cc/Conferences/2023/) / [Paper](https://arxiv.org/pdf/2302.08086) / [Code](https://github.com/liebenxj/LVD-PG)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">AAAI 2023</div><img src='thumbnails/NtoC.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Out-of-distribution generalization by neural-symbolic joint training**

**Anji Liu**, Hongming Xu, Guy Van den Broeck, Yitao Liang

[**AAAI 2023**](https://aaai-23.aaai.org/) / [Paper](https://ojs.aaai.org/index.php/AAAI/article/view/26444) / [Code](https://github.com/sbx126/NToC)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICLR 2023</div><img src='thumbnails/LVD.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Scaling up probabilistic circuits by latent variable distillation**

**Anji Liu<sup>*</sup>**, Honghua Zhang<sup>*</sup>, Guy Van den Broeck

[**ICLR 2023**](https://iclr.cc/Conferences/2023/) <span style="color: red; font-weight: bold">(Oral; top 1.8%)</span> / [Paper](https://arxiv.org/pdf/2210.04398) / [Code](https://github.com/liebenxj/LVD-PG)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2022</div><img src='thumbnails/SpHCLT.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Sparse probabilistic circuits via pruning and growing**

Meihua Dang, **Anji Liu**, Guy Van den Broeck

[**NeurIPS 2022**](https://neurips.cc/Conferences/2022/) <span style="color: red; font-weight: bold">(Oral; top 1.9%)</span> / [Paper](https://arxiv.org/pdf/2211.12551) / [Code](https://github.com/UCLA-StarAI/SparsePC)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">RECOMB 2022</div><img src='thumbnails/BioPC.jpg' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Tractable and Expressive Generative Models of Genetic Variation Data**

Meihua Dang, **Anji Liu**, Xinzhu Wei, Sriram Sankararaman, Guy Van den Broeck

[**RECOMB 2022**](https://recomb.org/recomb2022/index.html) / [Paper](https://pubmed.ncbi.nlm.nih.gov/37292742/) / [Code](https://github.com/UCLA-StarAI/genetic-pc)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICLR 2022</div><img src='thumbnails/PCCompression.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Lossless compression with probabilistic circuits**

**Anji Liu**, Stephan Mandt, Guy Van den Broeck

[**ICLR 2022**](https://iclr.cc/Conferences/2022/) <span style="color: red; font-weight: bold">(Spotlight; top 5.2%)</span> / [Paper](https://arxiv.org/pdf/2111.11632) / [Code](https://github.com/Tractables/PressedJuice.jl)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2021</div><img src='thumbnails/CircuitOpsAtlas.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**A Compositional Atlas of Tractable Circuit Operations for Probabilistic Inference**

Antonio Vergari, YooJung Choi, **Anji Liu**, Stefano Teso, Guy Van den Broeck

[**NeurIPS 2021**](https://neurips.cc/Conferences/2021/) <span style="color: red; font-weight: bold">(Oral; top 0.6%)</span> / [Paper](https://arxiv.org/pdf/2102.06137) / [Code](https://github.com/UCLA-StarAI/circuit-ops-atlas)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2021</div><img src='thumbnails/TracReg.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Tractable regularization of probabilistic circuits**

**Anji Liu**, Guy Van den Broeck

[**NeurIPS 2021**](https://neurips.cc/Conferences/2021/) <span style="color: red; font-weight: bold">(Spotlight; top 3.7%)</span> / [Paper](https://arxiv.org/pdf/2106.02264) / [Code](https://github.com/UCLA-StarAI/Tractable-PC-Regularization)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICLR 2020</div><img src='thumbnails/ADAC.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Off-Policy Deep Reinforcement Learning with Analogous Disentangled Exploration**

**Anji Liu**, Yitao Liang, Guy Van den Broeck

[**AAMAS 2020**](https://aamas2020.conference.auckland.ac.nz/) / [Paper](https://arxiv.org/pdf/2002.10738) / [Code](https://github.com/UCLA-StarAI/Analogous-Disentangled-Actor-Critic)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICLR 2020</div><img src='thumbnails/WU-UCT.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Watch the Unobserved: A Simple Approach to Parallelizing Monte Carlo Tree Search**

**Anji Liu**, Jianshu Chen, Mingze Yu, Yu Zhai, Xuewen Zhou, Ji Liu

[**ICLR 2020**](https://iclr.cc/Conferences/2022/) <span style="color: red; font-weight: bold">(Oral; top 1.9%)</span> / [Paper](https://arxiv.org/pdf/1810.11755) / [Code](https://github.com/liuanji/WU-UCT)

</div>
</div>

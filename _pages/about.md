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

I am a final-year Ph.D. student at the [StarAI lab](https://starai.cs.ucla.edu/members/) at [UCLA](https://www.ucla.edu/), advised by Prof. [Guy Van den Broeck](https://web.cs.ucla.edu/~guyvdb/). I am currently visiting Prof. [Mathias Niepert](https://www.matlog.net/)'s lab at the University of Stuttgart.

<span class='anchor' id='highlights'></span>

# 🎯 Research highlights

My primary research focus is **deep generative models** (diffusion models [[1](https://arxiv.org/pdf/2410.01949),[2](https://arxiv.org/pdf/2401.03349),[3](https://arxiv.org/pdf/2405.15506)], probabilistic circuits [[5](https://arxiv.org/pdf/2406.00766),[6](https://arxiv.org/pdf/2210.04398),[7](https://arxiv.org/pdf/2111.11632)], variational autoencoders [[4](https://arxiv.org/pdf/2310.08235)]). Other than understanding and mitigating the fundamental challenges toward good modeling performance [[1](https://arxiv.org/pdf/2410.01949),[6](https://arxiv.org/pdf/2210.04398),[8](https://arxiv.org/pdf/2302.08086)], I am especially interested in **efficient exact/approximate inference with guarantees** of various deep generative models from both theoretical perspectives [[9](https://arxiv.org/pdf/2102.06137)] and empirical perspectives [[7](https://arxiv.org/pdf/2111.11632),[10](https://arxiv.org/pdf/2401.03349)].

<span class='anchor' id='directions'></span>

# 📊 Research directions

- What requirements must we impose on the structure of deep generative models to **accurately and efficiently answer various probabilistic queries**, such as computing arbitrary marginal probabilities or determining the MAP state? A useful theoretical framework for studying these problems is [**Probabilistic Circuits**](https://starai.cs.ucla.edu/papers/ProbCirc20.pdf) (PCs), which allows us to establish necessary and sufficient conditions on their structures to answer specific probabilistic queries [[9](https://arxiv.org/pdf/2102.06137)]. **I am among the first to significantly enhance the empirical performance of PCs**, improving their effectiveness from struggling on MNIST to being compatible with variational autoencoders and even diffusion models on ImageNet32 [[8](https://arxiv.org/pdf/2302.08086)]. To facilitate large-scale training and inference on PCs, I **developed the Python package [PyJuice](https://github.com/Tractables/pyjuice)**, which is orders of magnitudes faster than all previous implementations.

- Does PCs matter in the era of large language models? Many of my research works demonstrate that, with the ability to efficiently perform exact probabilistic inference, **PCs can achieve better empirical performance on various down-stream tasks**, either when used along [[7](https://arxiv.org/pdf/2111.11632)] or when combined with other deep generative models [[2](https://arxiv.org/pdf/2401.03349),[11](https://arxiv.org/pdf/2311.00094)].

- How does the idea of **tractable** modeling generalizes to other types of deep generative models? In our recent work, we generalize the idea of combining the [PC copula](https://arxiv.org/pdf/2408.04229) with a set of target univariate marginals to solve a fundamental problem that prevents discrete diffusion models from achieving strong performance with fewer steps -- they fail to capture dependencies between output variables at each denoising step [[1](https://arxiv.org/pdf/2410.01949)].

# 🔥 News
- *2024.10*: &nbsp;🎉🎉 Our recent work on improving few-step generation performance of discrete diffusion models is now on ArXiv. Check it out at [https://arxiv.org/pdf/2410.01949](https://arxiv.org/pdf/2410.01949).
- *2024.09*: &nbsp;🎉🎉 Check our [recent work](https://arxiv.org/pdf/2311.00094) accepted to NeurIPS 2024. It demonstrates the importance of performing tractable inference in Offline Reinforcement Learning.
- *2024.08*: &nbsp; I gave an invitated talk about Probabilistic Circuits at Prof. [Steffen Staab](https://scholar.google.com/citations?user=QvpcUn8AAAAJ&hl=en)'s group at University of Stuttgart
- *2024.05*: &nbsp;🎉🎉 Our [paper](https://arxiv.org/pdf/2406.00766) describing the technical details of [PyJuice](https://github.com/Tractables/pyjuice) is accepted to ICML 2024.

<!-- # 🎖 Honors and Awards
- *2021.10* Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
- *2021.09* Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. -->

# 📖 Educations
- *2020.09 - present*, Computer Science Ph.D. student at UCLA, United States
- *2015.09 - 2019.06*, Bachelor's degree in Automation, Beihang University, China

# 💬 Invited Talks
- *2024.08*, Scaling Up Tractable Probabilistic Circuits for Inference-Demanding Application, University of Stuttgart, Germany
- *2023.07*, Tractable Probabilistic Circuits, Dagstuhl, Germany
- *2023.05*, Scaling Up Probabilistic Circuits by Latent Variable Distillation, ICLR oral presentation
- *2022.02*, Tractable Probabilistic Circuits, Peking University, China

<!-- # 💻 Internships
- *2019.05 - 2020.02*, [Lorem](https://github.com/), China. -->

# 📖 Teaching
- Teaching assistant, Reinforcement Learning, University of Stuttgart, Spring 2024
- Lecturer, Introduction to AI, University of Stuttgart, Winter 2024

# 💗 Services
- PC member of ICML, NeurIPS, ICLR, AISTATS, AAAI
- Co-organizer of the Workshop on [Open-World Agents](https://sites.google.com/view/open-world-agents) at NeurIPS 2024

# 📝 Publications 

Below is a list of selected publications. Please refer to my [Google Scholar](https://scholar.google.com/citations?hl=en&user=k_4zYecAAAAJ) page for the full list of publications.

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ArXiv</div><img src='thumbnails/DCD.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Discrete Copula Diffusion**

**Anji Liu**, Oliver Broadrick, Mathias Niepert, Guy Van den Broeck

**ArXiv** / [Paper](https://arxiv.org/pdf/2410.01949)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2024</div><img src='thumbnails/Trifle.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**A Tractable Inference Perspective of Offline RL**

Xuejie Liu<sup>*</sup>, **Anji Liu<sup>*</sup>**, Guy Van den Broeck, Yitao Liang

[**NeurIPS 2024**](https://neurips.cc/Conferences/2024) / [Paper](https://arxiv.org/pdf/2311.00094)

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

[**ICLR 2024**](https://iclr.cc/Conferences/2024) <span style="color: red; font-weight: bold">(Spotlight)</span> / [Paper](https://arxiv.org/pdf/2310.08235) / [Website](https://craftjarvis.github.io/GROOT/) / [Code](https://github.com/CraftJarvis/GROOT)

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

[**ICLR 2023**](https://iclr.cc/Conferences/2023/) <span style="color: red; font-weight: bold">(Oral)</span> / [Paper](https://arxiv.org/pdf/2210.04398) / [Code](https://github.com/liebenxj/LVD-PG)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2022</div><img src='thumbnails/SpHCLT.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Sparse probabilistic circuits via pruning and growing**

Meihua Dang, **Anji Liu**, Guy Van den Broeck

[**NeurIPS 2022**](https://neurips.cc/Conferences/2022/) <span style="color: red; font-weight: bold">(Oral)</span> / [Paper](https://arxiv.org/pdf/2211.12551) / [Code](https://github.com/UCLA-StarAI/SparsePC)

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

[**ICLR 2022**](https://iclr.cc/Conferences/2022/) <span style="color: red; font-weight: bold">(Spotlight)</span> / [Paper](https://arxiv.org/pdf/2111.11632) / [Code](https://github.com/Tractables/PressedJuice.jl)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2021</div><img src='thumbnails/CircuitOpsAtlas.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**A Compositional Atlas of Tractable Circuit Operations for Probabilistic Inference**

Antonio Vergari, YooJung Choi, **Anji Liu**, Stefano Teso, Guy Van den Broeck

[**NeurIPS 2021**](https://neurips.cc/Conferences/2021/) <span style="color: red; font-weight: bold">(Oral)</span> / [Paper](https://arxiv.org/pdf/2102.06137) / [Code](https://github.com/UCLA-StarAI/circuit-ops-atlas)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2021</div><img src='thumbnails/TracReg.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Tractable regularization of probabilistic circuits**

**Anji Liu**, Guy Van den Broeck

[**NeurIPS 2021**](https://neurips.cc/Conferences/2021/) <span style="color: red; font-weight: bold">(Spotlight)</span> / [Paper](https://arxiv.org/pdf/2106.02264) / [Code](https://github.com/UCLA-StarAI/Tractable-PC-Regularization)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICLR 2020</div><img src='thumbnails/WU-UCT.png' alt="sym" width="500px"></div></div>
<div class='paper-box-text' markdown="1">

**Watch the Unobserved: A Simple Approach to Parallelizing Monte Carlo Tree Search**

**Anji Liu**, Jianshu Chen, Mingze Yu, Yu Zhai, Xuewen Zhou, Ji Liu

[**ICLR 2020**](https://iclr.cc/Conferences/2022/) <span style="color: red; font-weight: bold">(Oral)</span> / [Paper](https://arxiv.org/pdf/1810.11755) / [Code](https://github.com/liuanji/WU-UCT)

</div>
</div>
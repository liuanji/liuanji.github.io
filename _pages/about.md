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

I am a final-year Ph.D. student at the [StarAI lab](https://starai.cs.ucla.edu/members/) at UCLA, advised by Prof. [Guy Van den Broeck](https://web.cs.ucla.edu/~guyvdb/). I am currently visiting Prof. [Mathias Niepert](https://www.matlog.net/)'s lab at the University of Stuttgart.



My research areas are Large Language Models (LLMs), Natural Language Processing (NLP), and Causal Inference. Recently, I focus on Causal Reasoning with LLMs, which can be applied to Responsible AI, and AI for Science. I also have a rising interest in multi-agent LLMs (see our GovSim), and tool-augmented LLMs (see CLadder).

My research interest includes neural machine translation and computer vision. I have published more than 100 papers at the top international AI conferences with total <a href='https://scholar.google.com/citations?user=DhtAFkwAAAAJ'>google scholar citations <strong><span id='total_cit'>260000+</span></strong></a> (You can also use google scholar badge <a href='https://scholar.google.com/citations?user=DhtAFkwAAAAJ'><img src="https://img.shields.io/endpoint?url={{ url | url_encode }}&logo=Google%20Scholar&labelColor=f6f6f6&color=9cf&style=flat&label=citations"></a>).


# 🔥 News
- *2024.10*: &nbsp;🎉🎉 Our recent work on improving few-step generation performance of discrete diffusion models is now on ArXiv. Check it out at [https://arxiv.org/pdf/2410.01949](https://arxiv.org/pdf/2410.01949).
- *2024.09*: &nbsp;🎉🎉 Two papers accepted to NeurIPS 2024.

# 📝 Publications 

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ArXiv</div><img src='images/500x300.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**Discrete Copula Diffusion**

**Anji Liu**, Oliver Broadrick, Mathias Niepert, Guy Van den Broeck

**ArXiv** / [Paper](https://arxiv.org/pdf/2410.01949)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2024</div><img src='images/500x300.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**A Tractable Inference Perspective of Offline RL**

Xuejie Liu<sup>*</sup>, **Anji Liu<sup>*</sup>**, Guy Van den Broeck, Yitao Liang

[**NeurIPS 2024**](https://neurips.cc/Conferences/2024) / [Paper](https://arxiv.org/pdf/2311.00094)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">NeurIPS 2024</div><img src='images/500x300.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**OmniJARVIS: Unified Vision-Language-Action Tokenization Enables Open-World Instruction Following Agents**

Zihao Wang, Shaofei Cai, Zhancun Mu, Haowei Lin, Ceyao Zhang, Xuejie Liu, Qing Li, **Anji Liu**, Xiaojian Ma, Yitao Liang

[**NeurIPS 2024**](https://neurips.cc/Conferences/2024) / [Paper](https://arxiv.org/pdf/2407.00114) / [Website](https://omnijarvis.github.io/) / [Code](https://github.com/CraftJarvis/OmniJarvis)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICML 2024</div><img src='images/500x300.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**Scaling Tractable Probabilistic Circuits: A Systems Perspective**

**Anji Liu**, Kareem Ahmed, Guy Van den Broeck

[**ICML 2024**](https://icml.cc/Conferences/2024) / [Paper](https://arxiv.org/pdf/2406.00766) / [Code](https://github.com/Tractables/pyjuice)

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ICLR 2024</div><img src='images/500x300.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

**Image Inpainting via Tractable Steering of Diffusion Models**

**Anji Liu**, Mathias Niepert, Guy Van den Broeck

[**ICLR 2024**](https://iclr.cc/Conferences/2024) / [Paper](https://arxiv.org/pdf/2401.03349) / [Code](https://github.com/UCLA-StarAI/Tiramisu)

</div>
</div>

<!-- # 🎖 Honors and Awards
- *2021.10* Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
- *2021.09* Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. -->

# 📖 Educations
- *2019.06 - 2022.04 (now)*, Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
- *2015.09 - 2019.06*, Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 

# 💬 Invited Talks
- *2024.08*, Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
- *2021.03*, 

<!-- # 💻 Internships
- *2019.05 - 2020.02*, [Lorem](https://github.com/), China. -->

# 📖 Teaching
- Teaching assistant, Reinforcement Learning, University of Stuttgart, Spring 2024
- Lecturer, Introduction to AI, University of Stuttgart, Winter 2024

# 💗 Services
- PC member of ICML, NeurIPS, ICLR, AISTATS, AAAI
- Co-organizer of the Workshop on Open-World Agents at NeurIPS 2024
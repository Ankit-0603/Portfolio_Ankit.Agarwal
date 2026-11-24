export const contact = {
  email: "ankitagr2006@gmail.com",
  phone: "+91 90643 29395",
  tel: "+919064329395",
  location: "Kolkata, West Bengal, India",
  github: "https://github.com/Ankit-0603",
  linkedin: "https://www.linkedin.com/in/ankit-agrawal-6a86aa2b8/",
  resume: `${import.meta.env.BASE_URL}Ankit-Agarwal-Resume.pdf`,
};

export const projects = [
  {
    name: "Vibe Code Editor",
    category: "Browser-based AI code editor",
    description: "Run Node.js, install npm packages, and preview an app in the browser. I built a multi-tab editor with inline AI completions, a chat assistant, a file explorer, and a terminal. Changes are saved to MongoDB.",
    metric: "3",
    detail: "Starter templates for React, Next.js, and Express",
    stack: "Next.js, TypeScript, WebContainer API, Monaco Editor, xterm.js, Prisma, MongoDB, NextAuth, Ollama",
    links: [
      { label: "Open editor", url: "https://code-editor-alpha-umber.vercel.app/" },
      { label: "GitHub", url: "https://github.com/Ankit-0603/Code-Editor" },
      { label: "Watch demo", url: "https://lnkd.in/p/d9UQRiaK" },
    ],
  },
  {
    name: "AI-Powered Calendar Scheduler",
    category: "Natural-language scheduling",
    description: "Send a WhatsApp message to create a Google Calendar event. I built the MCP server and connected Puch AI to a pipeline that extracts the date, time, and event details.",
    metric: ">90%",
    detail: "Parsing accuracy for natural-language scheduling requests",
    stack: "Python, JavaScript, HTML, CSS, NLP, Model Context Protocol, Google Calendar API, Puch AI",
    links: [
      { label: "GitHub", url: "https://github.com/Ankit-0603/AI-Powered-Calendar-Scheduler" },
      { label: "Watch demo", url: "https://lnkd.in/p/dvkHUiB4" },
    ],
  },
  {
    name: "QSALB",
    category: "IoT–Edge–Fog–Cloud research",
    description: "Our team of four designed a Lyapunov-based load balancer for four computing layers. We simulated 1,000 IoT tasks across 32 nodes and benchmarked six algorithms, including a Q-learning agent.",
    metric: "113 ms",
    detail: "Average latency at 8× load, with 13% of tasks missing their deadline and 58% less queue backlog than the best baseline. Tested across eight seeds with 95% confidence intervals.",
    stack: "Python, NumPy, Pandas, Matplotlib, Lyapunov optimization, queueing theory, discrete-time simulation",
    links: [
      { label: "GitHub", url: "https://github.com/Ankit-0603/QSALB-Lyapunov-Driven-Load-Balancer-for-IoT-Edge-Fog-Cloud-Systems" },
    ],
  },
];

export const skillGroups = [
  { label: "Languages", skills: "Python, Java, HTML5, CSS3, JavaScript, TypeScript, SQL" },
  { label: "Frameworks & libraries", skills: "React.js, Next.js, Node.js, Express.js, Tailwind CSS, Vite, NextAuth, NumPy, Pandas" },
  { label: "AI & machine learning", skills: "Generative AI, LLMs, LangChain, OpenAI API, Gemini API, Ollama, prompt engineering, NLP" },
  { label: "Databases & ORM", skills: "PostgreSQL, MongoDB, Prisma ORM" },
  { label: "Tools & platforms", skills: "Git, GitHub, VS Code, Postman, Vercel, WebContainer API, REST APIs, CI/CD" },
  { label: "Computer science", skills: "Data structures & algorithms, object-oriented programming, database management systems, operating systems, computer networks" },
];

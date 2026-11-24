import "./styles/WhatIDo.css";
import Workstation from "./Character/Workstation";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const WhatIDo = () => {
  const touch = ScrollTrigger.isTouch;
  const cardClass = touch ? "what-content" : "what-content what-noTouch";
  return (
    <div className="whatIDO">
      <div className="what-box">
        <h2 className="title">
          W<span className="hat-h2">HAT</span>
          <div>
            I<span className="do-h2"> DO</span>
          </div>
        </h2>
      </div>
      <Workstation />
      <div className="what-box">
        <div className="what-box-in">
          <div
            className={cardClass}
            onClick={
              touch ? (event) => handleClick(event.currentTarget) : undefined
            }
          >
            <div className="what-border1">
              <svg height="100%">
                <line
                  x1="0"
                  y1="0"
                  x2="100%"
                  y2="0"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
                <line
                  x1="0"
                  y1="100%"
                  x2="100%"
                  y2="100%"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
              </svg>
            </div>

            <div className="what-corner"></div>
            <div className="what-content-in">
              <h3>Full-stack development</h3>
              <p>
                I build web applications with React and Next.js, from the
                interface to the API and database.
              </p>
              <h5>Tools I use</h5>
              <div className="what-content-flex">
                <div className="what-tags">TypeScript</div>
                <div className="what-tags">React.js</div>
                <div className="what-tags">Next.js</div>
                <div className="what-tags">Node.js</div>
                <div className="what-tags">Prisma</div>
                <div className="what-tags">MongoDB</div>
              </div>
              <div className="what-arrow"></div>
            </div>
          </div>
          <div
            className={cardClass}
            onClick={
              touch ? (event) => handleClick(event.currentTarget) : undefined
            }
          >
            <div className="what-border1">
              <svg height="100%">
                <line
                  x1="0"
                  y1="100%"
                  x2="100%"
                  y2="100%"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
              </svg>
            </div>
            <div className="what-corner"></div>
            <div className="what-content-in">
              <h3>AI Engineer</h3>
              <p>
                I connect language models to Python services for chat,
                summarization, scheduling, and code assistance.
              </p>
              <h5>Tools I use</h5>
              <div className="what-content-flex">
                <div className="what-tags">Python</div>
                <div className="what-tags">LangChain</div>
                <div className="what-tags">Gemini API</div>
                <div className="what-tags">OpenAI API</div>
                <div className="what-tags">Ollama</div>
                <div className="what-tags">NLP</div>
              </div>
              <div className="what-arrow"></div>
            </div>
          </div>
          <div
            className={`${cardClass} what-business`}
            onClick={
              touch ? (event) => handleClick(event.currentTarget) : undefined
            }
          >
            <div className="what-border1">
              <svg height="100%">
                <line
                  x1="0"
                  y1="100%"
                  x2="100%"
                  y2="100%"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="6,6"
                />
              </svg>
            </div>
            <div className="what-corner"></div>
            <div className="what-content-in">
              <h3>Business Strategist</h3>
              <p>
                I collaborated closely with a business owner to improve
                operations, customer experience, and sales strategy. After
                joining a retail store generating ~₹1.25 Cr in 2025, my ideas
                and hands-on execution helped grow its 2026 revenue to ~₹1.7 Cr.
              </p>
              <a
                className="business-portfolio-link"
                href={`${import.meta.env.BASE_URL}business-portfolio.html`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                View business portfolio <span aria-hidden="true">↗</span>
              </a>
              {/* <h5>Tools I use</h5>
              <div className="what-content-flex">
                <div className="what-tags">Python</div>
                <div className="what-tags">LangChain</div>
                <div className="what-tags">Gemini API</div>
                <div className="what-tags">OpenAI API</div>
                <div className="what-tags">Ollama</div>
                <div className="what-tags">NLP</div>
              </div> */}
              <div className="what-arrow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIDo;

function handleClick(container: HTMLDivElement) {
  container.classList.toggle("what-content-active");
  container.classList.remove("what-sibling");
  if (container.parentElement) {
    const siblings = Array.from(container.parentElement.children);

    siblings.forEach((sibling) => {
      if (sibling !== container) {
        sibling.classList.remove("what-content-active");
        sibling.classList.toggle("what-sibling");
      }
    });
  }
}

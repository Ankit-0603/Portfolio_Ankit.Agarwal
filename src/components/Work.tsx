import "./styles/Work.css";
import { projects } from "../data/portfolio";
import gsap from "gsap";
import { useLayoutEffect, useRef } from "react";

const Work = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track) return;

    let travel = 0;
    let lastOffset = -1;
    const update = () => {
      // ScrollSmoother moves the page with a transform, so use its on-screen position.
      const offset = Math.min(travel, Math.max(0, -section.getBoundingClientRect().top));
      if (offset === lastOffset) return;
      viewport.style.transform = `translateY(${offset}px)`;
      track.style.transform = `translateX(${-offset}px)`;
      lastOffset = offset;
    };

    const measure = () => {
      travel = Math.max(0, track.offsetLeft + track.offsetWidth - viewport.clientWidth);
      section.style.paddingBottom = `${travel}px`;
      update();
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(viewport);
    resize.observe(track);

    const visibility = new IntersectionObserver(([entry]) => {
      gsap.ticker.remove(update);
      update();
      if (entry.isIntersecting) gsap.ticker.add(update);
    });
    visibility.observe(section);

    return () => {
      resize.disconnect();
      visibility.disconnect();
      gsap.ticker.remove(update);
      section.style.removeProperty("padding-bottom");
      viewport.style.removeProperty("transform");
      track.style.removeProperty("transform");
    };
  }, []);

  return (
    <div className="work-section" id="work" ref={sectionRef}>
      <div className="work-viewport" ref={viewportRef}>
        <div className="work-container section-container">
          <h2>
            My <span>Work</span>
          </h2>
          <div className="work-flex" ref={trackRef}>
            {projects.map((project) => (
              <article className="work-box" key={project.name}>
                <div className="work-info">
                  <p className="project-category">{project.category}</p>
                  <h3 className="project-name">{project.name}</h3>
                  <p>{project.description}</p>
                </div>
                <div className="project-result">
                  <strong>{project.metric}</strong>
                  <p>{project.detail}</p>
                </div>
                <div className="project-resources">
                  <h4>Built with</h4>
                  <p>{project.stack}</p>
                  <div className="project-links">
                    {project.links.map(({ label, url }) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" aria-label={`${project.name} · ${label}`}>{label}</a>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Work;

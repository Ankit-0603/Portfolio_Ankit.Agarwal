import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { IconType } from "react-icons";
import { LuPause, LuPlay } from "react-icons/lu";
import {
  SiCss3, SiExpress, SiGit, SiGithub, SiGooglegemini, SiHtml5, SiJavascript,
  SiLangchain, SiMongodb, SiNextdotjs, SiNodedotjs, SiNumpy, SiOpenai,
  SiOpenjdk, SiPandas, SiPostgresql, SiPostman, SiPrisma, SiPython, SiReact,
  SiStackblitz, SiTailwindcss, SiTypescript, SiVercel, SiVisualstudiocode, SiVite,
} from "react-icons/si";
import {
  TbApi, TbBinaryTree, TbBraces, TbCpu, TbDatabase, TbInfinity, TbKey,
  TbLanguage, TbMessageCode, TbNetwork, TbPrompt, TbSparkles,
} from "react-icons/tb";
import { skillGroups } from "../data/portfolio";
import { layoutBalls, stepBalls, type SkillBall } from "./utils/skillBallPhysics";
import "./styles/TechStack.css";

const marks: Record<string, [IconType, string]> = {
  Python: [SiPython, "#306998"], Java: [SiOpenjdk, "#aa482b"],
  HTML5: [SiHtml5, "#be441e"], CSS3: [SiCss3, "#236dab"],
  JavaScript: [SiJavascript, "#926602"], TypeScript: [SiTypescript, "#2866a9"],
  SQL: [TbDatabase, "#24677c"], "React.js": [SiReact, "#087b97"],
  "Next.js": [SiNextdotjs, "#23212a"], "Node.js": [SiNodedotjs, "#427c2c"],
  "Express.js": [SiExpress, "#383443"], "Tailwind CSS": [SiTailwindcss, "#067890"],
  Vite: [SiVite, "#7642c7"], NextAuth: [TbKey, "#7a47a7"],
  NumPy: [SiNumpy, "#386b9b"], Pandas: [SiPandas, "#332463"],
  "Generative AI": [TbSparkles, "#7646ad"], LLMs: [TbMessageCode, "#75579d"],
  LangChain: [SiLangchain, "#245b4c"], "OpenAI API": [SiOpenai, "#196d57"],
  "Gemini API": [SiGooglegemini, "#5755b1"], "prompt engineering": [TbPrompt, "#735494"],
  NLP: [TbLanguage, "#745098"], PostgreSQL: [SiPostgresql, "#326287"],
  MongoDB: [SiMongodb, "#277247"], "Prisma ORM": [SiPrisma, "#274e64"],
  Git: [SiGit, "#b94b34"], GitHub: [SiGithub, "#2b2832"],
  "VS Code": [SiVisualstudiocode, "#226caa"], Postman: [SiPostman, "#bb4928"],
  Vercel: [SiVercel, "#242129"], "WebContainer API": [SiStackblitz, "#334cb6"],
  "REST APIs": [TbApi, "#42638a"], "CI/CD": [TbInfinity, "#5461a7"],
  "Data structures & algorithms": [TbBinaryTree, "#496497"],
  "object-oriented programming": [TbBraces, "#654490"],
  "database management systems": [TbDatabase, "#416e86"],
  "operating systems": [TbCpu, "#56578e"], "computer networks": [TbNetwork, "#526790"],
};

const names = skillGroups.flatMap(({ skills }) => skills.split(", "));
const motionQuery = "(prefers-reduced-motion: reduce)";

export default function TechStack() {
  const field = useRef<HTMLUListElement>(null);
  const [playing, setPlaying] = useState(() => !window.matchMedia(motionQuery).matches);
  const playState = useRef(playing);
  const syncPlayback = useRef<() => void>();

  useEffect(() => {
    const preference = window.matchMedia(motionQuery);
    const change = () => setPlaying(!preference.matches);
    preference.addEventListener("change", change);
    return () => preference.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    playState.current = playing;
    syncPlayback.current?.();
  }, [playing]);

  useLayoutEffect(() => {
    const stage = field.current;
    if (!stage) return;
    const elements = Array.from(stage.children) as HTMLElement[];
    const prints = Array.from(stage.querySelectorAll<HTMLElement>(".tech-print"));
    let balls: SkillBall[] = [];
    let width = 0, height = 0;
    let visible = false;
    let frame = 0, previous = 0, remainder = 0;
    let clientPointer: { x: number; y: number } | undefined;
    const step = 1 / 90;

    function paint() {
      balls.forEach(({ x, y, radius, angle }, i) => {
        const ball = elements[i];
        ball.style.transform = `translate3d(${x - radius}px, ${y - radius}px, 0)`;
        // Roll the print across the lit face, keeping the lettering in view.
        const turn = Math.sin(angle);
        prints[i].style.transform = `translateX(${turn * 5}%) rotateY(${turn * 22}deg) rotateZ(${Math.cos(angle) * 11}deg)`;
      });
    }
    function resize() {
      const w = stage!.clientWidth, h = stage!.clientHeight;
      if (!w || !h || (w === width && h === height)) return;
      width = w;
      height = h;
      balls = layoutBalls(names, w, h);
      // Disperse the starting rows into a natural cluster before the first paint.
      for (let tick = 0; tick < 115; tick++) stepBalls(balls, w, h, step);
      balls.forEach(({ radius }, i) => { elements[i].style.width = `${2 * radius}px`; });
      paint();
    }
    function animate(time: number) {
      if (previous) remainder += Math.min((time - previous) / 1000, 0.05);
      previous = time;
      // Smooth scrolling can move the field under a stationary cursor.
      let pointer;
      if (clientPointer) {
        const rect = stage!.getBoundingClientRect();
        const x = clientPointer.x - rect.left;
        const y = clientPointer.y - rect.top;
        if (x >= 0 && x <= width && y >= 0 && y <= height) pointer = { x, y };
      }
      while (remainder >= step) {
        stepBalls(balls, width, height, step, pointer);
        remainder -= step;
      }
      paint();
      frame = requestAnimationFrame(animate);
    }
    function sync() {
      cancelAnimationFrame(frame);
      previous = remainder = 0;
      if (document.hidden) release();
      if (visible && !document.hidden && playState.current) frame = requestAnimationFrame(animate);
    }
    function nudge(event: PointerEvent) {
      if (event.isPrimary) clientPointer = { x: event.clientX, y: event.clientY };
    }
    function release() { clientPointer = undefined; }
    function endContact(event: PointerEvent) {
      if (event.isPrimary && event.pointerType !== "mouse") release();
    }

    resize();
    const sizes = new ResizeObserver(resize);
    sizes.observe(stage);
    const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    visibility.observe(stage);
    syncPlayback.current = sync;
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pointermove", nudge, { passive: true });
    window.addEventListener("pointerdown", nudge, { passive: true });
    window.addEventListener("blur", release);
    document.documentElement.addEventListener("pointerleave", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("pointerup", endContact);

    return () => {
      syncPlayback.current = undefined;
      cancelAnimationFrame(frame);
      sizes.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", nudge);
      window.removeEventListener("pointerdown", nudge);
      window.removeEventListener("blur", release);
      document.documentElement.removeEventListener("pointerleave", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("pointerup", endContact);
    };
  }, []);

  return (
    <section className="techstack" id="tech-stack" aria-labelledby="tech-heading">
      <header className="tech-heading">
        <h2 id="tech-heading">My tech stack</h2>
        <button type="button" className="tech-motion" onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause ball animation" : "Resume ball animation"}
          title={playing ? "Pause animation" : "Resume animation"}>
          {playing ? <LuPause aria-hidden="true" /> : <LuPlay aria-hidden="true" />}
        </button>
      </header>
      <ul className="tech-field" ref={field} aria-label="Technical skills">
        {names.map((name) => {
          const [Mark, ink] = marks[name] ?? [TbCpu, "#664981"];
          return (
            <li key={name} className={name.length > 15 ? "tech-ball tech-ball-long" : "tech-ball"} style={{ "--ink": ink } as CSSProperties}>
              <span className="tech-print">
                <Mark aria-hidden="true" focusable="false" />
                <span>{name}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

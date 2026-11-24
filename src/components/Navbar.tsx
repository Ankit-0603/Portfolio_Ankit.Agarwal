import { useEffect, type MouseEvent } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { contact } from "../data/portfolio";
import HoverLinks from "./HoverLinks";
import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { useLoading } from "../context/LoadingProvider";
import PortfolioLogo from "./PortfolioLogo";
import "./styles/Navbar.css";

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);
export let smoother: ScrollSmoother;

const Navbar = () => {
  const { isLoading } = useLoading();

  useEffect(() => {
    smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.7,
      speed: 1.7,
      effects: true,
      autoResize: true,
      ignoreMobileResize: true,
    });

    smoother.scrollTop(0);

    const refresh = () => ScrollSmoother.refresh(true);
    window.addEventListener("resize", refresh);
    return () => {
      window.removeEventListener("resize", refresh);
      smoother.kill();
    };
  }, []);

  useEffect(() => {
    smoother.paused(isLoading);
  }, [isLoading]);

  function scrollToSection(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    smoother.scrollTo(event.currentTarget.hash, true, "top top");
  }

  return (
    <>
      <div className="header">
        <PortfolioLogo />
        <a
          href={`mailto:${contact.email}`}
          className="navbar-connect"
          data-cursor="disable"
        >
          {contact.email}
        </a>
        <ul>
          <li>
            <a data-href="#about" href="#about" onClick={scrollToSection}>
              <HoverLinks text="ABOUT" />
            </a>
          </li>
          <li>
            <a data-href="#work" href="#work" onClick={scrollToSection}>
              <HoverLinks text="WORK" />
            </a>
          </li>
          <li>
            <a data-href="#contact" href="#contact" onClick={scrollToSection}>
              <HoverLinks text="CONTACT" />
            </a>
          </li>
        </ul>
      </div>

      <div className="landing-circle1"></div>
      <div className="landing-circle2"></div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;

import { MdArrowOutward } from "react-icons/md";
import { contact } from "../data/portfolio";
import "./styles/Contact.css";

const Contact = () => (
  <section className="contact-section section-container" id="contact">
    <div className="contact-container">
      <h3>Contact</h3>
      <div className="contact-flex">
        <div className="contact-box">
          <h4>Email</h4>
          <p><a href={`mailto:${contact.email}`}>{contact.email}</a></p>
          <h4>Phone</h4>
          <p><a href={`tel:${contact.tel}`}>{contact.phone}</a></p>
          <h4>Location</h4>
          <p>{contact.location}</p>
        </div>
        <div className="contact-box">
          <h4>Profiles</h4>
          <a href={contact.github} target="_blank" rel="noreferrer" className="contact-social">
            GitHub <MdArrowOutward />
          </a>
          <a href={contact.linkedin} target="_blank" rel="noreferrer" className="contact-social">
            LinkedIn <MdArrowOutward />
          </a>
        </div>
        <div className="contact-box">
          <h2>Ankit Agarwal<br /><span>Software Engineer</span></h2>

        </div>
      </div>
    </div>
  </section>
);

export default Contact;

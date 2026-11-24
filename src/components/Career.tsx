import "./styles/Career.css";

const careerGroups = [
  {
    heading: "Experience",
    entries: [
      {
        title: "Generative AI Developer Intern",
        place: "AI Wallah · Remote",
        dates: "June – August 2025",
        detail: "I built a chatbot, a weather assistant, a YouTube summarizer, and a DSA practice platform with AI code optimization. I integrated Gemini and OpenAI into Python backends with LangChain, handling authentication, conversation context, and structured responses. I refined prompts through team demos and peer code reviews.",
      },
    ],
  },
  {
    heading: "Education",
    entries: [
      {
        title: "B.Tech in Information Technology",
        place: "Techno International NewTown",
        dates: "2022 – 2026",
        detail: "Kolkata, West Bengal",
      },
      {
        title: "Class XII · ISC",
        place: "Assembly of God Church School",
        dates: "2020 – 2021",
        detail: "Ukhra, West Bengal",
      },
      {
        title: "Class X · ICSE",
        place: "Assembly of God Church School",
        dates: "2018 – 2019",
        detail: "Ukhra, West Bengal",
      },
    ],
  },
];

const Career = () => (
  <section className="career-section section-container">
    <div className="career-container">
      <h2>Experience <span>&</span> Education</h2>
      <div className="career-info">
        <div className="career-timeline" aria-hidden="true"><div className="career-dot" /></div>
        {careerGroups.map(({ heading, entries }) => (
          <section className="career-column" key={heading}>
            <h3>{heading}</h3>
            {entries.map(({ title, place, dates, detail }) => (
              <article className="career-info-box" key={title}>
                <p className="career-dates">{dates}</p>
                <h4>{title}</h4>
                <p className="career-place">{place}</p>
                <p>{detail}</p>
              </article>
            ))}
          </section>
        ))}
      </div>
      <div className="qualifications">
        <h3>Achievements & certifications</h3>
        <ul>
          <li>Solved 350+ LeetCode problems across arrays, trees, graphs, dynamic programming, and sliding windows.</li>
          <li>The Complete Web Development Bootcamp · Udemy</li>
          <li>Java Masterclass · Udemy</li>
        </ul>
      </div>
    </div>
  </section>
);

export default Career;

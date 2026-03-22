import s from "./PortfolioHero.module.css";

export default function PortfolioHero() {
  return (
    <div className={s.page}>
      <h1 className={s.title}>
        Projects in <span className="grad-text">Motion</span>
      </h1>
    </div>
  );
}

import s from "./ServicesHero.module.css";

export default function ServicesHero() {
  return (
    <div className={s.page}>
      <h1 className={s.title}>
        What We <span className="grad-text">Build</span>
      </h1>
    </div>
  );
}

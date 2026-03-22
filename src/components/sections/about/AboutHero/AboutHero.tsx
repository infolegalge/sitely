import s from "./AboutHero.module.css";

export default function AboutHero() {
  return (
    <div className={s.page}>
      <h1 className={s.title}>
        Building the <span className="grad-text">Future</span>
      </h1>
    </div>
  );
}

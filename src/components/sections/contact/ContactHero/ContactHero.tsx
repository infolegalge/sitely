import { Suspense } from "react";
import ContactForm from "@/components/sections/contact/ContactForm/ContactForm";
import s from "./ContactHero.module.css";

export default function ContactHero() {
  return (
    <div className={s.page}>
      <h1 className={s.title}>
        Start Your <span className="grad-text">Project</span>
      </h1>
      <p className={s.subtitle}>
        შეავსეთ ფორმა და მიიღეთ წვდომა თქვენს პერსონალურ კაბინეტზე
      </p>
      <Suspense>
        <ContactForm />
      </Suspense>
    </div>
  );
}

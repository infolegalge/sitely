"use client";

import { usePortal } from "@/components/sections/portal/PortalProvider/PortalProvider";
import s from "./ContactManager.module.css";

export default function ContactManager() {
  const { company } = usePortal();

  return (
    <section className={s.section}>
      <h2 className={s.title}>საკონტაქტო ინფორმაცია</h2>

      <div className={s.infoList}>
        <div className={s.infoRow}>
          <div className={s.infoIcon}>📧</div>
          <div className={s.infoContent}>
            <p className={s.infoLabel}>ელ-ფოსტა</p>
            <p className={s.infoValue}>
              {company?.email ? (
                <a href={`mailto:${company.email}`} className={s.infoLink}>
                  {company.email}
                </a>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>

        <div className={s.infoRow}>
          <div className={s.infoIcon}>📱</div>
          <div className={s.infoContent}>
            <p className={s.infoLabel}>ტელეფონი</p>
            <p className={s.infoValue}>
              {company?.phone ? (
                <a href={`tel:${company.phone}`} className={s.infoLink}>
                  {company.phone}
                </a>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>

        <div className={s.infoRow}>
          <div className={s.infoIcon}>🏢</div>
          <div className={s.infoContent}>
            <p className={s.infoLabel}>კატეგორია</p>
            <p className={s.infoValue}>{company?.category || "—"}</p>
          </div>
        </div>

        <div className={s.infoRow}>
          <div className={s.infoIcon}>💬</div>
          <div className={s.infoContent}>
            <p className={s.infoLabel}>Sitely მენეჯერი</p>
            <p className={s.infoValue}>
              <a href="mailto:hello@sitely.ge" className={s.infoLink}>
                hello@sitely.ge
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

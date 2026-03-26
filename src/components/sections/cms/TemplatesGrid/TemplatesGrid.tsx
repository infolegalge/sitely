"use client";

import Link from "next/link";
import { useTemplates } from "@/components/sections/cms/TemplatesProvider/TemplatesProvider";
import s from "./TemplatesGrid.module.css";

export default function TemplatesGrid() {
  const { templates, loading, deleteTemplate } = useTemplates();

  if (loading) {
    return <div className={s.loading}>იტვირთება...</div>;
  }

  return (
    <div className={s.grid}>
      <Link href="/secure-access/templates/new" className={s.addCard}>
        <span className={s.addIcon}>+</span>
        <span className={s.addText}>ახალი შაბლონი</span>
      </Link>

      {templates.map((t) => (
        <div key={t.id} className={s.card}>
          <div className={s.thumb}>
            {t.thumbnail_url ? (
              <img src={t.thumbnail_url} alt={t.name} className={s.thumbImg} />
            ) : (
              <div className={s.thumbPlaceholder}>
                <span>{t.industry}</span>
              </div>
            )}
          </div>
          <div className={s.cardBody}>
            <h3 className={s.cardName}>{t.name}</h3>
            <span className={s.industryBadge}>{t.industry}</span>
            {t.description && (
              <p className={s.cardDesc}>{t.description}</p>
            )}
            <div className={s.cardActions}>
              <Link
                href={`/secure-access/templates/${t.id}/edit`}
                className={s.editBtn}
              >
                რედაქტირება
              </Link>
              <button
                className={s.deleteBtn}
                onClick={() => {
                  if (confirm(`წავშალოთ "${t.name}"?`)) {
                    deleteTemplate(t.id);
                  }
                }}
              >
                წაშლა
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

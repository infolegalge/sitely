"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Copy, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import CmsButton from "@/components/ui/CmsButton/CmsButton";
import CmsBadge from "@/components/ui/CmsBadge/CmsBadge";
import CmsModal from "@/components/ui/CmsModal/CmsModal";
import CmsEmptyState from "@/components/ui/CmsEmptyState/CmsEmptyState";
import { useTemplates } from "@/components/sections/cms/TemplatesProvider/TemplatesProvider";
import s from "./TemplatesGrid.module.css";

function SkeletonCards() {
  return (
    <div className={s.skeletonGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={s.skeletonCard}>
          <div className={s.skeletonThumb} />
          <div className={s.skeletonBody}>
            <div className={s.skeletonLine} />
            <div className={s.skeletonLine} />
            <div className={s.skeletonLine} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TemplatesGrid() {
  const {
    filtered,
    loading,
    error,
    deleteTemplate,
    cloneTemplate,
    toggleActive,
  } = useTemplates();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  const [cloning, setCloning] = useState<string | null>(null);

  if (loading) return <SkeletonCards />;

  if (error) {
    return (
      <CmsEmptyState
        title="შეცდომა"
        description={error}
      />
    );
  }

  const openPreview = async (id: string, name: string) => {
    const res = await fetch(`/api/templates/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setPreviewHtml(data.html_content || "");
    setPreviewName(name);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await deleteTemplate(deleteId);
    setDeleting(false);
    setDeleteId(null);
  };

  const handleClone = async (id: string) => {
    setCloning(id);
    await cloneTemplate(id);
    setCloning(null);
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ka-GE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <>
      {filtered.length === 0 ? (
        <CmsEmptyState
          title="შაბლონი ვერ მოიძებნა"
          description="შეცვალეთ ფილტრები ან შექმენით ახალი შაბლონი"
          action={
            <Link href="/secure-access/templates/new">
              <CmsButton size="sm">ახალი შაბლონი</CmsButton>
            </Link>
          }
        />
      ) : (
        <div className={s.grid}>
          <Link href="/secure-access/templates/new" className={s.addCard}>
            <span className={s.addIcon}>+</span>
            <span className={s.addText}>ახალი შაბლონი</span>
          </Link>

          {filtered.map((t) => (
            <div
              key={t.id}
              className={`${s.card} ${!t.is_active ? s.cardInactive : ""}`}
            >
              <div
                className={s.thumb}
                onClick={() => openPreview(t.id, t.name)}
              >
                {t.thumbnail_url ? (
                  <img src={t.thumbnail_url} alt={t.name} className={s.thumbImg} />
                ) : (
                  <div className={s.thumbPlaceholder}>
                    <span>{t.industry}</span>
                  </div>
                )}
                <div className={s.thumbOverlay}>
                  <Eye size={18} />
                </div>
              </div>

              <div className={s.cardBody}>
                <div className={s.cardHeader}>
                  <h3 className={s.cardName}>{t.name}</h3>
                  <button
                    title={t.is_active ? "გამორთვა" : "ჩართვა"}
                    onClick={() => toggleActive(t.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    {t.is_active ? (
                      <ToggleRight size={20} color="var(--cms-cyan)" />
                    ) : (
                      <ToggleLeft size={20} color="var(--cms-tx-3)" />
                    )}
                  </button>
                </div>

                <div className={s.cardMeta}>
                  <CmsBadge color="blue">{t.industry}</CmsBadge>
                  {!t.is_active && <CmsBadge color="red" dot>არააქტიური</CmsBadge>}
                  <span className={s.cardDate}>{fmtDate(t.created_at)}</span>
                </div>

                {t.description && (
                  <p className={s.cardDesc}>{t.description}</p>
                )}

                <div className={s.cardActions}>
                  <Link href={`/secure-access/templates/${t.id}/edit`}>
                    <CmsButton variant="secondary" size="sm" icon={<Pencil size={13} />}>
                      რედაქტირება
                    </CmsButton>
                  </Link>
                  <CmsButton
                    variant="ghost"
                    size="sm"
                    icon={<Copy size={13} />}
                    loading={cloning === t.id}
                    onClick={() => handleClone(t.id)}
                  >
                    ასლი
                  </CmsButton>
                  <CmsButton
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={13} />}
                    onClick={() => {
                      setDeleteId(t.id);
                      setDeleteName(t.name);
                    }}
                  >
                    წაშლა
                  </CmsButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <CmsModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="შაბლონის წაშლა"
        footer={
          <>
            <CmsButton variant="ghost" onClick={() => setDeleteId(null)}>
              გაუქმება
            </CmsButton>
            <CmsButton variant="danger" loading={deleting} onClick={handleDelete}>
              წაშლა
            </CmsButton>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: "0.85rem" }}>
          ნამდვილად გსურთ <strong>{deleteName}</strong>-ის წაშლა?
        </p>
      </CmsModal>

      {/* Preview modal */}
      <CmsModal
        open={previewHtml !== null}
        onClose={() => setPreviewHtml(null)}
        title={previewName}
        wide
      >
        <iframe
          className={s.previewIframe}
          srcDoc={previewHtml || ""}
          sandbox="allow-same-origin"
          title="Preview"
        />
      </CmsModal>
    </>
  );
}

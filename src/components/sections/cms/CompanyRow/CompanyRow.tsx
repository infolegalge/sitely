"use client";

import { useCompanies } from "@/components/sections/cms/CompaniesProvider/CompaniesProvider";
import CmsBadge from "@/components/ui/CmsBadge/CmsBadge";
import CmsSkeleton from "@/components/ui/CmsSkeleton/CmsSkeleton";
import s from "./CompanyRow.module.css";

const STATUS_MAP: Record<string, { label: string; color: "gray" | "blue" | "violet" | "gold" | "green" | "red" | "cyan" }> = {
  lead: { label: "ახალი", color: "gray" },
  locked: { label: "მუშავდება", color: "violet" },
  demo_ready: { label: "დემო მზადაა", color: "gold" },
  contacted: { label: "კონტაქტირებული", color: "blue" },
  engaged: { label: "ჩართული", color: "cyan" },
  converted: { label: "კონვერტირებული", color: "green" },
  dnc: { label: "DNC", color: "red" },
};

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_MAP).map(([k, v]) => [k, v.label]),
);

interface CompanyRowData {
  id: string;
  name: string;
  tier: number | null;
  score: number | null;
  email: string | null;
  category: string | null;
  rating: number | null;
  reviews_count: number | null;
  status: string;
  website: string | null;
  phone: string | null;
  address: string | null;
}

interface Props {
  company: CompanyRowData;
}

export default function CompanyRow({ company }: Props) {
  const {
    expandedId,
    expandedCompany,
    expandedLoading,
    toggleExpanded,
    updateCompanyStatus,
  } = useCompanies();

  const isExpanded = expandedId === company.id;
  const meta = expandedCompany?.metadata as Record<string, Record<string, unknown>> | undefined;
  const gm = meta?.gm as Record<string, unknown> | undefined;
  const social = meta?.social as Record<string, string> | undefined;
  const yell = meta?.yell as Record<string, string> | undefined;
  const imageUrls = (gm?.image_urls as string[]) || [];
  const statusInfo = STATUS_MAP[company.status];

  return (
    <>
      <tr
        className={`${s.row} ${isExpanded ? s.rowExpanded : ""}`}
        onClick={() => toggleExpanded(company.id)}
      >
        <td className={s.cell}>
          <span className={s.name}>{company.name}</span>
        </td>
        <td className={s.cell}>{company.category || "—"}</td>
        <td className={s.cell}>
          {company.tier != null && (
            <CmsBadge color={company.tier === 1 ? "red" : "gray"}>
              T{company.tier}
            </CmsBadge>
          )}
        </td>
        <td className={s.cell}>
          {company.score != null ? (
            <span className={s.score}>{company.score}</span>
          ) : (
            "—"
          )}
        </td>
        <td className={s.cell}>
          <CmsBadge color={statusInfo?.color ?? "gray"} dot>
            {statusInfo?.label ?? company.status}
          </CmsBadge>
        </td>
      </tr>

      {isExpanded && (
        <tr className={s.expandedRow}>
          <td colSpan={5} className={s.expandedCell}>
            {expandedLoading ? (
              <div className={s.loadingDetail}>
                <CmsSkeleton count={3} width="80%" height={14} gap="0.6rem" />
              </div>
            ) : (
              <div className={s.detail}>
                <div className={s.detailGrid}>
                  <div className={s.detailSection}>
                    <h4 className={s.detailTitle}>საკონტაქტო</h4>
                    <div className={s.detailItems}>
                      {company.phone && (
                        <div className={s.detailItem}>
                          <span className={s.detailLabel}>ტელეფონი:</span>
                          <span>{company.phone}</span>
                        </div>
                      )}
                      {company.email && (
                        <div className={s.detailItem}>
                          <span className={s.detailLabel}>Email:</span>
                          <span>{company.email}</span>
                        </div>
                      )}
                      {company.website && (
                        <div className={s.detailItem}>
                          <span className={s.detailLabel}>Website:</span>
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={s.link}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {company.website}
                          </a>
                        </div>
                      )}
                      {company.address && (
                        <div className={s.detailItem}>
                          <span className={s.detailLabel}>მისამართი:</span>
                          <span>{company.address}</span>
                        </div>
                      )}
                    </div>

                    {social && Object.values(social).some(Boolean) && (
                      <div className={s.socialLinks}>
                        {social.facebook && (
                          <a
                            href={social.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={s.socialLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            FB
                          </a>
                        )}
                        {social.instagram && (
                          <a
                            href={social.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={s.socialLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            IG
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={s.detailSection}>
                    <h4 className={s.detailTitle}>დეტალები</h4>
                    <div className={s.detailItems}>
                      {company.rating != null && (
                        <div className={s.detailItem}>
                          <span className={s.detailLabel}>რეიტინგი:</span>
                          <span>
                            {company.rating}★ ({company.reviews_count ?? 0} რევიუ)
                          </span>
                        </div>
                      )}
                      {Boolean(gm?.working_hours) && (
                        <div className={s.detailItem}>
                          <span className={s.detailLabel}>სამუშაო საათები:</span>
                          <span>{String(gm!.working_hours)}</span>
                        </div>
                      )}
                      {yell?.description && (
                        <div className={s.detailItem}>
                          <span className={s.detailLabel}>აღწერა:</span>
                          <span className={s.description}>
                            {String(yell.description)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={s.detailSection}>
                    <h4 className={s.detailTitle}>Pipeline</h4>
                    <select
                      className={s.statusSelect}
                      value={expandedCompany?.status || company.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateCompanyStatus(company.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {imageUrls.length > 0 && (
                  <div className={s.gallery}>
                    {imageUrls.slice(0, 6).map((url, i) => (
                      <div key={i} className={s.galleryItem}>
                        <img
                          src={url}
                          alt={`${company.name} ${i + 1}`}
                          className={s.galleryImg}
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

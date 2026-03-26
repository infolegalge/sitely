"use client";

import { useCompanies } from "@/components/sections/cms/CompaniesProvider/CompaniesProvider";
import s from "./CompanyRow.module.css";

const STATUS_COLORS: Record<string, string> = {
  new: "#888",
  contacted: "#4f6ef7",
  viewed: "#f0c040",
  interested: "#f59e0b",
  negotiating: "#a855f7",
  converted: "#22c55e",
  rejected: "#ef4444",
  not_relevant: "#555",
};

const STATUS_LABELS: Record<string, string> = {
  new: "ახალი",
  contacted: "კონტაქტირებული",
  viewed: "ნანახი",
  interested: "დაინტერესებული",
  negotiating: "მოლაპარაკება",
  converted: "კონვერტირებული",
  rejected: "უარყოფილი",
  not_relevant: "არარელევანტური",
};

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
            <span className={`${s.tierBadge} ${company.tier === 1 ? s.tierHot : ""}`}>
              T{company.tier}
            </span>
          )}
        </td>
        <td className={s.cell}>{company.score ?? "—"}</td>
        <td className={s.cell}>
          {company.email ? (
            <span className={s.hasValue}>✓</span>
          ) : (
            <span className={s.noValue}>✗</span>
          )}
        </td>
        <td className={s.cell}>
          {company.rating != null ? `${company.rating}★` : "—"}
        </td>
        <td className={s.cell}>
          <span
            className={s.statusDot}
            style={{ background: STATUS_COLORS[company.status] || "#888" }}
          />
          {STATUS_LABELS[company.status] || company.status}
        </td>
      </tr>

      {isExpanded && (
        <tr className={s.expandedRow}>
          <td colSpan={7} className={s.expandedCell}>
            {expandedLoading ? (
              <div className={s.loadingDetail}>იტვირთება...</div>
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

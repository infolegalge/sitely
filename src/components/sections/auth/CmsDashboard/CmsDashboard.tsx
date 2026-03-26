"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import s from "./CmsDashboard.module.css";

interface CmsDashboardProps {
  nick: string;
}

interface FunnelData {
  sent: number;
  viewed: number;
  scrolled: number;
  cta: number;
  converted: number;
}

interface Lead {
  demo_id: string;
  score: number;
  view_count: number;
  status: string;
  last_viewed_at: string | null;
  company: { name: string; category: string | null } | null;
}

interface CompanyStats {
  total: number;
  tier1: number;
  withEmail: number;
  withWebsite: number;
}

export default function CmsDashboard({ nick }: CmsDashboardProps) {
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics/overview").then((r) => r.json()).catch(() => ({})),
      fetch("/api/analytics/hot-leads?limit=10").then((r) => r.json()).catch(() => ({ leads: [] })),
      fetch("/api/companies/stats").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([overviewRes, leadsRes, statsRes]) => {
        if (overviewRes.funnel) setFunnel(overviewRes.funnel);
        if (Array.isArray(leadsRes.leads)) setLeads(leadsRes.leads);

        if (statsRes.tier_distribution || statsRes.status_distribution) {
          const tierDist: Record<string, number> = statsRes.tier_distribution ?? {};
          const total = Object.values(tierDist).reduce(
            (sum: number, v) => sum + (v as number),
            0
          );
          setCompanyStats({
            total,
            tier1: (tierDist["1"] as number) ?? 0,
            withEmail: statsRes.has_email ?? 0,
            withWebsite: statsRes.has_website ?? 0,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={s.page}>
      <h1 className={s.greeting}>გამარჯობა, {nick}</h1>
      <p className={s.subtitle}>CMS Dashboard — სწრაფი მიმოხილვა</p>

      {loading ? (
        <p className={s.loading}>იტვირთება...</p>
      ) : (
        <>
          {/* Stats Cards */}
          <div className={s.statsGrid}>
            <div className={s.statCard}>
              <div className={s.statValue}>{companyStats?.total ?? 0}</div>
              <div className={s.statLabel}>სულ კომპანიები</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>{companyStats?.tier1 ?? 0}</div>
              <div className={s.statLabel}>Tier 1</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>{funnel?.sent ?? 0}</div>
              <div className={s.statLabel}>დემოები</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>{funnel?.viewed ?? 0}</div>
              <div className={s.statLabel}>ნანახი</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>{funnel?.cta ?? 0}</div>
              <div className={s.statLabel}>CTA კლიკი</div>
            </div>
            <div className={s.statCard}>
              <div className={s.statValue}>{funnel?.converted ?? 0}</div>
              <div className={s.statLabel}>კონვერსია</div>
            </div>
          </div>

          {/* Quick Links */}
          <div className={s.quickLinks}>
            <Link href="/secure-access/companies" className={s.quickLink}>
              კომპანიები
            </Link>
            <Link href="/secure-access/templates" className={s.quickLink}>
              შაბლონები
            </Link>
            <Link href="/secure-access/demos/generate" className={s.quickLink}>
              დემო გენერაცია
            </Link>
            <Link href="/secure-access/demos" className={s.quickLink}>
              დემოები
            </Link>
            <Link href="/secure-access/analytics" className={s.quickLink}>
              ანალიტიკა
            </Link>
          </div>

          {/* Hot Leads */}
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Hot Leads (ტოპ 10)</h2>
            {leads.length > 0 ? (
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>კომპანია</th>
                    <th>კატეგორია</th>
                    <th>ნახვები</th>
                    <th>Score</th>
                    <th>სტატუსი</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr key={lead.demo_id}>
                      <td>{i + 1}</td>
                      <td>{lead.company?.name ?? "—"}</td>
                      <td>{lead.company?.category ?? "—"}</td>
                      <td>{lead.view_count}</td>
                      <td className={s.score}>{lead.score}</td>
                      <td>{lead.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={s.empty}>ჯერ არ არის მონაცემები</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

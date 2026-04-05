"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Crown,
  Send,
  Eye,
  MousePointerClick,
  TrendingUp,
  LayoutTemplate,
  Wand2,
  Play,
  Mail,
  BarChart3,
} from "lucide-react";
import CmsCard from "@/components/ui/CmsCard/CmsCard";
import CmsSkeleton from "@/components/ui/CmsSkeleton/CmsSkeleton";
import CmsEmptyState from "@/components/ui/CmsEmptyState/CmsEmptyState";
import CmsBadge from "@/components/ui/CmsBadge/CmsBadge";
import useCmsReveal from "@/hooks/useCmsReveal";
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

const STAT_ICONS = [Building2, Crown, Send, Eye, MousePointerClick, TrendingUp];
const STAT_COLORS = ["blue", "gold", "violet", "cyan", "blue", "green"] as const;

const QUICK_LINKS = [
  { href: "/secure-access/companies", label: "კომპანიები", icon: Building2 },
  { href: "/secure-access/templates", label: "შაბლონები", icon: LayoutTemplate },
  { href: "/secure-access/demos/generate", label: "დემო გენერაცია", icon: Wand2 },
  { href: "/secure-access/demos", label: "დემოები", icon: Play },
  { href: "/secure-access/queue", label: "რიგი", icon: Mail },
  { href: "/secure-access/analytics", label: "ანალიტიკა", icon: BarChart3 },
];

const LEAD_STATUS_COLOR: Record<string, "gray" | "blue" | "gold" | "green" | "red"> = {
  pending: "gray",
  viewed: "blue",
  engaged: "gold",
  converted: "green",
  dnc: "red",
};

export default function CmsDashboard({ nick }: CmsDashboardProps) {
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const containerRef = useCmsReveal<HTMLDivElement>([loading]);

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

  const stats = [
    { value: companyStats?.total ?? 0, label: "სულ კომპანიები" },
    { value: companyStats?.tier1 ?? 0, label: "Tier 1" },
    { value: funnel?.sent ?? 0, label: "გაგზავნილი" },
    { value: funnel?.viewed ?? 0, label: "ნანახი" },
    { value: funnel?.cta ?? 0, label: "CTA კლიკი" },
    { value: funnel?.converted ?? 0, label: "კონვერსია" },
  ];

  return (
    <div className={s.page} ref={containerRef}>
      <div data-rv>
        <h1 className={s.greeting}>გამარჯობა, {nick}</h1>
        <p className={s.subtitle}>სწრაფი მიმოხილვა</p>
      </div>

      {loading ? (
        <div className={s.statsGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CmsCard key={i} variant="compact" hover={false}>
              <CmsSkeleton variant="line" width="40%" height={28} />
              <CmsSkeleton variant="line" width="65%" height={12} />
            </CmsCard>
          ))}
        </div>
      ) : (
        <>
          {/* ── Stats Cards ── */}
          <div className={s.statsGrid}>
            {stats.map((stat, i) => {
              const Icon = STAT_ICONS[i];
              const color = STAT_COLORS[i];
              return (
                <div key={i} data-rv>
                  <CmsCard variant="compact">
                    <div className={s.statHeader}>
                      <div className={`${s.statIcon} ${s[`icon_${color}`]}`}>
                        <Icon size={18} />
                      </div>
                    </div>
                    <div className={s.statValue}>{stat.value.toLocaleString()}</div>
                    <div className={s.statLabel}>{stat.label}</div>
                  </CmsCard>
                </div>
              );
            })}
          </div>

          {/* ── Quick Links ── */}
          <div className={s.quickLinks} data-rv>
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className={s.quickLink}>
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* ── Hot Leads ── */}
          <section className={s.section} data-rv>
            <h2 className={s.sectionTitle}>Hot Leads</h2>
            {leads.length > 0 ? (
              <CmsCard variant="flat" hover={false}>
                <div className={s.leadsTable}>
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
                          <td className={s.rank}>{i + 1}</td>
                          <td className={s.companyName}>{lead.company?.name ?? "—"}</td>
                          <td>{lead.company?.category ?? "—"}</td>
                          <td>{lead.view_count}</td>
                          <td className={s.score}>{lead.score}</td>
                          <td>
                            <CmsBadge
                              color={LEAD_STATUS_COLOR[lead.status] ?? "gray"}
                              dot
                            >
                              {lead.status}
                            </CmsBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CmsCard>
            ) : (
              <CmsEmptyState
                title="ჯერ არ არის მონაცემები"
                description="დემოების გაგზავნის შემდეგ აქ გამოჩნდება ტოპ leads"
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}

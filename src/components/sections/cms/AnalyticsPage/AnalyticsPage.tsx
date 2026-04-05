"use client";

import { useAnalytics } from "../AnalyticsProvider/AnalyticsProvider";
import DateRangePicker from "../DateRangePicker/DateRangePicker";
import KpiCards from "../KpiCards/KpiCards";
import FunnelChart from "../FunnelChart/FunnelChart";
import TimeSeriesChart from "../TimeSeriesChart/TimeSeriesChart";
import ActivityHeatmap from "../ActivityHeatmap/ActivityHeatmap";
import EventsGrid from "../EventsGrid/EventsGrid";
import BehavioralPanels from "../BehavioralPanels/BehavioralPanels";
import LeadGrid from "../LeadGrid/LeadGrid";
import JourneyDrawer from "../JourneyDrawer/JourneyDrawer";
import GeoBreakdown from "../GeoBreakdown/GeoBreakdown";
import DeviceBreakdown from "../DeviceBreakdown/DeviceBreakdown";
import UtmBreakdown from "../UtmBreakdown/UtmBreakdown";
import TopSections from "../TopSections/TopSections";
import FunnelAbandonment from "../FunnelAbandonment/FunnelAbandonment";
import BrowserBreakdown from "../BrowserBreakdown/BrowserBreakdown";
import WebVitals from "../WebVitals/WebVitals";
import ActiveVisitors from "../ActiveVisitors/ActiveVisitors";
import ConversionTrends from "../ConversionTrends/ConversionTrends";
import TemplatePerformance from "../TemplatePerformance/TemplatePerformance";
import CampaignComparison from "../CampaignComparison/CampaignComparison";
import SessionPercentiles from "../SessionPercentiles/SessionPercentiles";
import ScrollDepthHistogram from "../ScrollDepthHistogram/ScrollDepthHistogram";
import AnalyticsErrorBoundary from "../AnalyticsErrorBoundary/AnalyticsErrorBoundary";
import {
  KpiSkeleton,
  ChartSkeleton,
  CardSkeleton,
  BreakdownSkeleton,
  BehavioralSkeleton,
  TableSkeleton,
} from "../AnalyticsSkeleton/AnalyticsSkeleton";
import s from "./AnalyticsPage.module.css";

export default function AnalyticsPage() {
  const { loading, error, refresh, autoRefresh, setAutoRefresh, showComparison, setShowComparison, dateRange } = useAnalytics();

  function exportCsv(type: "leads" | "events") {
    const params = new URLSearchParams({ type });
    if (dateRange.from) params.set("from", dateRange.from);
    if (dateRange.to) params.set("to", dateRange.to);
    window.open(`/api/analytics/export?${params}`, "_blank");
  }

  if (loading) {
    return (
      <div className={s.page}>
        {/* Header */}
        <div className={s.headerRow}>
          <h1 className={s.title}>Sales Intelligence</h1>
          <div className={s.headerActions}>
            <DateRangePicker />
          </div>
        </div>
        <KpiSkeleton />
        <section className={s.section}><ChartSkeleton /></section>
        <div className={s.splitRow}>
          <section className={s.halfSection}><CardSkeleton rows={5} /></section>
          <section className={s.halfSection}><CardSkeleton rows={7} /></section>
        </div>
        <section className={s.section}><CardSkeleton rows={6} /></section>
        <div className={s.quadRow}>
          <section className={s.quarterSection}><BreakdownSkeleton rows={4} /></section>
          <section className={s.quarterSection}><BreakdownSkeleton rows={3} /></section>
          <section className={s.quarterSection}><BreakdownSkeleton rows={4} /></section>
          <section className={s.quarterSection}><BreakdownSkeleton rows={4} /></section>
        </div>
        <div className={s.splitRow}>
          <section className={s.halfSection}><CardSkeleton rows={6} /></section>
          <section className={s.halfSection}><CardSkeleton rows={5} /></section>
        </div>
        <section className={s.section}><BehavioralSkeleton /></section>
        <section className={s.section}><TableSkeleton rows={8} /></section>
      </div>
    );
  }

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.headerRow}>
        <div className={s.titleGroup}>
          <h1 className={s.title}>Sales Intelligence</h1>
          <ActiveVisitors />
        </div>
        <div className={s.headerActions}>
          <DateRangePicker />
          <button
            className={showComparison ? s.compareActive : s.compareBtn}
            onClick={() => setShowComparison(!showComparison)}
            aria-pressed={showComparison}
            aria-label={showComparison ? "შედარება ჩართულია" : "შედარება გამორთულია"}
          >
            ⇆ შედარება
          </button>
          <button
            className={autoRefresh ? s.autoRefreshActive : s.autoRefreshBtn}
            onClick={() => setAutoRefresh(!autoRefresh)}
            aria-pressed={autoRefresh}
            aria-label={autoRefresh ? "ავტო-განახლება ჩართულია" : "ავტო-განახლება გამორთულია"}
          >
            {autoRefresh ? "⏸ Auto" : "▶ Auto"}
          </button>
          <button className={s.refreshBtn} onClick={refresh} aria-label="მონაცემების განახლება">
            ↻
          </button>
          <div className={s.exportGroup}>
            <button className={s.exportBtn} onClick={() => exportCsv("leads")} aria-label="ლიდების ექსპორტი CSV">
              ⬇ ლიდები
            </button>
            <button className={s.exportBtn} onClick={() => exportCsv("events")} aria-label="ივენთების ექსპორტი CSV">
              ⬇ ივენთები
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && <div className={s.errorBanner} role="alert">{error}</div>}

      {/* KPI Cards */}
      <AnalyticsErrorBoundary name="KPI">
        <KpiCards />
      </AnalyticsErrorBoundary>

      {/* Time Series Chart */}
      <section className={s.section}>
        <AnalyticsErrorBoundary name="ტრენდები">
          <TimeSeriesChart />
        </AnalyticsErrorBoundary>
      </section>

      {/* Conversion Rate Trends */}
      <section className={s.section}>
        <AnalyticsErrorBoundary name="კონვერსიის ტრენდი">
          <ConversionTrends />
        </AnalyticsErrorBoundary>
      </section>

      {/* Funnel + Heatmap side-by-side */}
      <div className={s.splitRow}>
        <section className={s.halfSection}>
          <AnalyticsErrorBoundary name="ფუნელი">
            <FunnelChart />
          </AnalyticsErrorBoundary>
        </section>
        <section className={s.halfSection}>
          <AnalyticsErrorBoundary name="აქტივობის რუკა">
            <ActivityHeatmap />
          </AnalyticsErrorBoundary>
        </section>
      </div>

      {/* Funnel Abandonment — drop-off analysis */}
      <section className={s.section}>
        <AnalyticsErrorBoundary name="Funnel Abandonment">
          <FunnelAbandonment />
        </AnalyticsErrorBoundary>
      </section>

      {/* Geo + Device + Browser + Traffic sources */}
      <div className={s.quadRow}>
        <section className={s.quarterSection}>
          <AnalyticsErrorBoundary name="გეოგრაფია">
            <GeoBreakdown />
          </AnalyticsErrorBoundary>
        </section>
        <section className={s.quarterSection}>
          <AnalyticsErrorBoundary name="მოწყობილობები">
            <DeviceBreakdown />
          </AnalyticsErrorBoundary>
        </section>
        <section className={s.quarterSection}>
          <AnalyticsErrorBoundary name="ბრაუზერი/OS">
            <BrowserBreakdown />
          </AnalyticsErrorBoundary>
        </section>
        <section className={s.quarterSection}>
          <AnalyticsErrorBoundary name="ტრაფიკი">
            <UtmBreakdown />
          </AnalyticsErrorBoundary>
        </section>
      </div>

      {/* Events Grid + Top Sections side-by-side */}
      <div className={s.splitRow}>
        <section className={s.halfSection}>
          <AnalyticsErrorBoundary name="ივენთები">
            <EventsGrid />
          </AnalyticsErrorBoundary>
        </section>
        <section className={s.halfSection}>
          <AnalyticsErrorBoundary name="ტოპ სექციები">
            <TopSections />
          </AnalyticsErrorBoundary>
        </section>
      </div>

      {/* Web Vitals + Template Performance */}
      <div className={s.splitRow}>
        <section className={s.halfSection}>
          <AnalyticsErrorBoundary name="Web Vitals">
            <WebVitals />
          </AnalyticsErrorBoundary>
        </section>
        <section className={s.halfSection}>
          <AnalyticsErrorBoundary name="შაბლონების შედარება">
            <TemplatePerformance />
          </AnalyticsErrorBoundary>
        </section>
      </div>

      {/* Campaign Comparison */}
      <section className={s.section}>
        <AnalyticsErrorBoundary name="კამპანიების შედარება">
          <CampaignComparison />
        </AnalyticsErrorBoundary>
      </section>

      {/* Session Duration + Scroll Depth */}
      <div className={s.splitRow}>
        <section className={s.halfSection}>
          <AnalyticsErrorBoundary name="სესიის ხანგრძლივობა">
            <SessionPercentiles />
          </AnalyticsErrorBoundary>
        </section>
        <section className={s.halfSection}>
          <AnalyticsErrorBoundary name="Scroll Depth">
            <ScrollDepthHistogram />
          </AnalyticsErrorBoundary>
        </section>
      </div>

      {/* Behavioral Panels */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>ლიდერბორდი</h2>
        <AnalyticsErrorBoundary name="ლიდერბორდი">
          <BehavioralPanels />
        </AnalyticsErrorBoundary>
      </section>

      {/* Lead Grid */}
      <section className={s.section}>
        <h2 className={s.sectionTitle}>ლიდები</h2>
        <AnalyticsErrorBoundary name="ლიდები">
          <LeadGrid />
        </AnalyticsErrorBoundary>
      </section>

      {/* Journey Drawer */}
      <JourneyDrawer />
    </div>
  );
}

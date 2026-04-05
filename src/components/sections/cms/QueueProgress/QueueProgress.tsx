"use client";

import { useQueue } from "../QueueProvider/QueueProvider";
import styles from "./QueueProgress.module.css";

const STATUS_LABELS: Record<string, string> = {
  draft: "მზადდება",
  sending: "იგზავნება",
  completed: "დასრულდა",
  cancelled: "გაუქმდა",
  paused: "შეჩერდა",
};

export default function QueueProgress() {
  const { campaigns, loading, cancelCampaign } = useQueue();

  if (loading) {
    return <div className={styles.empty}>იტვირთება...</div>;
  }

  if (campaigns.length === 0) {
    return <div className={styles.empty}>კამპანიები არ არის</div>;
  }

  return (
    <>
      {campaigns.map((campaign) => {
        const total = campaign.total_recipients || 1;
        const pct = Math.round((campaign.sent_count / total) * 100);
        const statusClass =
          campaign.status === "sending"
            ? styles.sending
            : campaign.status === "completed"
              ? styles.completed
              : campaign.status === "cancelled"
                ? styles.cancelled
                : styles.draft;

        return (
          <div key={campaign.id} className={styles.card}>
            <div className={styles.campaignName}>
              {campaign.name}
              <span className={`${styles.statusBadge} ${statusClass}`}>
                {STATUS_LABELS[campaign.status] || campaign.status}
              </span>
            </div>
            <div className={styles.meta}>
              {new Date(campaign.created_at).toLocaleDateString("ka-GE")} &middot;{" "}
              {campaign.subject}
            </div>
            <div className={styles.barOuter}>
              <div className={styles.barInner} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.stats}>
              <span>
                {campaign.sent_count} / {campaign.total_recipients} გაგზავნილი
              </span>
              <span>{pct}%</span>
              {campaign.status === "sending" && (
                <button
                  className={styles.cancelBtn}
                  onClick={() => cancelCampaign(campaign.id)}
                >
                  შეჩერება
                </button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

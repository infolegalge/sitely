"use client";

import { useQueue } from "../QueueProvider/QueueProvider";
import styles from "./QueueControls.module.css";

export default function QueueControls() {
  const { campaigns, refresh, cancelCampaign } = useQueue();

  const sendingCampaigns = campaigns.filter((c) => c.status === "sending");

  const handleCancel = async () => {
    if (sendingCampaigns.length === 0) return;
    if (!confirm("გაუქმდეს მიმდინარე კამპანია?")) return;
    for (const c of sendingCampaigns) {
      await cancelCampaign(c.id);
    }
  };

  return (
    <div className={styles.controls}>
      <button className={styles.btnRefresh} onClick={refresh}>
        განახლება
      </button>
      {sendingCampaigns.length > 0 && (
        <button className={styles.btnPanic} onClick={handleCancel}>
          ⬛ შეჩერება
        </button>
      )}
    </div>
  );
}

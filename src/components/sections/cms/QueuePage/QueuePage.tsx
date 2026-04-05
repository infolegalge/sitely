"use client";

import { QueueProvider } from "../QueueProvider/QueueProvider";
import QueueProgress from "../QueueProgress/QueueProgress";
import QueueControls from "../QueueControls/QueueControls";
import styles from "./QueuePage.module.css";

export default function QueuePage() {
  return (
    <QueueProvider>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>რიგი / Queue</h1>
          <QueueControls />
        </div>
        <div className={styles.grid}>
          <QueueProgress />
        </div>
      </div>
    </QueueProvider>
  );
}

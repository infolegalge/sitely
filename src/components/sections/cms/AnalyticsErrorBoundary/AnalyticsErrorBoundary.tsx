"use client";

import { Component, type ReactNode } from "react";
import s from "./AnalyticsErrorBoundary.module.css";

interface Props {
  children: ReactNode;
  name: string;
}

interface State {
  hasError: boolean;
  message: string | null;
}

export default class AnalyticsErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Unknown error" };
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={s.wrap} role="alert">
          <div className={s.inner}>
            <span className={s.icon}>⚠</span>
            <p className={s.text}>
              <strong>{this.props.name}</strong> — კომპონენტის ჩატვირთვა ვერ მოხერხდა
            </p>
            {this.state.message && (
              <p className={s.detail}>{this.state.message}</p>
            )}
            <button className={s.retry} onClick={this.handleRetry}>
              ხელახლა ცდა
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

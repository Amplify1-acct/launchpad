"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./dashboard.module.css";

interface DeployStatusProps {
  businessId: string;
  initialStatus: string | null;
  initialUrl: string | null;
}

export function DeployStatus({ businessId, initialStatus, initialUrl }: DeployStatusProps) {
  const [status, setStatus] = useState(initialStatus || "pending");
  const [url, setUrl] = useState(initialUrl);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/site-status?business_id=${businessId}`);
      const data = await res.json();
      if (data.website) {
        setStatus(data.website.status);
        setUrl(data.website.vercel_url);
        setLastChecked(new Date());
      }
    } catch {}
  }, [businessId]);

  useEffect(() => {
    if (status === "live" && url) return; // Already live, stop polling
    const interval = setInterval(poll, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, [status, url, poll]);

  const statusConfig: Record<string, { label: string; color: string; icon: string; desc: string }> = {
    pending: {
      label: "Queued",
      color: "#f59e0b",
      icon: "⏳",
      desc: "Your site is queued for generation.",
    },
    generating: {
      label: "Generating content",
      color: "#3b82f6",
      icon: "✨",
      desc: "AI is writing your copy, services, and SEO metadata.",
    },
    deploying: {
      label: "Deploying",
      color: "#8b5cf6",
      icon: "🚀",
      desc: "Building and publishing your site to the web.",
    },
    live: {
      label: "Live",
      color: "#16a34a",
      icon: "🌐",
      desc: "Your website is live and published.",
    },
    error: {
      label: "Error",
      color: "#ef4444",
      icon: "⚠️",
      desc: "Something went wrong. We're on it.",
    },
  };

  const cfg = statusConfig[status] || statusConfig.pending;
  const isBuilding = status !== "live" && status !== "error";

  return (
    <div className={styles.deployCard}>
      <div className={styles.deployHeader}>
        <div className={styles.deployIcon} style={{ background: `${cfg.color}15`, color: cfg.color }}>
          {cfg.icon}
        </div>
        <div className={styles.deployInfo}>
          <div className={styles.deployLabel}>Website</div>
          <div className={styles.deployStatus} style={{ color: cfg.color }}>
            {cfg.label}
            {isBuilding && (
              <span className={styles.deployPulse} style={{ background: cfg.color }} />
            )}
          </div>
        </div>
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className={styles.viewSiteBtn}>
            View site →
          </a>
        )}
      </div>

      <div className={styles.deployDesc}>{cfg.desc}</div>

      {isBuilding && (
        <div className={styles.deployProgress}>
          <div
            className={styles.deployProgressBar}
            style={{
              width:
                status === "pending" ? "15%"
                : status === "generating" ? "45%"
                : status === "deploying" ? "80%"
                : "100%",
              background: cfg.color,
            }}
          />
        </div>
      )}

      {url && (
        <div className={styles.deployUrl}>
          <span className={styles.deployUrlDot} />
          <a href={url} target="_blank" rel="noreferrer">{url.replace("https://", "")}</a>
        </div>
      )}

      {lastChecked && (
        <div className={styles.deployLastChecked}>
          Last updated {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import MobileNav from "@/components/MobileNav";
import styles from "./settings.module.css";

type SocialAccount = {
  platform: string;
  account_name: string;
  account_picture: string | null;
  page_name: string | null;
  connected_at: string;
  status: string;
};

const PLATFORMS = [
  {
    id: "facebook",
    name: "Facebook",
    color: "#1877f2",
    icon: "f",
    description: "Connect your Facebook Page to publish posts automatically.",
    connectUrl: "/api/auth/facebook",
  },
  {
    id: "instagram",
    name: "Instagram",
    color: "#e1306c",
    icon: "📷",
    description: "Connected automatically when you link your Facebook Page.",
    connectUrl: "/api/auth/facebook",
    viaMeta: true,
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#010101",
    icon: "♪",
    description: "Connect your TikTok Business account to publish videos.",
    connectUrl: "/api/auth/tiktok",
  },
];

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Show toast on redirect back from OAuth
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) {
      setToast({ msg: `${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`, type: "success" });
      router.replace("/dashboard/settings");
    } else if (error) {
      setToast({ msg: "Connection failed — please try again.", type: "error" });
      router.replace("/dashboard/settings");
    }
  }, [searchParams]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: customer } = await supabase.from("customers").select("id").eq("user_id", user.id).single();
      if (!customer) return;
      const { data: biz } = await supabase.from("businesses").select("*").eq("customer_id", customer.id).single();
      if (biz) setBusiness(biz);
      const { data: accts } = await supabase.from("social_accounts").select("*").eq("business_id", biz?.id);
      setAccounts(accts || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDisconnect(platform: string) {
    setDisconnecting(platform);
    try {
      await fetch("/api/auth/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      setAccounts(prev => prev.filter(a => a.platform !== platform));
      setToast({ msg: `${platform} disconnected.`, type: "success" });
    } finally {
      setDisconnecting(null);
    }
  }

  function getAccount(platform: string) {
    return accounts.find(a => a.platform === platform);
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}><a href="/">Ex<span>sisto</span></a></div>
        <nav className={styles.nav}>
          <a href="/dashboard" className={styles.navItem}><span>⚡</span> Overview</a>
          <a href="/dashboard/website" className={styles.navItem}><span>🌐</span> Website</a>
          <a href="/dashboard/blog" className={styles.navItem}><span>✍️</span> Blog Posts</a>
          <a href="/dashboard/social" className={styles.navItem}><span>📱</span> Social Media</a>
          <a href="/dashboard/seo" className={styles.navItem}><span>🔍</span> SEO</a>
          <a href="/dashboard/settings" className={`${styles.navItem} ${styles.active}`}><span>⚙️</span> Settings</a>
        </nav>
      </aside>

      <main className={styles.main}>
        {toast && (
          <div className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}>
            {toast.type === "success" ? "✓" : "✕"} {toast.msg}
          </div>
        )}

        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage your account and social media connections.</p>
        </div>

        {/* Business info */}
        {business && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Your Business</div>
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Business name</span>
                <span className={styles.infoValue}>{business.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Location</span>
                <span className={styles.infoValue}>{business.city}{business.state ? `, ${business.state}` : ""}</span>
              </div>
              {business.phone && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Phone</span>
                  <span className={styles.infoValue}>{business.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social connections */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Social Media Connections</div>
          <p className={styles.sectionDesc}>
            Connect your accounts so Exsisto can publish approved posts automatically.
          </p>
          <div className={styles.platforms}>
            {PLATFORMS.map(platform => {
              const account = getAccount(platform.id);
              const isConnected = !!account;

              return (
                <div key={platform.id} className={`${styles.platformCard} ${isConnected ? styles.platformConnected : ""}`}>
                  <div className={styles.platformLeft}>
                    <div className={styles.platformIcon} style={{ background: platform.color }}>
                      {account?.account_picture ? (
                        <img src={account.account_picture} alt={platform.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"10px"}} />
                      ) : (
                        <span style={{color:"#fff",fontSize:"18px",fontWeight:800}}>{platform.icon}</span>
                      )}
                    </div>
                    <div className={styles.platformInfo}>
                      <div className={styles.platformName}>{platform.name}</div>
                      {isConnected ? (
                        <div className={styles.platformConnectedInfo}>
                          <span className={styles.connectedDot} />
                          {account.page_name || account.account_name}
                        </div>
                      ) : (
                        <div className={styles.platformDesc}>{platform.description}</div>
                      )}
                    </div>
                  </div>
                  <div className={styles.platformRight}>
                    {isConnected ? (
                      <button
                        className={styles.disconnectBtn}
                        onClick={() => handleDisconnect(platform.id)}
                        disabled={disconnecting === platform.id}
                      >
                        {disconnecting === platform.id ? "Disconnecting..." : "Disconnect"}
                      </button>
                    ) : (
                      <a
                        href={platform.connectUrl}
                        className={styles.connectBtn}
                        style={{ background: platform.color }}
                      >
                        Connect {platform.name}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.oauthNote}>
            <span>🔒</span>
            <span>Exsisto uses official OAuth — we never store your passwords. You can disconnect at any time.</span>
          </div>
        </div>

        {/* What happens when connected */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>How Auto-Publishing Works</div>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNum}>1</div>
              <div><strong>We generate posts</strong> — tailored to your business, scheduled across 30 days.</div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>2</div>
              <div><strong>You review & approve</strong> — edit captions, swap photos, or regenerate any post.</div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNum}>3</div>
              <div><strong>We publish automatically</strong> — approved posts go live on the scheduled date.</div>
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

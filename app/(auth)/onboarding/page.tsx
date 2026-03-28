"use client";
export const dynamic = "force-dynamic";
import React, { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "./onboarding.module.css";

const steps = ["Business", "Details", "Plan"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const [bizName, setBizName] = useState("");
  const [bizDesc, setBizDesc] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [plan, setPlan] = useState<"starter" | "growth" | "premium">("growth");

  async function handleFinish() {
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: customer } = await supabase
        .from("customers").select("id").eq("user_id", user.id).single();
      if (!customer) throw new Error("Customer record not found");

      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .upsert(
          { customer_id: customer.id, name: bizName, description: bizDesc, city, state: stateName, phone },
          { onConflict: "customer_id" }
        )
        .select("id").single();
      if (bizError) throw bizError;

      await supabase.from("subscriptions").upsert(
        { customer_id: customer.id, plan, status: "trialing" },
        { onConflict: "customer_id" }
      );

      const { data: existingJobs } = await supabase
        .from("generation_jobs").select("type").eq("business_id", business.id);
      const existingTypes = existingJobs?.map((j: any) => j.type) || [];
      const jobsToCreate = (["website", "blog_post", "social_posts", "seo"] as const)
        .filter(type => !existingTypes.includes(type))
        .map(type => ({ business_id: business.id, type, status: "pending" as const }));
      if (jobsToCreate.length > 0) {
        await supabase.from("generation_jobs").insert(jobsToCreate);
      }

      // Route to template picker — user picks a design, then generation is triggered
      router.push("/onboarding/template");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <a href="/" className={styles.logo}>Exsisto<span>.</span></a>

        <div className={styles.steps}>
          {steps.map((s, i) => (
            <div key={s} className={`${styles.stepItem} ${i === step ? styles.active : ""} ${i < step ? styles.done : ""}`}>
              <div className={styles.stepDot}>{i < step ? "✓" : i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {step === 0 && (
          <div className={styles.stepContent}>
            <h2>Tell us about your business</h2>
            <p>This is how our AI understands your business and builds everything for you.</p>
            <div className={styles.field}>
              <label>Business name</label>
              <input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="e.g. Matt's Bowling Balls" />
            </div>
            <div className={styles.field}>
              <label>What do you do? <span>(one sentence)</span></label>
              <textarea value={bizDesc} onChange={e => setBizDesc(e.target.value)} placeholder="e.g. I repair and resurface bowling balls for league bowlers and casual players" rows={3} />
            </div>
            <button className={styles.btn} onClick={() => setStep(1)} disabled={!bizName || !bizDesc}>
              Continue →
            </button>
          </div>
        )}

        {step === 1 && (
          <div className={styles.stepContent}>
            <h2>Where are you located?</h2>
            <p>We&apos;ll use this for local SEO and your Google Business Profile.</p>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>City</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Chicago" />
              </div>
              <div className={styles.field}>
                <label>State</label>
                <input value={stateName} onChange={e => setStateName(e.target.value)} placeholder="IL" maxLength={2} />
              </div>
            </div>
            <div className={styles.field}>
              <label>Phone <span>(optional)</span></label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" type="tel" />
            </div>
            <div className={styles.btnRow}>
              <button className={styles.btnOutline} onClick={() => setStep(0)}>← Back</button>
              <button className={styles.btn} onClick={() => setStep(2)} disabled={!city || !stateName}>Continue →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContent}>
            <h2>Choose your plan</h2>
            <p>Start with a 7-day free trial. Cancel any time.</p>
            <div className={styles.plans}>
              {[
                { id: "starter" as const, name: "Starter", price: "$299", features: ["5-page website", "2 blog posts/mo", "Social media setup", "On-page SEO"] },
                { id: "growth" as const, name: "Growth", price: "$599", popular: true, features: ["10-page website", "4 blog posts/mo", "20 social posts/mo", "Full SEO suite"] },
                { id: "premium" as const, name: "Premium", price: "$999", features: ["Unlimited pages", "Weekly blog posts", "Daily social posts", "SEO + ads setup"] },
              ].map(p => (
                <div key={p.id} className={`${styles.plan} ${plan === p.id ? styles.planActive : ""}`} onClick={() => setPlan(p.id)}>
                  {p.popular && <div className={styles.popular}>Most popular</div>}
                  <div className={styles.planName}>{p.name}</div>
                  <div className={styles.planPrice}>{p.price}<span>/mo</span></div>
                  <ul className={styles.planFeatures}>
                    {p.features.map(f => <li key={f}>✓ {f}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className={styles.btnRow}>
              <button className={styles.btnOutline} onClick={() => setStep(1)}>← Back</button>
              <button className={styles.btn} onClick={handleFinish} disabled={loading}>
                {loading ? "Setting up your account..." : "Start free trial →"}
              </button>
            </div>
            <p className={styles.trial}>7-day free trial · No credit card required · Cancel any time</p>
          </div>
        )}
      </div>
    </div>
  );
}

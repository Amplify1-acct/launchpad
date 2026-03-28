"use client";

import { useState } from "react";
import styles from "./Contact.module.css";

const infoItems = [
  { icon: "⚡", label: "Response time", value: "Within 24 hours" },
  { icon: "📞", label: "Prefer to talk?", value: "Book a free 15-min call" },
  { icon: "📧", label: "Email us directly", value: "hello@exsisto.ai" },
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    business: "",
    email: "",
    plan: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section className={styles.section} id="contact">
      <div className={styles.inner}>
        {/* Left */}
        <div className={styles.left}>
          <span className={styles.label}>Get started today</span>
          <h2 className={styles.title}>Let's build your digital presence</h2>
          <p className={styles.sub}>
            Fill out the form and we'll have a personalized plan ready within one business day.
          </p>

          <div className={styles.infoItems}>
            {infoItems.map((item) => (
              <div key={item.label} className={styles.infoItem}>
                <div className={styles.infoIcon}>{item.icon}</div>
                <div>
                  <div className={styles.infoLabel}>{item.label}</div>
                  <div className={styles.infoValue}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Form */}
        <div className={styles.right}>
          {submitted ? (
            <div className={styles.success}>
              <div className={styles.successIcon}>✓</div>
              <h3 className={styles.successTitle}>You're on your way!</h3>
              <p className={styles.successSub}>
                We'll review your details and reach out within one business day with your personalized plan.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>First name</label>
                  <input
                    className={styles.input}
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Jane"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Last name</label>
                  <input
                    className={styles.input}
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Smith"
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Business name</label>
                <input
                  className={styles.input}
                  name="business"
                  value={form.business}
                  onChange={handleChange}
                  placeholder="Smith's Plumbing Co."
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Email address</label>
                <input
                  className={styles.input}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@smithsplumbing.com"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Plan you're interested in</label>
                <select
                  className={styles.input}
                  name="plan"
                  value={form.plan}
                  onChange={handleChange}
                >
                  <option value="">Select a plan…</option>
                  <option value="starter">Starter — $299/mo</option>
                  <option value="growth">Growth — $599/mo</option>
                  <option value="premium">Premium — $999/mo</option>
                  <option value="unsure">Not sure yet</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Tell us about your business <span className={styles.optional}>(optional)</span></label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="What do you do, who do you serve, what's your biggest challenge online?"
                  rows={4}
                />
              </div>

              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? (
                  <span className={styles.spinner} />
                ) : (
                  <>
                    Send message
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

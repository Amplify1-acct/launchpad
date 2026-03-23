"use client";

import { useState } from "react";
import styles from "./Contact.module.css";

const infoItems = [
  { icon: "⚡", label: "Response time", value: "Within 24 hours" },
  { icon: "📞", label: "Prefer to talk?", value: "Book a free 15-min call" },
  { icon: "📧", label: "Email us directly", value: "hello@launchpad.com" },
];

const industries = [
  "Retail", "Healthcare", "Real Estate",
  "Restaurants", "Legal", "Construction",
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
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
        <div className={styles.info}>
          <p className={styles.label}>Get started today</p>
          <h2 className={styles.title}>Let's build your digital presence</h2>
          <p className={styles.sub}>
            Fill out the form and we'll have a personalized plan ready for you
            within one business day.
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
          <div className={styles.trust}>
            <div className={styles.trustTitle}>Trusted by businesses in</div>
            <div className={styles.trustChips}>
              {industries.map((ind) => (
                <span key={ind} className={styles.chip}>{ind}</span>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.formWrap}>
          {submitted ? (
            <div className={styles.success}>
              <div className={styles.successIcon}>✓</div>
              <h3>You're all set!</h3>
              <p>We'll be in touch within 24 hours with your custom plan.</p>
            </div>
          ) : (
            <>
              <h3 className={styles.formTitle}>Start your free consultation</h3>
              <p className={styles.formSub}>No commitment. No credit card required.</p>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.row}>
                  <div className={styles.group}>
                    <label>First name</label>
                    <input
                      name="firstName"
                      type="text"
                      placeholder="Jane"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.group}>
                    <label>Last name</label>
                    <input
                      name="lastName"
                      type="text"
                      placeholder="Smith"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className={styles.group}>
                  <label>Business name</label>
                  <input
                    name="business"
                    type="text"
                    placeholder="Smith's Bakery"
                    value={form.business}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.group}>
                  <label>Email address</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="jane@smithsbakery.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.group}>
                  <label>What plan interests you?</label>
                  <select
                    name="plan"
                    value={form.plan}
                    onChange={handleChange}
                  >
                    <option value="">Select a plan...</option>
                    <option>Starter — $299/mo</option>
                    <option>Growth — $599/mo</option>
                    <option>Premium — $999/mo</option>
                    <option>Not sure yet</option>
                  </select>
                </div>
                <div className={styles.group}>
                  <label>Tell us about your business</label>
                  <textarea
                    name="message"
                    placeholder="What do you do, who are your customers, and what are your biggest goals online?"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>
                <button
                  type="submit"
                  className={styles.submit}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send my request →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export const metadata = { title: "Privacy Policy — Exsisto" };

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "60px 24px 120px", fontFamily: "Inter, sans-serif", color: "#1a1c1d", lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.02em" }}>Privacy Policy</h1>
      <p style={{ color: "#6b7280", marginBottom: 48 }}>Last updated: April 7, 2026</p>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>1. Introduction</h2>
        <p>Exsisto is operated by 518 Advertising, LLC ("we," "our," or "us"). We operate the digital presence platform available at exsisto.ai. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>2. Information We Collect</h2>
        <p>We collect information you provide directly to us, including:</p>
        <ul style={{ paddingLeft: 24, marginTop: 12 }}>
          <li style={{ marginBottom: 8 }}>Name, email address, and password when you create an account</li>
          <li style={{ marginBottom: 8 }}>Business information including business name, industry, city, and phone number</li>
          <li style={{ marginBottom: 8 }}>Social media account information when you connect your accounts via OAuth</li>
          <li style={{ marginBottom: 8 }}>Payment information processed securely through our payment provider</li>
          <li style={{ marginBottom: 8 }}>Content you generate, approve, or publish through our platform</li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>3. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul style={{ paddingLeft: 24, marginTop: 12 }}>
          <li style={{ marginBottom: 8 }}>Provide, operate, and maintain our platform and services</li>
          <li style={{ marginBottom: 8 }}>Generate website content, blog posts, and social media posts on your behalf</li>
          <li style={{ marginBottom: 8 }}>Publish content to your connected social media accounts at your direction</li>
          <li style={{ marginBottom: 8 }}>Send transactional emails and service notifications</li>
          <li style={{ marginBottom: 8 }}>Process payments and manage your subscription</li>
          <li style={{ marginBottom: 8 }}>Improve and personalize your experience</li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>4. Social Media Integrations</h2>
        <p>When you connect your Facebook, Instagram, or TikTok accounts, we access only the permissions you authorize. We use these permissions solely to publish content on your behalf. We do not sell or share your social media data with third parties. You can disconnect your accounts at any time from your dashboard settings.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>5. Data Sharing</h2>
        <p>We do not sell your personal information. We may share your information with:</p>
        <ul style={{ paddingLeft: 24, marginTop: 12 }}>
          <li style={{ marginBottom: 8 }}>Service providers who assist in operating our platform (hosting, payments, AI services)</li>
          <li style={{ marginBottom: 8 }}>Social media platforms when publishing content at your direction</li>
          <li style={{ marginBottom: 8 }}>Law enforcement when required by applicable law</li>
        </ul>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>6. Data Retention</h2>
        <p>We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us at privacy@exsisto.ai.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>7. User Data Deletion</h2>
        <p>You have the right to request deletion of your personal data at any time. To request deletion of your data:</p>
        <ul style={{ paddingLeft: 24, marginTop: 12 }}>
          <li style={{ marginBottom: 8 }}>Email us at <a href="mailto:privacy@exsisto.ai" style={{ color: "#6366f1" }}>privacy@exsisto.ai</a> with the subject line "Data Deletion Request"</li>
          <li style={{ marginBottom: 8 }}>Or visit your account Settings page and select "Delete Account"</li>
        </ul>
        <p style={{ marginTop: 12 }}>We will process your request within 30 days and confirm deletion via email.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>8. Security</h2>
        <p>We implement industry-standard security measures including encryption in transit (TLS), encrypted storage for sensitive tokens, and access controls. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>9. Children's Privacy</h2>
        <p>Our service is not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>10. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, please contact us at:</p>
        <p style={{ marginTop: 12 }}>
          <strong>Exsisto</strong><br/>
          Email: <a href="mailto:privacy@exsisto.ai" style={{ color: "#6366f1" }}>privacy@exsisto.ai</a><br/>
          Website: <a href="https://www.exsisto.ai" style={{ color: "#6366f1" }}>https://www.exsisto.ai</a>
        </p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Data Processors</h2>
        <p>We use the following third-party service providers (data processors) that may have access to personal data in order to provide our services:</p>
        <ul style={{ paddingLeft: 24, marginTop: 12 }}>
          <li style={{ marginBottom: 8 }}><strong>Vercel Inc.</strong> — Cloud hosting and deployment infrastructure (United States)</li>
          <li style={{ marginBottom: 8 }}><strong>Supabase Inc.</strong> — Database and authentication services (United States)</li>
          <li style={{ marginBottom: 8 }}><strong>Stripe Inc.</strong> — Payment processing (United States)</li>
          <li style={{ marginBottom: 8 }}><strong>Meta Platforms, Inc.</strong> — Social media publishing via Facebook and Instagram APIs (United States)</li>
          <li style={{ marginBottom: 8 }}><strong>Anthropic PBC</strong> — AI content generation (United States)</li>
          <li style={{ marginBottom: 8 }}><strong>Resend Inc.</strong> — Transactional email delivery (United States)</li>
        </ul>
        <p style={{ marginTop: 12 }}>Each of these processors is contractually obligated to protect your data and use it only for the purposes we specify.</p>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Contact Us</h2>
        <p>518 Advertising, LLC<br />
        Operator of Exsisto.ai<br />
        Email: <a href="mailto:privacy@exsisto.ai" style={{ color: "#4f46e5" }}>privacy@exsisto.ai</a></p>
      </section>
    </main>
  );
}

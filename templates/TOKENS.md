# Exsisto Template Token Reference

Templates use `{{token}}` placeholders that get replaced with real customer data at site generation time.

## Universal Tokens (all templates)

| Token | Description | Example |
|-------|-------------|---------|
| `{{business_name}}` | Full business name | Miller's Plumbing |
| `{{industry}}` | Industry label | Plumbing |
| `{{city}}` | City name | Chicago |
| `{{state}}` | State abbreviation | IL |
| `{{phone}}` | Formatted phone | (312) 555-0123 |
| `{{phone_raw}}` | Digits only for tel: links | 3125550123 |
| `{{email}}` | Contact email | info@millersplumbing.com |
| `{{address}}` | Street address | 123 Main St |
| `{{year}}` | Current year (auto) | 2026 |
| `{{cta}}` | Primary CTA button text | Get a Free Quote |

## Hero Tokens

| Token | Description | Example |
|-------|-------------|---------|
| `{{hero_headline}}` | Main headline (first part) | Expert Care for Your Home's |
| `{{hero_highlight}}` | Highlighted word(s) in headline | Plumbing |
| `{{hero_subheadline}}` | Hero paragraph | Licensed & insured. Serving Chicago... |
| `{{hero_image_url}}` | Hero photo URL | https://... |
| `{{hero_quote}}` | Pull quote on image overlay | Precision in every turn. |
| `{{license_text}}` | License/credential line | Master Plumber License #12345 |

## Reviews / Trust Tokens

| Token | Description | Example |
|-------|-------------|---------|
| `{{review_rating}}` | Star rating label | 5-Star |
| `{{review_count}}` | Number of reviews | 500+ |

## Emergency / Response Tokens

| Token | Description | Example |
|-------|-------------|---------|
| `{{emergency_description}}` | Emergency section paragraph | Disaster doesn't keep business hours... |
| `{{response_time}}` | Response time | 60-Minute |
| `{{response_description}}` | Response time detail | We prioritize active leaks... |
| `{{truck_description}}` | Truck/equipment detail | Our mobile units carry 90% of parts... |

## Services Tokens

| Token | Description | Example |
|-------|-------------|---------|
| `{{services_heading}}` | Services section title | Common Residential Fixes |
| `{{service_1_name}}` | Service 1 name | Complete Re-Piping |
| `{{service_1_description}}` | Service 1 description | Modernizing old plumbing... |
| `{{service_2_name}}` | Service 2 name | Leak Detection |
| `{{service_2_description}}` | Service 2 description | Non-invasive acoustic tech... |
| `{{service_3_name}}` | Service 3 name | Water Heaters |
| `{{service_3_description}}` | Service 3 description | Maintenance and installation... |
| `{{service_4_name}}` | Service 4 name | Drain Cleaning |
| `{{service_4_description}}` | Service 4 description | Hydro-jetting solutions... |

## Stats Tokens

| Token | Description | Example |
|-------|-------------|---------|
| `{{stat_1_value}}` | Stat 1 number | 20+ |
| `{{stat_1_label}}` | Stat 1 label | Years Experience |
| `{{stat_2_value}}` | Stat 2 number | 500+ |
| `{{stat_2_label}}` | Stat 2 label | Jobs Completed |
| `{{stat_3_value}}` | Stat 3 number | 24/7 |
| `{{stat_3_label}}` | Stat 3 label | Emergency Service |
| `{{stat_4_value}}` | Stat 4 number | 5★ |
| `{{stat_4_label}}` | Stat 4 label | Google Rated |

## About / Story Tokens

| Token | Description | Example |
|-------|-------------|---------|
| `{{about_label}}` | Small label above heading | Local Pride |
| `{{about_heading}}` | About section headline | Family Owned, Quality Driven |
| `{{about_description}}` | About paragraph | Started in a garage two decades ago... |
| `{{about_image_url}}` | About/team photo URL | https://... |
| `{{years_in_business}}` | Years stat | 20+ |

## Footer Tokens

| Token | Description | Example |
|-------|-------------|---------|
| `{{footer_description}}` | Footer tagline | Architectural precision in plumbing... |

---

## Templates Available

| File | Industry | Status |
|------|----------|--------|
| `plumbing.html` | Plumbing / Trades | ✅ Ready |
| `dental.html` | Dental / Medical | 🔜 Coming |
| `bakery.html` | Bakery / Restaurant | 🔜 Coming |
| `law.html` | Law Firm | 🔜 Coming |
| `financial.html` | Financial Services | 🔜 Coming |

---

## Generation Flow

1. Customer signs up and fills in business info
2. Claude selects the right template based on `industry`
3. Claude generates all token values using the Anthropic API
4. Token injection script replaces all `{{token}}` with real values
5. HTML is deployed to Vercel as the customer's live site

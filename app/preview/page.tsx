"use client";
import "./preview.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface AIContent {
  headline: string; tagline: string; subtext: string;
  services: string[];
  stat1: string; stat1Label: string;
  stat2: string; stat2Label: string;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { id: "auto",        label: "Auto",           emoji: "🚗" },
  { id: "restaurant",  label: "Restaurant",     emoji: "🍝" },
  { id: "gym",         label: "Gym & Fitness",  emoji: "💪" },
  { id: "plumbing",    label: "Plumbing",       emoji: "🔧" },
  { id: "dental",      label: "Dental",         emoji: "🦷" },
  { id: "law",         label: "Law Firm",       emoji: "⚖️" },
  { id: "salon",       label: "Salon & Beauty", emoji: "✂️" },
  { id: "realestate",  label: "Real Estate",    emoji: "🏠" },
  { id: "pet",         label: "Pet Care",       emoji: "🐾" },
  { id: "hvac",        label: "HVAC",           emoji: "❄️" },
  { id: "bakery",      label: "Bakery",         emoji: "🥐" },
  { id: "landscaping", label: "Landscaping",    emoji: "🌿" },
  { id: "other",       label: "Other",           emoji: "✏️" },
];

const BUSINESS_TYPES: Record<string, string[]> = {
  auto:        ["Classic Car Restoration","Custom Paint & Body","Auto Detailing","Engine Rebuilding","European Import Specialist","Muscle Car Specialist","Vintage Motorcycle Restoration","Hot Rod Builder","Performance Tuning Shop","Auto Upholstery"],
  restaurant:  ["Italian Restaurant","Steakhouse","Family Diner","Sushi & Japanese","Mexican Restaurant","Pizza Parlor","Seafood Restaurant","Farm-to-Table Bistro","BBQ & Smokehouse","Fine Dining"],
  gym:         ["Personal Training Studio","CrossFit Gym","Yoga & Pilates Studio","Boxing & MMA Gym","Strength & Conditioning","Women's Fitness Studio","24-Hour Gym","Martial Arts School","Spin & Cycling Studio","Athletic Performance Center"],
  plumbing:    ["Emergency Plumber","Bathroom Remodeling","Water Heater Specialist","Drain Cleaning Service","Commercial Plumbing","Pipe Repair & Replacement","Sewer Line Specialist","Gas Line Services","Water Filtration","Green Plumbing Solutions"],
  dental:      ["General Dentistry","Cosmetic Dentistry","Pediatric Dentistry","Orthodontics & Braces","Dental Implants","Emergency Dental Care","Teeth Whitening Studio","Family Dental Practice","Oral Surgery","Sleep Dentistry"],
  law:         ["Personal Injury Law","Criminal Defense","Family Law & Divorce","Estate Planning","Business & Corporate Law","Immigration Law","Real Estate Law","Workers' Compensation","DUI Defense","Medical Malpractice"],
  salon:       ["Full-Service Hair Salon","Barbershop","Color & Highlights Studio","Bridal Hair Specialist","Natural & Curly Hair","Luxury Blowout Bar","Hair Extension Studio","Men's Grooming Lounge","Kids Hair Salon","Scalp & Hair Treatment"],
  realestate:  ["Residential Sales","Luxury Home Specialist","First-Time Buyer Agent","Property Management","Commercial Real Estate","Investment Properties","New Construction Specialist","Relocation Services","Vacation & Short-Term Rental","Land & Development"],
  pet:         ["Dog Grooming Salon","Pet Boarding","Dog Daycare","Dog Training","Mobile Pet Grooming","Cat Grooming","Veterinary Clinic","Pet Sitting Service","Exotic Animal Care","Aquatic & Reptile Specialist"],
  hvac:        ["AC Installation & Repair","Heating & Furnace","Emergency HVAC Service","Duct Cleaning","Commercial HVAC","Smart Home & Thermostats","Geothermal Systems","Air Quality & Purification","Boiler Specialist","HVAC Maintenance Plans"],
  bakery:      ["Artisan Bread Bakery","Custom Cake Studio","French Pastry Shop","Wedding Cake Specialist","Gluten-Free Bakery","Cupcake & Dessert Shop","Bagel Shop","Pie Shop","Cookie & Confections","Wholesale Bakery"],
  landscaping: ["Full-Service Landscaping","Lawn Maintenance","Landscape Design","Irrigation Systems","Tree Service & Removal","Hardscaping & Patios","Snow Removal","Commercial Landscaping","Garden Design","Organic Lawn Care"],
  other:       ["Retail Shop","Photography Studio","Tutoring & Education","Event Planning","Cleaning Service","Moving Company","Catering","Consulting","Childcare / Daycare","Specialty Service"],
};

// Images from our library
const IMAGES: Record<string, string[]> = {
  auto:       ["https://lh3.googleusercontent.com/aida-public/AB6AXuB1C5DRn1V7PTWJ5C3peAzS5XRATD1-_I_V1zvK1gAruW_KPod1F9uKJNvgaA4nbvEEj0gsUIJH_31KcT9sjEFKB3A8T9mmloZFPwQxmYrtbAnR7iCHRaUqd99X8e8ULR6HvFnZUXaJRdrPYSuq1RCMCYIidiP_I-LAy5vNBBeAWgdelt5cVvKoT_Td9g5JpSPAziCXp9QpjhQljGZ9qBy6XkDafSvgYMLUR0v-kGyDDVlgZHoUZI9UV-ylA7bAX-kNnRwbB4iywO7v"],
  restaurant: ["https://lh3.googleusercontent.com/aida-public/AB6AXuCvZLqWp4vcBq3WgdR1v4lm0V-Qvv60o516WggmsiMePqV24UjlJFw76Maw2-xQL1O2uq72IMybEO73HmeNdq_YzzOpxC433PT13z6STlsJ3ILrRGais9KfUAHH4vLqpuGdI1_o4yHOifu3A1PaaS9Rr_Re6C9ijjcxZx_7z_NgyT3He22bBREJjWeMqv099xbGD716bTgOEhizQTdoMcbrUjXAO3qcbEgD7nxgAJ_VX9Hkay6pzzx4QzJX6UiB7afiA3lDzsxDPr_L","https://lh3.googleusercontent.com/aida-public/AB6AXuCNiALvKNYkWsiRoW_fZfI7deDmFw8VG03jwNmIPVtmUGJXKBvMZjd530zf1A7DIkHhc4yMj8dHlJmfYj8A9Wg4AoGNw1nw2-G_-yV9nkXlUCRE8OGHbi0EcSR_4W5EAPV-a37j9r34xsCBbwEGxLwdUKDFNS9ObR1jl4LggL4Byq0MrLzgo027a_X5tGXhShIm1LMpBxGDoPATgV8AsdXVE5YAqlVWS1kK-JNFZIKHtQc-edVWXEpVPC5f8R8tuN73_Js9JQDzCoWu"],
  gym:        ["https://lh3.googleusercontent.com/aida-public/AB6AXuDXmVVa4eIKi9cTBj0xQk_hCyO7VFXbqgW1xpTNArtzMR10-zDGFQpPVlHzEzLGP4X407w5YQyjekIxVbd5PISRUPtue4hJ1yi3i6OpGQbJIe7X5o4SC0PxbeEYzpZavi-8XAiPVUltgvLwpWSqxkyFcBi10Re1MflzKNF-83AszsmuPtxsyRJsQQd2N9D4d8GQ-NGBdp_fL7EjcIitWKAO1BTOuGhr-E_sg8id2-Mxw21kuJQ-nIKbmy7mjYpfRvGCyD2JU8pq0ELf","https://lh3.googleusercontent.com/aida-public/AB6AXuAammkUU2LRwUD8jaYXakwvODFHgqpcBGiiL4kFdvgOSUxZo12wKJOFdtnNMSXh9UGiMLl5g9b_Cf_p-jWzMfKk04138bKhQBc42CP9lYzJnKni12Z_IbsMqtSO3bdgYi7HPQzHA4U60sw0joxAAKRcJ2BBiQgNA4wXfIq01FqX7dH7hI_u7JRZIdS7wpQ3xr4bEfp9Qa8Ei-LZKqM6BHlVmGFoFHbkYWucCYo1VMSWTfFjvJoeC4bpxs3Jz4CNYAJ0hEKlDKERPNd1","https://lh3.googleusercontent.com/aida-public/AB6AXuAw_4KplwHDWnIYq9MtPzWvgzuMGwGhd6arLFWqeUXHFW3tuSJ9jqMRX-GdlutnwkZd2qIFlhKy0gsRpfjDFQfEzWZ-_2MfOJq5iSu6qG4FGxkOxtCxfVKk0F5P5M-_GpJvghEjnNoDMVG05jeWNuDQ72hecHJiCGFhG7Uk8KVnqws-1R-_zaVNPCp42rnjd6Jm3FuIAHcdVy0qWQQC7fttKPofPhOZbISU5WcgaeUz1TZ1z_bm7HTqxvvzakiCzIQQUPQEK2-h1vcg"],
  plumbing:   ["https://lh3.googleusercontent.com/aida-public/AB6AXuBLx4WzaQZniruzjEUzfNZAFP1YleKAvggn_len6ed_c4bihLu0avfrHa9ULtBo1ogCuZwXSjmGGlJ14T4mbuegnQD7RwdT9UVYy-7oE7vHI2kYIsB8B7eOZ3rlVGRTjfk5u8dur4uWOHG4CQEB7ndtLm5ft534abnjwRIfX5iSUDCdYS0Ym5uixYXqTHFiXu83sX8uAL9OAHluuySsVFF-Cg8AYYlBh1jAiI7s1mS1QUKhOO_hZ0qAC15ikjt5MClUA89gcHsqXo4q"],
  dental:     ["https://lh3.googleusercontent.com/aida-public/AB6AXuAnZsieQO3kVch-WVq6qQv4DIHNp0G1k1KByxaRmfwgs1UX58vW9FtkDrTKOVl5sO_kWGVyy3sR0BWX_12q5TcM-BI87lN1LFMHSdHtQI7pDlQ_8Z5ZE5uF5B3qjAlHLDosVbuL9t37sd1VXWHxuON3LqqbZAvyZOUsPmNNHQQcmLDKMaq-0fQXFEDPSGAJnL8PZGMBMBIFIdsoZNkSe6FDlk1SRJt4WefJJ6iPhc22fob35XmtCNKYOGJ9rXQ5PKE0TyDGUDMMDftz"],
  law:        ["https://lh3.googleusercontent.com/aida-public/AB6AXuA2bmKC-l0xAsSJpZgDVcecdYLTZCxOVeyCRR88CGcsZ-uI7Z_bL-suNkV6cEAcQ8O3a27t3JNOBScb5Wfw_YzpmlyyTAQJAlW1tMyUyS9PpfjvuziSQusEHlsMX2PSfd2ClgW9QVpxbTCJcy4jiSelqeO8kWkh5tWaINWmRtxyHasnpmWF1VomlI5jDDUZGRURNf80Q5UFVHfRyTwenMP8FXUJcZo-SGFH_iEbWK46RN_eytiiOOyHQ-UcDURSWO80kMLFnp8qe5cO"],
  salon:      ["https://lh3.googleusercontent.com/aida-public/AB6AXuDuGcJfAqWQYxJJruc0kvCg2_2j3hTIchtkFDyayMxxqmZIODZNtK","https://lh3.googleusercontent.com/aida-public/AB6AXuCt8eqJoO0SDBwjwtyqlHO5EV-Z9zcmbuY0YdgWDoK","https://lh3.googleusercontent.com/aida-public/AB6AXuAzbt-KvFGXzPD18-D1OLreiXiZ3rQYqDfVZgYm4fY"],
  realestate: ["https://lh3.googleusercontent.com/aida-public/AB6AXuDGTPjhpEEgeVyvIzI98rWuhnE3IutU3zbdSg-CS7N-HUjn-ju9WtKHVpuK3TFHRTyxmqzj8RL2PT2ZxW4I-dfKBxN9mJa636mwi2GZAfd_gVXcGY50vyxMI1fylMyqqYGgjUmUEPH8OlGV9kdi-8GHWStXFF7oshPRVn_KHkEFC_P0pCmWaJHmDdWBnpJHi_UyJsbaE50pvH17nwK2Incu-ZdbPU7C8yjrrbv4BdzGjTZYIP3u-Gs9qY9aBFMoUJn-KuP4BcInfQkg","https://lh3.googleusercontent.com/aida-public/AB6AXuDvYIZryBCbR6HZuapKt-IdeyNMSM1SnFr3bNgqHiyV2KY-xAZozEdFYpsXSI_RUpTI6xOPVmy77nti4XJ-hAWVSvuszsSCDho5caB3yznlUV7TNJ8nS_Lw3KeASHp0nhmbtE5MHN8MEknS2o4h-k__Ffn7fyKs7NS7qjd3ahIpTJlmD_6DCuMX_2aIPiUrKJEgH3kxZarL7YCpDoyvMXbgslfgqsVYMU5IOUHB-foUPMtmM2OLtX9b9xrP-QCuhrSYF2ZphLaTu95a","https://lh3.googleusercontent.com/aida-public/AB6AXuAB35rkEC4mDZDR_x8_1qloNGZYZY-ojQiGBMA_MoUMt54iXM-4me_wbbkW_jaROIjh2eXnRYnUrYxRwlhYi7LCuuS6ckVCmdcS5Qw7I8u0z4jUP4yik1WsaQFhUUQ2tl8DEWLPmYomEaVyCj2nRhfDv-Gdoc33de-VIajRkXp6UtbHrVdJv47mAlGj98NpR3vUdmA4V6h-2BZt1nzoteZwDYLlpSGajuWvwDBp4yWLZsr5sVFbhY3E_feGb8NtKQwkYvaKVpqYQvDu"],
  pet:        ["https://lh3.googleusercontent.com/aida-public/AB6AXuAakjrronShuhDi9C1NBElTHzyP3VMzJ9G5Dctjcl92TxRxYkyFiZOPO8yrf9V-eT2J6xmdWJ79cKZz7ZmwBXATymwPf4PxgiUHfCidSgGAK_tkyDTrQhF7Jd2eS7Q63P-FvX-XxCNENgIURqu-7veVfS-TUUcGqcglUXT2szDd_EZy2DPCgMt8jMgGFLtR_L5eYJvAM2PXfKZBsZ-UuUdqQswfyBsCmhZHDMRfGjw5mbNHyKCVbpVV9yEk9kHH5jSHnXW7jp4jEzOi","https://lh3.googleusercontent.com/aida-public/AB6AXuBTK0wTaoSltYZLeQD3X5AUR3gKf8RI7b6hecV2pEiBwVjrIHAXaUoAS6m6W7Qq545KCPN_s8D0YmqUMCpA-urpF2jLcztb9EkqHtXZIHWPhEbAgBTiFBipOazgn5D7J6a6YqV7P7iWqiHs839dONkBjHM6_C2CFV5uiMZwPjVqI-IJqUe_cOBkOI9xPCaQI15e6BOGf5Ai2xQAyozfcYFqnXoefm_C0S1MgmqnEcFhspUWMtzVj1XSbEXJNuMWuATpt36yowjGiJn0"],
  hvac:       ["https://lh3.googleusercontent.com/aida-public/AB6AXuCJrlkie16uVtFbV6_FAmWBgX5BGTEyUNyBq_lFZscmNGnkGrTVVXrO0IXStJXQWGI6itzZWubrhF1q_YTfyRbLBVusaQJAB1K-Aj2XmG3zTJL6jk_8GXSsoZAvsklJBpokDxVQeRRGmz0jHJef3CxtxjsiJy5AZwZuMUDUpfShNxYb2_aPlFpIImIwSbb44v1Dg838ppf5P4T_9TcGiX6o9711_y-wfyTgwRZNO1iwmD9K2B5ygSzzkKzsuIfWq1vwtPi88BE_hvdv","https://lh3.googleusercontent.com/aida-public/AB6AXuD8GBkkRx8ALxrDMnQichwC0-t8NYrb6k3SLuZOuEcj2yd67FtLT24KP-Dtz46ZhSan8qXGaHcJD-UUyA5HIVJ8gXxjLVlhDK-T9cf73FU9aCRgwBeBNY28WzbjyIx6Ox4V9nsL8Oe0Ju2D8kcopf7tzuLdfuHxt0AChKAmyGJRc1njodsW3D-gWQKU3lDKYZNe7CYhmu_wOIzGskJQp098e2F_DHcRUiXMGZOFbqMGveavHhgLIoe7ErJ50Gk1G5mNdp9NC791XeA1"],
  bakery:     ["https://lh3.googleusercontent.com/aida-public/AB6AXuCvZLqWp4vcBq3WgdR1v4lm0V-Qvv60o516WggmsiMePqV24UjlJFw76Maw2-xQL1O2uq72IMybEO73HmeNdq_YzzOpxC433PT13z6STlsJ3ILrRGais9KfUAHH4vLqpuGdI1_o4yHOifu3A1PaaS9Rr_Re6C9ijjcxZx_7z_NgyT3He22bBREJjWeMqv099xbGD716bTgOEhizQTdoMcbrUjXAO3qcbEgD7nxgAJ_VX9Hkay6pzzx4QzJX6UiB7afiA3lDzsxDPr_L"],
  landscaping:["https://lh3.googleusercontent.com/aida-public/AB6AXuBLx4WzaQZniruzjEUzfNZAFP1YleKAvggn_len6ed_c4bihLu0avfrHa9ULtBo1ogCuZwXSjmGGlJ14T4mbuegnQD7RwdT9UVYy-7oE7vHI2kYIsB8B7eOZ3rlVGRTjfk5u8dur4uWOHG4CQEB7ndtLm5ft534abnjwRIfX5iSUDCdYS0Ym5uixYXqTHFiXu83sX8uAL9OAHluuySsVFF-Cg8AYYlBh1jAiI7s1mS1QUKhOO_hZ0qAC15ikjt5MClUA89gcHsqXo4q"],
  other:      ["https://lh3.googleusercontent.com/aida/ADBb0uj5QlO4hvuzgWKH1QZvg1npiAvGwRAgLKkYFbuuROvRTbsr6Z7ofr9TXaZhxP7CLQl1_6lIminQuE7xS7mrPjkvQ2KgGiwbZGu8ItVG4T1kNNhXstBKnKu6gVFyAVEcfn5ZGa9W14ovi0OANPcFu9j4UXLzisA2172nmjgGh7HMj3bsUFzlsmSfAJNWBUHiaPoCdvbqF6Yn80J5LaO9xrLY5TM4-MLdpvb7vfU21mwZTnCAAopel-qjbuD8","https://lh3.googleusercontent.com/aida/ADBb0ugfWjKNK6Pwmaq-gXD4xXs_CGuE94eTYHDSHQjnY9nGQQn89wnxo5xPzaZdZbpJkWCROAPHWJNRfeGGlD94JKLWmC6tiJ44rnmaw47I58DUq_WTyTXvyiPI2PLzMJDEc3ZmCmBUJvoR0WBWyL7dfo9hAOy41WAefhpCYvembOjEk2QoknlygxijCReYYnGIJeXfHHGHP2JpGiOA_YqJexfo3ja_2jS6gxtswx9GwPJlwXQ0JwvF0Myzie8","https://lh3.googleusercontent.com/aida/ADBb0ugP34Hr3rnEMDmFccI888ZnLQjTvff-ymSkgxt5Gx0_U66koayfzkPHGIoE1zSXVE4qqjSPlV2AY7D6OaUn-cLV6aVGTCtk_xsFpmhszSUB0O0NIZEg1yQI6KqWK75GYhsaBCObs0JzZF0PSo-mZed87gUdvNDCh8XwKk91Lo2qcs3UKq8ME9a3PQ7yxP9o94K7TI_RyaRqSmwkP_dJZxOSsFniT0v2E3WcvquqSnCBvvfStVaW5PPU7mk","https://lh3.googleusercontent.com/aida/ADBb0uiSI3y7PzcUwJAu92Ok3NhXJ0sVhMtplNk5i9foYVKJIzSRcjJBosQykFQCdZs5G7J0jeYRfx5iqDVk2Fj7SsJ2Ztl_UK4NjT3I-RzaUTa3KR9Iwa-hftwjy08B010bVdNMU0YLLoMhNS9MGYZwmTxoWIsUTb3nTSkPKJhgkxAhHu1EbDycTgKsGCkzG9RrmxKdEvgE_w8f2PvyhGEVpjG80EWzxqR04U77-pY1YUJjBwJiJXwuU-SfKDk"],
};

const TEMPLATE_IDS: Record<string, string> = {
  auto: "auto", restaurant: "restaurant", gym: "gym", plumbing: "plumbing",
  dental: "dental", law: "law", salon: "salon", realestate: "realestate",
  pet: "pet", hvac: "hvac", bakery: "restaurant", landscaping: "plumbing",
};

const PLANS = [
  { id: "starter", name: "Starter", price: "$99", period: "/mo", images: 1,
    badge: "Simple & Clean",
    features: ["5-page website","1 AI image","2 blogs/mo","8 social posts/mo","On-page SEO"] },
  { id: "pro", name: "Pro", price: "$299", period: "/mo", images: 3, popular: true,
    badge: "Stitch AI Design",
    features: ["Full Stitch AI template","3 AI images","4 blogs/mo","16 social posts/mo","Advanced SEO","Gallery + stats"] },
  { id: "premium", name: "Premium", price: "$599", period: "/mo", images: 6,
    badge: "Stitch AI + More",
    features: ["Full Stitch AI template","6 AI images","8 blogs/mo","32 social posts/mo","Priority support","Before/after gallery"] },
];

// ─── PLACEHOLDER HTML ─────────────────────────────────────────────────────────
const PLACEHOLDER_IMG_HTML = `<div style="width:100%;height:100%;min-height:500px;
  background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e40af 100%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  color:rgba(255,255,255,0.9);font-family:Inter,sans-serif;text-align:center;padding:48px;">
  <div style="font-size:48px;margin-bottom:18px;">📸</div>
  <div style="font-size:18px;font-weight:800;margin-bottom:10px;">Your Custom Photos Go Here</div>
  <div style="font-size:13px;line-height:1.8;max-width:240px;opacity:0.75;margin-bottom:20px;">
    AI-generated photos tailored to your specific business — created when you sign up
  </div>
  <div style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);
    border-radius:100px;padding:8px 20px;font-size:11px;font-weight:700;letter-spacing:0.5px;">
    ✦ Included with every plan
  </div>
</div>`;

const PLACEHOLDER_CARD = (n: number) => `<div style="width:100%;height:240px;
  background:linear-gradient(135deg,#1e1b4b ${n*12}%,#312e81 ${40+n*8}%,#1e40af 100%);
  border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;
  color:rgba(255,255,255,0.8);gap:8px;font-family:Inter,sans-serif;">
  <span style="font-size:24px;">📸</span>
  <span style="font-size:12px;font-weight:700;">Your Photo ${n}</span>
</div>`;

// ─── SITE BUILDER (hand-coded layouts) ───────────────────────────────────────
function buildStarterSite(bizType: string, industry: string, city: string, phone: string, ai: AIContent): string {
  const imgs = IMAGES[industry] || [];
  const hero = imgs[0] || "";
  const heroEl = hero
    ? `<img src="${hero}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentNode.innerHTML='${PLACEHOLDER_IMG_HTML.replace(/`/g,"'")}'" />`
    : PLACEHOLDER_IMG_HTML;
  const svcs = ai.services.slice(0, 6);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;color:#111;background:#fff;}
nav{padding:18px 48px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0f0f0;background:#fff;}
.logo{font-size:18px;font-weight:900;}.cta-btn{background:#111;color:#fff;padding:10px 22px;border-radius:8px;font-size:13px;font-weight:700;}
.hero{position:relative;height:88vh;overflow:hidden;background:#1a1a2e;}
.hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,0.80) 55%,rgba(0,0,0,0.1));}
.hero-content{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 72px;}
.tag{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.5);margin-bottom:16px;}
h1{font-size:52px;font-weight:900;color:#fff;line-height:1.05;letter-spacing:-2px;max-width:560px;margin-bottom:18px;}
.sub{font-size:16px;color:rgba(255,255,255,0.7);max-width:460px;line-height:1.75;margin-bottom:28px;}
.btns{display:flex;gap:12px;}.btn-w{background:#fff;color:#111;padding:13px 26px;border-radius:8px;font-size:14px;font-weight:700;}
.btn-g{border:2px solid rgba(255,255,255,0.3);color:#fff;padding:13px 22px;border-radius:8px;font-size:14px;font-weight:600;}
.services{padding:64px 72px;background:#f9f9f9;}
.sec-tag{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:8px;}
.sec-h{font-size:28px;font-weight:800;letter-spacing:-0.5px;margin-bottom:32px;}
.svc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.svc{background:#fff;border-radius:10px;padding:22px;border:1px solid #f0f0f0;}
.svc-dot{width:8px;height:8px;background:#111;border-radius:50%;margin-bottom:12px;}
.svc-n{font-size:14px;font-weight:700;}.svc-p{font-size:12px;color:#888;margin-top:4px;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);background:#111;}
.stat{padding:28px;text-align:center;border-right:1px solid rgba(255,255,255,0.08);}
.stat-n{font-size:26px;font-weight:900;color:#fff;}.stat-l{font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;text-transform:uppercase;letter-spacing:1px;}
.cta-sec{padding:52px 72px;display:flex;justify-content:space-between;align-items:center;background:#fff;border-top:1px solid #f0f0f0;}
.cta-sec h2{font-size:24px;font-weight:800;}.cta-sec p{font-size:13px;color:#888;margin-top:4px;}
.cta-ph{background:#111;color:#fff;padding:13px 26px;border-radius:8px;font-size:15px;font-weight:800;}
footer{padding:20px 72px;background:#f5f5f5;display:flex;justify-content:space-between;font-size:11px;color:#999;}
.powered{color:#6366f1;font-weight:700;}
</style></head><body>
<nav><div class="logo">${bizType}</div><div class="cta-btn">${phone || "Call Us"}</div></nav>
<div class="hero">
  <div style="position:absolute;inset:0;">${heroEl}</div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="tag">${city} · ${bizType}</div>
    <h1>${ai.headline}</h1>
    <p class="sub">${ai.subtext}</p>
    <div class="btns"><div class="btn-w">Get Free Estimate →</div><div class="btn-g">Our Services</div></div>
  </div>
</div>
<section class="services">
  <div class="sec-tag">What We Offer</div>
  <h2 class="sec-h">${ai.services.length > 0 ? "Our Services" : "How We Help"}</h2>
  <div class="svc-grid">
    ${svcs.map(s => `<div class="svc"><div class="svc-dot"></div><div class="svc-n">${s}</div></div>`).join("")}
  </div>
</section>
<div class="stats">
  <div class="stat"><div class="stat-n">${ai.stat1}</div><div class="stat-l">${ai.stat1Label}</div></div>
  <div class="stat"><div class="stat-n">${ai.stat2}</div><div class="stat-l">${ai.stat2Label}</div></div>
  <div class="stat"><div class="stat-n">4.9★</div><div class="stat-l">Rating</div></div>
  <div class="stat"><div class="stat-n">Free</div><div class="stat-l">Estimates</div></div>
</div>
<section class="cta-sec">
  <div><h2>Ready to get started?</h2><p>${bizType} · ${city} · Licensed & Insured</p></div>
  <div class="cta-ph">${phone || "Contact Us"}</div>
</section>
<footer><span>${bizType} · ${city}</span><span>Powered by <span class="powered">Exsisto Starter</span> · $99/mo</span></footer>
</body></html>`;
}

function buildProSite(bizType: string, industry: string, city: string, phone: string, ai: AIContent): string {
  const imgs = IMAGES[industry] || [];
  const [hero, card1, card2] = [imgs[0]||"", imgs[1]||imgs[0]||"", imgs[2]||imgs[0]||""];
  const hasImgs = imgs.length > 0;
  const heroEl = hasImgs
    ? `<img src="${hero}" style="width:100%;height:100%;object-fit:cover;min-height:500px;" onerror="this.style.background='#eee';this.removeAttribute('src')"/>`
    : PLACEHOLDER_IMG_HTML;
  const svcs = ai.services.slice(0, 6);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;color:#111;background:#fff;}
nav{padding:18px 56px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0f0f0;background:#fff;}
.logo{font-size:18px;font-weight:900;letter-spacing:-0.5px;}
.nav-links{display:flex;gap:24px;align-items:center;}.nav-links a{font-size:13px;font-weight:500;color:#666;text-decoration:none;}
.cta-btn{background:#111;color:#fff;padding:10px 22px;border-radius:8px;font-size:13px;font-weight:700;}
.hero{display:grid;grid-template-columns:45% 55%;min-height:88vh;}
.hero-left{padding:80px 56px;display:flex;flex-direction:column;justify-content:center;}
.tag{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:#999;margin-bottom:18px;}
h1{font-size:46px;font-weight:900;line-height:1.05;letter-spacing:-2px;margin-bottom:16px;}
.sub{font-size:15px;color:#555;line-height:1.8;margin-bottom:24px;max-width:400px;}
.stats-row{display:flex;gap:20px;padding:16px 20px;background:#f9f9f9;border-radius:10px;margin-bottom:28px;}
.stat-n{font-size:20px;font-weight:900;}.stat-l{font-size:10px;color:#999;margin-top:2px;text-transform:uppercase;letter-spacing:1px;}
.btns{display:flex;gap:10px;}
.btn-d{background:#111;color:#fff;padding:13px 26px;border-radius:8px;font-size:14px;font-weight:700;}
.btn-o{border:2px solid #e5e5e5;color:#333;padding:13px 20px;border-radius:8px;font-size:14px;font-weight:600;}
.hero-right{position:relative;overflow:hidden;}
.badge{position:absolute;bottom:24px;left:24px;background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);padding:14px 18px;border-radius:10px;}
.badge-n{font-size:20px;font-weight:900;}.badge-l{font-size:10px;color:#999;margin-top:2px;}
.services{padding:64px 56px;background:#f9f9f9;}
.sec-tag{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:8px;}
.sec-h{font-size:28px;font-weight:800;letter-spacing:-0.5px;margin-bottom:32px;}
.svc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.svc{background:#fff;border-radius:10px;padding:20px;}
.svc-dot{width:8px;height:8px;background:#111;border-radius:50%;margin-bottom:10px;}
.svc-n{font-size:13px;font-weight:700;}
.gallery{padding:64px 56px;}
.gal-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin-top:24px;}
.gal-grid img,.gal-card{width:100%;height:240px;object-fit:cover;border-radius:10px;background:#eee;display:block;}
.testimonials{padding:56px 56px;background:#f9f9f9;}
.t-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px;}
.t{background:#fff;border-radius:10px;padding:22px;}
.t p{font-size:13px;color:#444;line-height:1.8;font-style:italic;margin-bottom:12px;}
.t-name{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;}
.cta-sec{background:#111;padding:52px 56px;display:flex;justify-content:space-between;align-items:center;}
.cta-sec h2{font-size:24px;font-weight:800;color:#fff;}
.cta-sec p{font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;}
.cta-ph{background:#fff;color:#111;padding:13px 26px;border-radius:8px;font-size:15px;font-weight:800;}
footer{padding:20px 56px;background:#f0f0f0;display:flex;justify-content:space-between;font-size:11px;color:#999;}
.powered{color:#6366f1;font-weight:700;}
</style></head><body>
<nav>
  <div class="logo">${bizType}</div>
  <div class="nav-links"><a href="#">Services</a><a href="#">Gallery</a><a href="#">About</a></div>
  <div class="cta-btn">${phone || "Call Now"}</div>
</nav>
<div class="hero">
  <div class="hero-left">
    <div class="tag">${city}</div>
    <h1>${ai.headline}</h1>
    <p class="sub">${ai.subtext}</p>
    <div class="stats-row">
      <div><div class="stat-n">${ai.stat1}</div><div class="stat-l">${ai.stat1Label}</div></div>
      <div><div class="stat-n">${ai.stat2}</div><div class="stat-l">${ai.stat2Label}</div></div>
      <div><div class="stat-n">4.9★</div><div class="stat-l">Rating</div></div>
      <div><div class="stat-n">Free</div><div class="stat-l">Estimate</div></div>
    </div>
    <div class="btns"><div class="btn-d">Get Free Estimate →</div><div class="btn-o">View Our Work</div></div>
  </div>
  <div class="hero-right">
    ${heroEl}
    <div class="badge"><div class="badge-n">★ 4.9</div><div class="badge-l">200+ Reviews</div></div>
  </div>
</div>
<section class="services">
  <div class="sec-tag">What We Offer</div>
  <h2 class="sec-h">Our Services</h2>
  <div class="svc-grid">
    ${svcs.map(s => `<div class="svc"><div class="svc-dot"></div><div class="svc-n">${s}</div></div>`).join("")}
  </div>
</section>
<section class="gallery">
  <div class="sec-tag">Our Work</div>
  <h2 class="sec-h">See the Results</h2>
  <div class="gal-grid">
    ${hasImgs ? `<img src="${hero}" onerror="this.style.background='#ddd';this.removeAttribute('src')"/>` : PLACEHOLDER_CARD(1)}
    ${hasImgs ? `<img src="${card1}" onerror="this.style.background='#ddd';this.removeAttribute('src')"/>` : PLACEHOLDER_CARD(2)}
    ${hasImgs ? `<img src="${card2}" onerror="this.style.background='#ddd';this.removeAttribute('src')"/>` : PLACEHOLDER_CARD(3)}
  </div>
</section>
<section class="testimonials">
  <div class="sec-tag">Reviews</div>
  <h2 class="sec-h">What Clients Say</h2>
  <div class="t-grid">
    <div class="t"><p>"Absolutely incredible — exceeded every expectation."</p><div class="t-name">Sarah J.</div></div>
    <div class="t"><p>"Fast, professional, and fairly priced. Highly recommend."</p><div class="t-name">Michael R.</div></div>
    <div class="t"><p>"On time, clean, and thorough. Will use again."</p><div class="t-name">Elena V.</div></div>
  </div>
</section>
<section class="cta-sec">
  <div><h2>Ready to get started?</h2><p>${bizType} · ${city} · Free estimates · Licensed & insured</p></div>
  <div class="cta-ph">${phone || "Contact Us"}</div>
</section>
<footer><span>${bizType} · ${city}</span><span>Powered by <span class="powered">Exsisto Pro</span> · $299/mo</span></footer>
</body></html>`;
}


function buildPremiumSite(bizType: string, industry: string, city: string, phone: string, ai: AIContent): string {
  const imgs = IMAGES[industry] || IMAGES["other"] || [];
  const [img1, img2, img3] = [imgs[0]||"", imgs[1]||imgs[0]||"", imgs[2]||imgs[0]||""];
  const svcs = ai.services.slice(0, 6);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;background:#0a0a14;color:#fff;}
nav{padding:20px 56px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(10,10,20,0.96);backdrop-filter:blur(12px);}
.logo{font-size:18px;font-weight:900;background:linear-gradient(135deg,#a78bfa,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.nav-links{display:flex;gap:28px;}.nav-links a{font-size:13px;color:rgba(255,255,255,0.5);text-decoration:none;}
.nav-cta{background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;padding:10px 22px;border-radius:8px;font-size:13px;font-weight:700;}
.hero{display:grid;grid-template-columns:1fr 1fr;min-height:88vh;}
.hero-left{padding:80px 56px;display:flex;flex-direction:column;justify-content:center;}
.tag{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:#6366f1;margin-bottom:20px;display:flex;align-items:center;gap:8px;}
.tag::before{content:'';width:20px;height:1px;background:#6366f1;}
h1{font-size:48px;font-weight:900;line-height:1.05;letter-spacing:-2px;margin-bottom:18px;background:linear-gradient(135deg,#fff 60%,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.sub{font-size:16px;color:rgba(255,255,255,0.6);line-height:1.8;margin-bottom:28px;max-width:420px;}
.stats{display:flex;gap:20px;padding:18px 22px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:28px;}
.stat-n{font-size:20px;font-weight:900;color:#a78bfa;}.stat-l{font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;margin-top:2px;}
.btns{display:flex;gap:12px;}
.btn-p{background:linear-gradient(135deg,#6366f1,#818cf8);color:#fff;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:700;}
.btn-s{border:1.5px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.8);padding:14px 22px;border-radius:8px;font-size:14px;}
.hero-right{position:relative;overflow:hidden;}
.hero-right img{width:100%;height:100%;object-fit:cover;min-height:500px;}
.hero-badge{position:absolute;bottom:24px;left:24px;background:rgba(10,10,20,0.9);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.1);padding:14px 18px;border-radius:10px;}
.badge-n{font-size:18px;font-weight:900;color:#a78bfa;}.badge-l{font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;margin-top:2px;}
.services{padding:64px 56px;background:#0d0d1a;}
.sec-eyebrow{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#6366f1;margin-bottom:8px;}
.sec-h{font-size:28px;font-weight:800;letter-spacing:-0.5px;margin-bottom:28px;background:linear-gradient(135deg,#fff,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.svc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.svc{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:22px;}
.svc-dot{width:30px;height:30px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:8px;margin-bottom:12px;}
.svc-n{font-size:14px;font-weight:700;color:#fff;}
.gallery{padding:64px 56px;background:#0a0a14;}
.gal-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:24px;}
.gal-grid img{width:100%;height:220px;object-fit:cover;border-radius:10px;background:#1a1a2e;}
.cta{padding:56px;background:linear-gradient(135deg,#1e1b4b,#312e81);text-align:center;}
.cta h2{font-size:32px;font-weight:900;letter-spacing:-1px;margin-bottom:10px;}
.cta p{font-size:15px;color:rgba(255,255,255,0.65);margin-bottom:24px;}
.cta-btn{background:#fff;color:#312e81;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:800;display:inline-block;}
footer{padding:22px 56px;background:#050509;display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.25);}
.powered{color:#6366f1;font-weight:700;}
</style></head><body>
<nav>
  <div class="logo">${bizType}</div>
  <div class="nav-links"><a href="#">Services</a><a href="#">Work</a><a href="#">About</a></div>
  <div class="nav-cta">${phone || "Contact Us"}</div>
</nav>
<div class="hero">
  <div class="hero-left">
    <div class="tag">${city || "Your City"}</div>
    <h1>${ai.headline}</h1>
    <p class="sub">${ai.subtext}</p>
    <div class="stats">
      <div><div class="stat-n">${ai.stat1}</div><div class="stat-l">${ai.stat1Label}</div></div>
      <div><div class="stat-n">${ai.stat2}</div><div class="stat-l">${ai.stat2Label}</div></div>
      <div><div class="stat-n">4.9★</div><div class="stat-l">Rating</div></div>
    </div>
    <div class="btns"><div class="btn-p">Get Started →</div><div class="btn-s">View Our Work</div></div>
  </div>
  <div class="hero-right">
    <img src="${img1}" onerror="this.style.background='#1a1a2e';this.removeAttribute('src')"/>
    <div class="hero-badge"><div class="badge-n">★ 4.9</div><div class="badge-l">Top Rated</div></div>
  </div>
</div>
<section class="services">
  <div class="sec-eyebrow">What We Offer</div>
  <h2 class="sec-h">Our Services</h2>
  <div class="svc-grid">
    ${svcs.map((s: string) => `<div class="svc"><div class="svc-dot"></div><div class="svc-n">${s}</div></div>`).join("")}
  </div>
</section>
<section class="gallery">
  <div class="sec-eyebrow">Our Work</div>
  <h2 class="sec-h">See the Results</h2>
  <div class="gal-grid">
    <img src="${img1}" onerror="this.style.background='#1a1a2e';this.removeAttribute('src')"/>
    <img src="${img2}" onerror="this.style.background='#1a1a2e';this.removeAttribute('src')"/>
    <img src="${img3}" onerror="this.style.background='#1a1a2e';this.removeAttribute('src')"/>
  </div>
</section>
<section class="cta">
  <h2>Ready to work together?</h2>
  <p>${bizType} · ${city || "Your City"} · Premium service guaranteed</p>
  <div class="cta-btn">${phone || "Contact Us Today"}</div>
</section>
<footer>
  <span>${bizType} · ${city || "Your City"}</span>
  <span>Powered by <span class="powered">Exsisto Premium</span> · $599/mo</span>
</footer>
</body></html>`;
}

// ─── STEP BAR ─────────────────────────────────────────────────────────────────
function StepBar({ step }: { step: number }) {
  const steps = ["Industry", "Business Type", "Your Site", "Sign Up"];
  return (
    <div className="step-bar">
      {steps.map((s, i) => (
        <div key={i} className={`step-item ${i < step ? "done" : i === step ? "active" : ""}`}>
          <div className="step-circle">{i < step ? "✓" : i + 1}</div>
          <span className="step-label">{s}</span>
          {i < steps.length - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  );
}

// ─── STEP 1: INDUSTRY ────────────────────────────────────────────────────────
function StepIndustry({ onNext }: { onNext: (id: string) => void }) {
  return (
    <div className="step-content">
      <div className="step-header">
        <h2>What kind of business do you run?</h2>
        <p>Pick your industry to get started</p>
      </div>
      <div className="industry-grid">
        {INDUSTRIES.map(ind => (
          <button key={ind.id} className="industry-btn" onClick={() => onNext(ind.id)}>
            <span className="industry-emoji">{ind.emoji}</span>
            <span className="industry-label">{ind.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── STEP 2: BUSINESS TYPE ───────────────────────────────────────────────────
function StepBizType({ industry, onNext, onBack }: {
  industry: string;
  onNext: (bizType: string) => void;
  onBack: () => void;
}) {
  const ind = INDUSTRIES.find(i => i.id === industry);
  const types = BUSINESS_TYPES[industry] || [];
  const [customType, setCustomType] = useState("");
  const [error, setError] = useState("");

  // "Other" industry gets a full write-in experience
  if (industry === "other") {
    return (
      <div className="step-content">
        <div className="step-header">
          <h2>✏️ Describe your business</h2>
          <p>Tell us what you do — our AI will build your entire site around it</p>
        </div>
        <div className="other-writein">
          <div className="writein-examples">
            <div className="writein-example-label">Examples</div>
            <div className="writein-example-chips">
              {["Candy Shop","Wedding Photography","Dog Training","Music School","Tattoo Studio","Food Truck","Wine Bar","Escape Room","Yoga Retreat","Art Gallery"].map(ex => (
                <button key={ex} className="example-chip" onClick={() => setCustomType(ex)}>{ex}</button>
              ))}
            </div>
          </div>
          <div className="form-group" style={{marginTop:"20px"}}>
            <label>Your Business Type *</label>
            <input
              className="form-input form-input-lg"
              type="text"
              placeholder="e.g. Artisan Candy Shop, Wedding Photographer, Dog Trainer..."
              value={customType}
              onChange={e => { setCustomType(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleOtherNext()}
              autoFocus
            />
            <div className="field-hint">Be specific — the more detail, the better your AI-built site</div>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <div className="step-actions">
            <button className="btn-ghost" onClick={onBack}>← Back</button>
            <button className="btn-primary btn-lg" onClick={handleOtherNext}>
              Build My Site →
            </button>
          </div>
        </div>
      </div>
    );
  }

  function handleOtherNext() {
    if (!customType.trim()) return setError("Please describe your business type");
    onNext(customType.trim());
  }

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>{ind?.emoji} What best describes your business?</h2>
        <p>Pick the closest match — we'll tailor your site to it</p>
      </div>
      <div className="biztype-grid">
        {types.map(t => (
          <button key={t} className="biztype-btn" onClick={() => onNext(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="step-actions">
        <button className="btn-ghost" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

// ─── STEP 3: SITE PREVIEW + COLLECT BASIC INFO ────────────────────────────────
function StepSite({ industry, bizType, onNext, onBack }: {
  industry: string;
  bizType: string;
  onNext: (city: string, phone: string, email: string, planId: string) => void;
  onBack: () => void;
}) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [ai, setAI] = useState<AIContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState("");

  const templateId = TEMPLATE_IDS[industry] || "auto";
  const stitchUrl = `https://www.exsisto.ai/stitch-templates/${templateId}.html`;

  // Generate AI content immediately on mount
  useEffect(() => {
    generateContent();
  }, []);

  async function generateContent() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-preview-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, bizType, city: city || "your city", isOther: industry === "other" }),
      });
      const data = await res.json();
      setAI(data);
    } catch {
      setAI({
        headline: `${bizType} — Trusted Professionals`,
        tagline: "Quality service you can count on.",
        subtext: "Professional service delivered with care and expertise.",
        services: (BUSINESS_TYPES[industry] || []).slice(0, 6),
        stat1: "15+", stat1Label: "Years Experience",
        stat2: "500+", stat2Label: "Happy Clients",
      });
    }
    setLoading(false);
  }

  const plan = PLANS.find(p => p.id === selectedPlan) || PLANS[1];

  // Build preview HTML using selected plan
  const isOther = industry === "other";
  const previewHTML = !loading && ai
    ? (selectedPlan === "starter"
        ? buildStarterSite(bizType, industry, city || "Your City", phone || "Call Us", ai)
        : selectedPlan === "pro"
          ? buildProSite(bizType, industry, city || "Your City", phone || "Call Us", ai)
          : buildPremiumSite(bizType, industry, city || "Your City", phone || "Call Us", ai))
    : null;

  function handleNext() {
    if (!city.trim()) return setError("Please enter your city");
    if (!email.trim() || !email.includes("@")) return setError("Please enter a valid email");
    setError("");
    onNext(city, phone, email, selectedPlan);
  }

  return (
    <div className="step-content step-wide">
      <div className="step-header">
        <h2>
          {loading ? "✦ Your site is being born…" : "Here's your site"}
        </h2>
        <p>{loading ? "Please be patient — our AI is magically building your website" : `${bizType} · ${city || "Your City"} · Powered by Exsisto AI`}</p>
      </div>

      {/* 2-col layout: preview left, config right */}
      <div className="site-layout">

        {/* LEFT: Preview */}
        <div className="preview-col">
          {/* Plan tabs */}
          <div className="plan-tabs">
            {PLANS.map(p => (
              <button key={p.id}
                className={`plan-tab ${selectedPlan === p.id ? "active" : ""}`}
                onClick={() => setSelectedPlan(p.id)}>
                {p.name} <span className="plan-tab-price">{p.price}/mo</span>
              </button>
            ))}
          </div>

          {/* Preview window */}
          <div className="preview-window">
            {loading ? (
              <div className="preview-loading">
                <div className="loading-spinner" />
                <div className="loading-title">Please be patient while our AI is<br/>magically building your website ✦</div>
                <div className="loading-sub">Writing your headlines, copy, and services…</div>
              </div>
            ) : selectedPlan === "premium" ? (
              <iframe
                src={isOther ? undefined : stitchUrl}
                srcDoc={isOther && previewHTML ? previewHTML : undefined}
                className="preview-iframe" title="Premium preview" />
            ) : previewHTML ? (
              <iframe srcDoc={previewHTML} className="preview-iframe" title="Site preview" />
            ) : null}

            <button className="expand-btn" onClick={() => setFullscreen(true)}>⤢ Expand</button>
          </div>

          {/* Refresh photos button */}
          <button className="refresh-btn" onClick={generateContent} disabled={loading}>
            {loading ? "Generating…" : "🔄 Refresh Content"}
          </button>
        </div>

        {/* RIGHT: Config */}
        <div className="config-col">
          <div className="config-section">
            <div className="config-label">Your Details</div>
            <div className="form-group">
              <label>City *</label>
              <input className="form-input" type="text" placeholder="e.g. Westfield"
                value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-input" type="tel" placeholder="(908) 555-0100"
                value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input className="form-input" type="email" placeholder="you@yourbusiness.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="config-section">
            <div className="config-label">Your Plan</div>
            {PLANS.map(p => (
              <div key={p.id}
                className={`plan-option ${selectedPlan === p.id ? "selected" : ""}`}
                onClick={() => setSelectedPlan(p.id)}>
                {p.popular && <div className="plan-option-popular">Most Popular</div>}
                <div className="plan-option-header">
                  <div>
                    <div className="plan-option-name">{p.name}</div>
                    <div className="plan-option-badge">{p.badge} · {p.images} AI images</div>
                  </div>
                  <div className="plan-option-price">{p.price}<span>/mo</span></div>
                </div>
                {selectedPlan === p.id && (
                  <ul className="plan-option-feats">
                    {p.features.map((f, i) => <li key={i}><span className="ck">✓</span>{f}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button className="btn-primary btn-lg btn-full" onClick={handleNext}>
            Get My Site — {plan.price}/mo →
          </button>
          <p className="terms">Site live within 48 hours. Cancel anytime.</p>
        </div>
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div className="fs-modal" onClick={() => setFullscreen(false)}>
          <div className="fs-modal-inner" onClick={e => e.stopPropagation()}>
            <div className="fs-modal-bar">
              <span>{bizType} — {plan.name} Preview</span>
              <button className="btn-ghost btn-sm" onClick={() => setFullscreen(false)}>✕ Close</button>
            </div>
            {selectedPlan === "premium"
              ? <iframe
                  src={isOther ? undefined : stitchUrl}
                  srcDoc={isOther && previewHTML ? previewHTML : undefined}
                  className="fs-iframe" title="Full preview" />
              : previewHTML
                ? <iframe srcDoc={previewHTML} className="fs-iframe" title="Full preview" />
                : null}
          </div>
        </div>
      )}

      <div className="step-actions" style={{marginTop:"16px"}}>
        <button className="btn-ghost" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

// ─── STEP 4: SIGN UP ─────────────────────────────────────────────────────────
function StepSignup({ industry, bizType, city, phone, email, planId, onBack }: {
  industry: string; bizType: string; city: string; phone: string;
  email: string; planId: string; onBack: () => void;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const plan = PLANS.find(p => p.id === planId) || PLANS[1];
  const ind = INDUSTRIES.find(i => i.id === industry);

  async function submit() {
    if (password.length < 8) return setError("Password must be at least 8 characters");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, businessName: bizType, industry, city, phone, planId }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Signup failed"); }
      router.push("/checkout?plan=" + planId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>You're almost live 🎉</h2>
        <p>Create your account — we start building immediately</p>
      </div>
      <div className="order-box">
        <div className="order-title">Order Summary</div>
        <div className="order-row"><span>Business</span><span>{bizType}</span></div>
        <div className="order-row"><span>Industry</span><span>{ind?.emoji} {ind?.label}</span></div>
        <div className="order-row"><span>City</span><span>{city}</span></div>
        <div className="order-divider" />
        <div className="order-row order-total"><span>{plan.name} Plan</span><span className="order-plan-val">{plan.price}/mo</span></div>
      </div>
      <div className="form-group">
        <label>Email</label>
        <input className="form-input" type="email" value={email} disabled style={{opacity:0.6}} />
      </div>
      <div className="form-group">
        <label>Password *</label>
        <input className="form-input" type="password" placeholder="At least 8 characters"
          value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      {error && <div className="error-msg">{error}</div>}
      <button className="btn-primary btn-lg btn-full" onClick={submit} disabled={loading}>
        {loading ? "Creating your account…" : `Create Account & Pay ${plan.price}/mo →`}
      </button>
      <p className="terms">By signing up you agree to our Terms of Service. Cancel anytime.</p>
      <div className="step-actions" style={{marginTop:"12px"}}>
        <button className="btn-ghost" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function PreviewPage() {
  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState("");
  const [bizType, setBizType] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState("pro");

  return (
    <div className="preview-page">
      <nav className="preview-nav">
        <div className="preview-nav-logo">Exsisto</div>
        <div className="preview-nav-tag">✦ Your site, built by AI in 48 hours</div>
      </nav>
      <div className="preview-container">
        <StepBar step={step} />
        {step === 0 && (
          <StepIndustry onNext={id => { setIndustry(id); setStep(1); }} />
        )}
        {step === 1 && (
          <StepBizType industry={industry}
            onNext={t => { setBizType(t); setStep(2); }}
            onBack={() => setStep(0)} />
        )}
        {step === 2 && (
          <StepSite industry={industry} bizType={bizType}
            onNext={(c, p, e, pid) => { setCity(c); setPhone(p); setEmail(e); setPlanId(pid); setStep(3); }}
            onBack={() => setStep(1)} />
        )}
        {step === 3 && (
          <StepSignup industry={industry} bizType={bizType}
            city={city} phone={phone} email={email} planId={planId}
            onBack={() => setStep(2)} />
        )}
      </div>
    </div>
  );
}

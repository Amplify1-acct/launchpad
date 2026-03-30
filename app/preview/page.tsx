"use client";
import "./preview.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface BizInfo {
  name: string; industry: string; city: string; phone: string; customIndustry?: string;
  description?: string; services?: string[]; yearsInBusiness?: string;
  differentiator?: string; stat1Label?: string; stat1Value?: string;
  stat2Label?: string; stat2Value?: string;
}
interface AIContent {
  headline: string; tagline: string; subtext: string;
  serviceHeadline?: string; aboutText?: string;
  stat1?: string; stat1Label?: string;
  stat2?: string; stat2Label?: string;
  services?: string[];
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { id:"auto",        label:"Auto / Car Restoration", emoji:"🚗", template:"auto"       },
  { id:"restaurant",  label:"Restaurant / Dining",    emoji:"🍝", template:"restaurant" },
  { id:"gym",         label:"Gym / Fitness",          emoji:"💪", template:"gym"        },
  { id:"plumbing",    label:"Plumbing",               emoji:"🔧", template:"plumbing"   },
  { id:"dental",      label:"Dental",                 emoji:"🦷", template:"dental"     },
  { id:"law",         label:"Law Firm",               emoji:"⚖️", template:"law"        },
  { id:"salon",       label:"Hair Salon / Beauty",    emoji:"✂️", template:"salon"      },
  { id:"realestate",  label:"Real Estate",            emoji:"🏠", template:"realestate" },
  { id:"pet",         label:"Pet Care / Grooming",    emoji:"🐾", template:"pet"        },
  { id:"hvac",        label:"HVAC / Home Services",   emoji:"❄️", template:"hvac"       },
  { id:"bakery",      label:"Bakery / Food",          emoji:"🥐", template:"restaurant" },
  { id:"landscaping", label:"Landscaping / Lawn",     emoji:"🌿", template:"plumbing"   },
  { id:"other",       label:"Other / Not Listed",      emoji:"✏️", template:"auto"       },
];

// Images from manifest — keyed by industry
const IMAGES: Record<string, string[]> = {
  auto:       ["https://lh3.googleusercontent.com/aida-public/AB6AXuB1C5DRn1V7PTWJ5C3peAzS5XRATD1-_I_V1zvK1gAruW_KPod1F9uKJNvgaA4nbvEEj0gsUIJH_31KcT9sjEFKB3A8T9mmloZFPwQxmYrtbAnR7iCHRaUqd99X8e8ULR6HvFnZUXaJRdrPYSuq1RCMCYIidiP_I-LAy5vNBBeAWgdelt5cVvKoT_Td9g5JpSPAziCXp9QpjhQljGZ9qBy6XkDafSvgYMLUR0v-kGyDDVlgZHoUZI9UV-ylA7bAX-kNnRwbB4iywO7v"],
  restaurant: ["https://lh3.googleusercontent.com/aida-public/AB6AXuCvZLqWp4vcBq3WgdR1v4lm0V-Qvv60o516WggmsiMePqV24UjlJFw76Maw2-xQL1O2uq72IMybEO73HmeNdq_YzzOpxC433PT13z6STlsJ3ILrRGais9KfUAHH4vLqpuGdI1_o4yHOifu3A1PaaS9Rr_Re6C9ijjcxZx_7z_NgyT3He22bBREJjWeMqv099xbGD716bTgOEhizQTdoMcbrUjXAO3qcbEgD7nxgAJ_VX9Hkay6pzzx4QzJX6UiB7afiA3lDzsxDPr_L","https://lh3.googleusercontent.com/aida-public/AB6AXuCNiALvKNYkWsiRoW_fZfI7deDmFw8VG03jwNmIPVtmUGJXKBvMZjd530zf1A7DIkHhc4yMj8dHlJmfYj8A9Wg4AoGNw1nw2-G_-yV9nkXlUCRE8OGHbi0EcSR_4W5EAPV-a37j9r34xsCBbwEGxLwdUKDFNS9ObR1jl4LggL4Byq0MrLzgo027a_X5tGXhShIm1LMpBxGDoPATgV8AsdXVE5YAqlVWS1kK-JNFZIKHtQc-edVWXEpVPC5f8R8tuN73_Js9JQDzCoWu"],
  gym:        ["https://lh3.googleusercontent.com/aida-public/AB6AXuDXmVVa4eIKi9cTBj0xQk_hCyO7VFXbqgW1xpTNArtzMR10-zDGFQpPVlHzEzLGP4X407w5YQyjekIxVbd5PISRUPtue4hJ1yi3i6OpGQbJIe7X5o4SC0PxbeEYzpZavi-8XAiPVUltgvLwpWSqxkyFcBi10Re1MflzKNF-83AszsmuPtxsyRJsQQd2N9D4d8GQ-NGBdp_fL7EjcIitWKAO1BTOuGhr-E_sg8id2-Mxw21kuJQ-nIKbmy7mjYpfRvGCyD2JU8pq0ELf","https://lh3.googleusercontent.com/aida-public/AB6AXuAammkUU2LRwUD8jaYXakwvODFHgqpcBGiiL4kFdvgOSUxZo12wKJOFdtnNMSXh9UGiMLl5g9b_Cf_p-jWzMfKk04138bKhQBc42CP9lYzJnKni12Z_IbsMqtSO3bdgYi7HPQzHA4U60sw0joxAAKRcJ2BBiQgNA4wXfIq01FqX7dH7hI_u7JRZIdS7wpQ3xr4bEfp9Qa8Ei-LZKqM6BHlVmGFoFHbkYWucCYo1VMSWTfFjvJoeC4bpxs3Jz4CNYAJ0hEKlDKERPNd1","https://lh3.googleusercontent.com/aida-public/AB6AXuAw_4KplwHDWnIYq9MtPzWvgzuMGwGhd6arLFWqeUXHFW3tuSJ9jqMRX-GdlutnwkZd2qIFlhKy0gsRpfjDFQfEzWZ-_2MfOJq5iSu6qG4FGxkOxtCxfVKk0F5P5M-_GpJvghEjnNoDMVG05jeWNuDQ72hecHJiCGFhG7Uk8KVnqws-1R-_zaVNPCp42rnjd6Jm3FuIAHcdVy0qWQQC7fttKPofPhOZbISU5WcgaeUz1TZ1z_bm7HTqxvvzakiCzIQQUPQEK2-h1vcg"],
  plumbing:   ["https://lh3.googleusercontent.com/aida-public/AB6AXuBLx4WzaQZniruzjEUzfNZAFP1YleKAvggn_len6ed_c4bihLu0avfrHa9ULtBo1ogCuZwXSjmGGlJ14T4mbuegnQD7RwdT9UVYy-7oE7vHI2kYIsB8B7eOZ3rlVGRTjfk5u8dur4uWOHG4CQEB7ndtLm5ft534abnjwRIfX5iSUDCdYS0Ym5uixYXqTHFiXu83sX8uAL9OAHluuySsVFF-Cg8AYYlBh1jAiI7s1mS1QUKhOO_hZ0qAC15ikjt5MClUA89gcHsqXo4q","https://lh3.googleusercontent.com/aida/ADBb0ujccHwdhpdnntK9Jbvc0ZMFIMDtOONtTsRBij9mTWuNWXnc8NfkXGCSUz7ieSxJoNzz1hNydPYU-xd_Paznmp4YkXE4iMv96KVsn4OGkWK-dWQuQP4mhAmEhiD64gucQ3Vs3WeM5ilqRryKAPzM0t04-hQ7OOuAWyP-XHxW-mRdHRwdiis2zmCENIsfqt7zD0Z2caqJVHMgFXPjrwHBu21qL-eCwzOykA59WkMJ_msAnIXrAgDJNPIgPDI","https://lh3.googleusercontent.com/aida/ADBb0ujhLJzKSp4J4NvqhdN2IowKU2hCj6-OmtvytWGc3gtpmXhB--cn6YbZmnbcd_N5hui6sVWKXHPY4EWiPmHnfKBNeYFFy0d4aLFTiZSTF121YpzBTRpYoKr8s0kWuOAXImMpnyhJfifptMoGlk5vaq4faVWHeXMU4ucCUUCWDtqK7lkyY90AY2-5er2VaKbuNUWJt6TTvDv9ty_uhgRTY61QwedBVq9C_3m_dBfSCZXCEiG0P1aN2RzrKnZR"],
  dental:     ["https://lh3.googleusercontent.com/aida-public/AB6AXuAnZsieQO3kVch-WVq6qQv4DIHNp0G1k1KByxaRmfwgs1UX58vW9FtkDrTKOVl5sO_kWGVyy3sR0BWX_12q5TcM-BI87lN1LFMHSdHtQI7pDlQ_8Z5ZE5uF5B3qjAlHLDosVbuL9t37sd1VXWHxuON3LqqbZAvyZOUsPmNNHQQcmLDKMaq-0fQXFEDPSGAJnL8PZGMBMBIFIdsoZNkSe6FDlk1SRJt4WefJJ6iPhc22fob35XmtCNKYOGJ9rXQ5PKE0TyDGUDMMDftz"],
  law:        ["https://lh3.googleusercontent.com/aida-public/AB6AXuA2bmKC-l0xAsSJpZgDVcecdYLTZCxOVeyCRR88CGcsZ-uI7Z_bL-suNkV6cEAcQ8O3a27t3JNOBScb5Wfw_YzpmlyyTAQJAlW1tMyUyS9PpfjvuziSQusEHlsMX2PSfd2ClgW9QVpxbTCJcy4jiSelqeO8kWkh5tWaINWmRtxyHasnpmWF1VomlI5jDDUZGRURNf80Q5UFVHfRyTwenMP8FXUJcZo-SGFH_iEbWK46RN_eytiiOOyHQ-UcDURSWO80kMLFnp8qe5cO"],
  salon:      ["https://lh3.googleusercontent.com/aida-public/AB6AXuDuGcJfAqWQYxJJruc0kvCg2_2j3hTIchtkFDyayMxxqmZIODZNtK","https://lh3.googleusercontent.com/aida-public/AB6AXuCt8eqJoO0SDBwjwtyqlHO5EV-Z9zcmbuY0YdgWDoK","https://lh3.googleusercontent.com/aida-public/AB6AXuAzbt-KvFGXzPD18-D1OLreiXiZ3rQYqDfVZgYm4fY"],
  realestate: ["https://lh3.googleusercontent.com/aida-public/AB6AXuDGTPjhpEEgeVyvIzI98rWuhnE3IutU3zbdSg-CS7N-HUjn-ju9WtKHVpuK3TFHRTyxmqzj8RL2PT2ZxW4I-dfKBxN9mJa636mwi2GZAfd_gVXcGY50vyxMI1fylMyqqYGgjUmUEPH8OlGV9kdi-8GHWStXFF7oshPRVn_KHkEFC_P0pCmWaJHmDdWBnpJHi_UyJsbaE50pvH17nwK2Incu-ZdbPU7C8yjrrbv4BdzGjTZYIP3u-Gs9qY9aBFMoUJn-KuP4BcInfQkg","https://lh3.googleusercontent.com/aida-public/AB6AXuDvYIZryBCbR6HZuapKt-IdeyNMSM1SnFr3bNgqHiyV2KY-xAZozEdFYpsXSI_RUpTI6xOPVmy77nti4XJ-hAWVSvuszsSCDho5caB3yznlUV7TNJ8nS_Lw3KeASHp0nhmbtE5MHN8MEknS2o4h-k__Ffn7fyKs7NS7qjd3ahIpTJlmD_6DCuMX_2aIPiUrKJEgH3kxZarL7YCpDoyvMXbgslfgqsVYMU5IOUHB-foUPMtmM2OLtX9b9xrP-QCuhrSYF2ZphLaTu95a","https://lh3.googleusercontent.com/aida-public/AB6AXuAB35rkEC4mDZDR_x8_1qloNGZYZY-ojQiGBMA_MoUMt54iXM-4me_wbbkW_jaROIjh2eXnRYnUrYxRwlhYi7LCuuS6ckVCmdcS5Qw7I8u0z4jUP4yik1WsaQFhUUQ2tl8DEWLPmYomEaVyCj2nRhfDv-Gdoc33de-VIajRkXp6UtbHrVdJv47mAlGj98NpR3vUdmA4V6h-2BZt1nzoteZwDYLlpSGajuWvwDBp4yWLZsr5sVFbhY3E_feGb8NtKQwkYvaKVpqYQvDu","https://lh3.googleusercontent.com/aida-public/AB6AXuB9mC6OlU08Gn_MihZVur_WnNn8apZCILFqwiwOPr_9aE6ehPKVP-iasLHhomTe1kB8HShJKTpv4qAICN_4KChfhOE7jv5wRYoHAIJswgG_bD8nAtdkTjHuTL47pZALC1Vb79M-SpTkD9QPJWbKYYxu_vIBY69R-TlE45qfonY2M9M7Y8g6N2FJWJ328b-VZ4SI2Vt04q2RG_gHwiwAFKDZuxpJOsUo9yguZoVYIjQ_dnQ5kwDkKBqCA1-Cld_bRahx9EFw2fC7FfXe"],
  pet:        ["https://lh3.googleusercontent.com/aida-public/AB6AXuAakjrronShuhDi9C1NBElTHzyP3VMzJ9G5Dctjcl92TxRxYkyFiZOPO8yrf9V-eT2J6xmdWJ79cKZz7ZmwBXATymwPf4PxgiUHfCidSgGAK_tkyDTrQhF7Jd2eS7Q63P-FvX-XxCNENgIURqu-7veVfS-TUUcGqcglUXT2szDd_EZy2DPCgMt8jMgGFLtR_L5eYJvAM2PXfKZBsZ-UuUdqQswfyBsCmhZHDMRfGjw5mbNHyKCVbpVV9yEk9kHH5jSHnXW7jp4jEzOi","https://lh3.googleusercontent.com/aida-public/AB6AXuCPZKctAkhk4vS5sjiUkXbEhxvPuIXf1QYIWgGO5yxP9zpP8bypgYZyl0dd1kGxdDwWeedzu9Dfayw1fZdE9vs8P7vRk70LnfTWVuJEHDY8Zt3Jt_RQ7JkzRF9dlA5H3sM9IJjU4p1r8T2lNq0vWo09MS_3zlMPAG3Z2N99AOyCnuEuU3fnXcHVt6vgoLZuYmNx3dopxCBC5UUOZMf_RxcgL5T6fUdg4eOHE8yhZzQFC99mLEezfRm-t_h4Ij9oUVXpOcMfojTUGOVw","https://lh3.googleusercontent.com/aida-public/AB6AXuCk-ZxVr8p4mmJTJMfS_JCw_4Xa-Es7NVCnhfiZq_ULRmRz_-fbp_9-3fLmTTetdH4uyGJ339r_v8Ab8L1OXRRTA8poE-VW7fRlDkE3w-v4M8hZGxzKg8pMBaInBO-0ItvKuP2Gku7ok3Tz3GZWaqkQwcxfj00jHecXJ8NC8Ty3lQCN8M4F0h-2Q_4YwuXygMSbRaFGFcmLY9xYDhdSdzyM4F6HkLINPc3STCrfd6Bs4q92VZG059HlM6rrE5lUM7vB9TOvhJxbR8-L","https://lh3.googleusercontent.com/aida-public/AB6AXuBTK0wTaoSltYZLeQD3X5AUR3gKf8RI7b6hecV2pEiBwVjrIHAXaUoAS6m6W7Qq545KCPN_s8D0YmqUMCpA-urpF2jLcztb9EkqHtXZIHWPhEbAgBTiFBipOazgn5D7J6a6YqV7P7iWqiHs839dONkBjHM6_C2CFV5uiMZwPjVqI-IJqUe_cOBkOI9xPCaQI15e6BOGf5Ai2xQAyozfcYFqnXoefm_C0S1MgmqnEcFhspUWMtzVj1XSbEXJNuMWuATpt36yowjGiJn0"],
  hvac:       ["https://lh3.googleusercontent.com/aida-public/AB6AXuCJrlkie16uVtFbV6_FAmWBgX5BGTEyUNyBq_lFZscmNGnkGrTVVXrO0IXStJXQWGI6itzZWubrhF1q_YTfyRbLBVusaQJAB1K-Aj2XmG3zTJL6jk_8GXSsoZAvsklJBpokDxVQeRRGmz0jHJef3CxtxjsiJy5AZwZuMUDUpfShNxYb2_aPlFpIImIwSbb44v1Dg838ppf5P4T_9TcGiX6o9711_y-wfyTgwRZNO1iwmD9K2B5ygSzzkKzsuIfWq1vwtPi88BE_hvdv","https://lh3.googleusercontent.com/aida-public/AB6AXuD8GBkkRx8ALxrDMnQichwC0-t8NYrb6k3SLuZOuEcj2yd67FtLT24KP-Dtz46ZhSan8qXGaHcJD-UUyA5HIVJ8gXxjLVlhDK-T9cf73FU9aCRgwBeBNY28WzbjyIx6Ox4V9nsL8Oe0Ju2D8kcopf7tzuLdfuHxt0AChKAmyGJRc1njodsW3D-gWQKU3lDKYZNe7CYhmu_wOIzGskJQp098e2F_DHcRUiXMGZOFbqMGveavHhgLIoe7ErJ50Gk1G5mNdp9NC791XeA1"],
  bakery:     ["https://lh3.googleusercontent.com/aida-public/AB6AXuCvZLqWp4vcBq3WgdR1v4lm0V-Qvv60o516WggmsiMePqV24UjlJFw76Maw2-xQL1O2uq72IMybEO73HmeNdq_YzzOpxC433PT13z6STlsJ3ILrRGais9KfUAHH4vLqpuGdI1_o4yHOifu3A1PaaS9Rr_Re6C9ijjcxZx_7z_NgyT3He22bBREJjWeMqv099xbGD716bTgOEhizQTdoMcbrUjXAO3qcbEgD7nxgAJ_VX9Hkay6pzzx4QzJX6UiB7afiA3lDzsxDPr_L"],
  landscaping:["https://lh3.googleusercontent.com/aida-public/AB6AXuBLx4WzaQZniruzjEUzfNZAFP1YleKAvggn_len6ed_c4bihLu0avfrHa9ULtBo1ogCuZwXSjmGGlJ14T4mbuegnQD7RwdT9UVYy-7oE7vHI2kYIsB8B7eOZ3rlVGRTjfk5u8dur4uWOHG4CQEB7ndtLm5ft534abnjwRIfX5iSUDCdYS0Ym5uixYXqTHFiXu83sX8uAL9OAHluuySsVFF-Cg8AYYlBh1jAiI7s1mS1QUKhOO_hZ0qAC15ikjt5MClUA89gcHsqXo4q"],
};

const PLANS = [
  {
    id: "starter", name: "Starter", price: "$99", period: "/mo",
    tagline: "Get online fast", popular: false, images: 1,
    badge: "Simple & Clean",
    features: ["5-page website","1 AI image","2 blogs/mo","8 social posts/mo","On-page SEO"],
  },
  {
    id: "pro", name: "Pro", price: "$299", period: "/mo",
    tagline: "Most popular", popular: true, images: 3,
    badge: "Rich & Detailed",
    features: ["10-page website","3 AI images","Gallery + stats","4 blogs/mo","16 social posts/mo","Advanced SEO"],
  },
  {
    id: "premium", name: "Premium", price: "$599", period: "/mo",
    tagline: "Full AI design", popular: false, images: 5,
    badge: "✦ Full Stitch AI Design",
    features: ["Custom AI design","5 AI images","8 blogs/mo","32 social posts/mo","Before/after gallery","Priority support"],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
// Maps industries without their own images to the best visual match
const IMAGE_FALLBACK: Record<string, string> = {
  bakery:      "restaurant",   // food photography works
  landscaping: "realestate",   // outdoor/property shots work better than plumbing
  other:       "auto",         // dark editorial works as neutral
};

function getImgs(industryId: string) {
  const key = IMAGES[industryId] ? industryId : (IMAGE_FALLBACK[industryId] || "auto");
  return IMAGES[key] || IMAGES["auto"] || [];
}

function getTemplate(industryId: string) {
  const ind = INDUSTRIES.find(i => i.id === industryId);
  return ind?.template || "auto";
}

// Build Starter layout HTML (hand-coded, 1 image)
function buildStarterHTML(biz: BizInfo, ai: AIContent, imgs: string[]): string {
  const hero = imgs[0] || "";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;color:#111;background:#fff;}
nav{padding:18px 48px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0f0f0;position:sticky;top:0;background:rgba(255,255,255,0.95);backdrop-filter:blur(12px);z-index:9;}
.nav-logo{font-size:18px;font-weight:900;letter-spacing:-0.5px;}
.nav-cta{background:#111;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;}
.hero{position:relative;height:88vh;overflow:hidden;}
.hero img{width:100%;height:100%;object-fit:cover;}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,0.78) 50%,rgba(0,0,0,0.1));}
.hero-content{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 72px;}
.hero-tag{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,0.55);margin-bottom:18px;}
.hero-h1{font-size:52px;font-weight:900;color:#fff;line-height:1.05;letter-spacing:-2px;max-width:560px;margin-bottom:20px;}
.hero-p{font-size:16px;color:rgba(255,255,255,0.7);max-width:460px;line-height:1.75;margin-bottom:32px;}
.hero-btns{display:flex;gap:12px;}
.btn-w{background:#fff;color:#111;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;}
.btn-g{border:2px solid rgba(255,255,255,0.35);color:#fff;padding:14px 22px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;}
.services{padding:64px 72px;background:#f9f9f9;}
.sec-tag{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:10px;}
.sec-h{font-size:30px;font-weight:800;letter-spacing:-0.5px;margin-bottom:36px;}
.svc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.svc{background:#fff;border-radius:10px;padding:22px;border:1px solid #f0f0f0;}
.svc-ico{width:36px;height:36px;background:#111;border-radius:7px;margin-bottom:12px;}
.svc-n{font-size:14px;font-weight:700;}
.cta{background:#111;padding:52px 72px;display:flex;justify-content:space-between;align-items:center;}
.cta h2{font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;}
.cta p{font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;}
.cta-phone{background:#fff;color:#111;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:800;text-decoration:none;}
footer{padding:22px 72px;background:#f5f5f5;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#999;}
.powered{color:#6366f1;font-weight:700;}
</style></head><body>
<nav><div class="nav-logo">${biz.name}</div><a class="nav-cta" href="#">${biz.phone || "Call Us"}</a></nav>
<div class="hero">
  <img src="${hero || ''}" style="${hero ? '' : 'background:#1a1a2e;min-height:100%;'}" onerror="this.style.background='#1a1a2e';this.removeAttribute('src')"/>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-tag">${biz.city} · Professional Service</div>
    <h1 class="hero-h1">${ai.headline}</h1>
    <p class="hero-p">${ai.subtext}</p>
    <div class="hero-btns"><a class="btn-w" href="#">Get Free Estimate →</a><a class="btn-g" href="#">Our Services</a></div>
  </div>
</div>
<section class="services">
  <div class="sec-tag">What We Do</div>
  <h2 class="sec-h">Our Services</h2>
  <div class="svc-grid">
    <div class="svc"><div class="svc-ico"></div><div class="svc-n">Professional Service</div></div>
    <div class="svc"><div class="svc-ico"></div><div class="svc-n">Expert Consultation</div></div>
    <div class="svc"><div class="svc-ico"></div><div class="svc-n">Quality Guaranteed</div></div>
  </div>
</section>
<section class="cta">
  <div><h2>Ready to get started?</h2><p>${biz.name} · ${biz.city} · Free estimates</p></div>
  <a class="cta-phone" href="tel:${biz.phone}">${biz.phone || "Contact Us"}</a>
</section>
<footer><span>${biz.name} · ${biz.city}</span><span>Powered by <span class="powered">Exsisto Starter</span> · $99/mo</span></footer>
</body></html>`;
}

// Build Pro layout HTML (hand-coded, 3 images, gallery + stats)
function buildProHTML(biz: BizInfo, ai: AIContent, imgs: string[]): string {
  const [hero, card1, card2] = [imgs[0]||"", imgs[1]||imgs[0]||"", imgs[2]||imgs[0]||""];
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap" rel="stylesheet"/>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',sans-serif;color:#111;background:#fff;}
nav{padding:18px 56px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0f0f0;position:sticky;top:0;background:rgba(255,255,255,0.95);backdrop-filter:blur(12px);z-index:9;}
.nav-logo{font-size:18px;font-weight:900;letter-spacing:-0.5px;}
.nav-links{display:flex;gap:24px;align-items:center;}
.nav-links a{font-size:13px;font-weight:500;color:#666;text-decoration:none;}
.nav-cta{background:#111;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;}
.hero{display:grid;grid-template-columns:45% 55%;min-height:88vh;}
.hero-left{padding:80px 56px;display:flex;flex-direction:column;justify-content:center;}
.hero-tag{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:3px;color:#999;margin-bottom:20px;}
.hero-h1{font-size:48px;font-weight:900;line-height:1.05;letter-spacing:-2px;margin-bottom:18px;}
.hero-p{font-size:15px;color:#555;line-height:1.8;margin-bottom:26px;max-width:400px;}
.stats{display:flex;gap:20px;margin-bottom:30px;padding:16px 20px;background:#f9f9f9;border-radius:10px;}
.stat-n{font-size:20px;font-weight:900;}.stat-l{font-size:10px;color:#999;margin-top:2px;text-transform:uppercase;letter-spacing:1px;}
.hero-btns{display:flex;gap:10px;}
.btn-d{background:#111;color:#fff;padding:14px 26px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;}
.btn-o{border:2px solid #e5e5e5;color:#333;padding:14px 20px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;}
.hero-right{position:relative;overflow:hidden;}
.hero-right img{width:100%;height:100%;object-fit:cover;min-height:500px;}
.badge{position:absolute;bottom:24px;left:24px;background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);padding:14px 18px;border-radius:10px;}
.badge-n{font-size:20px;font-weight:900;}.badge-l{font-size:10px;color:#999;margin-top:2px;}
.services{padding:64px 56px;background:#f9f9f9;}
.sec-tag{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#999;margin-bottom:8px;text-align:center;}
.sec-h{font-size:30px;font-weight:800;letter-spacing:-0.5px;text-align:center;margin-bottom:36px;}
.svc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:900px;margin:0 auto;}
.svc{background:#fff;border-radius:10px;padding:22px 18px;text-align:center;}
.svc-ico{width:38px;height:38px;background:#111;border-radius:7px;margin:0 auto 12px;}
.svc-n{font-size:13px;font-weight:700;}
.gallery{padding:64px 56px;background:#fff;}
.gal-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;max-width:1000px;margin:28px auto 0;}
.gal-grid img{width:100%;height:240px;object-fit:cover;border-radius:10px;background:#eee;}
.testimonials{padding:56px 56px;background:#f9f9f9;}
.t-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:1000px;margin:28px auto 0;}
.t{background:#fff;border-radius:10px;padding:24px;}
.t p{font-size:13px;color:#444;line-height:1.8;font-style:italic;margin-bottom:14px;}
.t-name{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;}
.t-role{font-size:10px;color:#999;margin-top:2px;}
.cta{background:#111;padding:52px 56px;display:flex;justify-content:space-between;align-items:center;}
.cta h2{font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;}
.cta p{font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;}
.cta-phone{background:#fff;color:#111;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:800;text-decoration:none;}
footer{padding:22px 56px;background:#f0f0f0;display:flex;justify-content:space-between;font-size:11px;color:#999;}
.powered{color:#6366f1;font-weight:700;}
</style></head><body>
<nav>
  <div class="nav-logo">${biz.name}</div>
  <div class="nav-links"><a href="#">Services</a><a href="#">Gallery</a><a href="#">About</a></div>
  <a class="nav-cta" href="#">${biz.phone || "Call Now"}</a>
</nav>
<div class="hero">
  <div class="hero-left">
    <div class="hero-tag">${biz.city}</div>
    <h1 class="hero-h1">${ai.headline}</h1>
    <p class="hero-p">${ai.subtext}</p>
    <div class="stats">
      <div><div class="stat-n">${ai.stat1 || "20+"}</div><div class="stat-l">${ai.stat1Label || "Years"}</div></div>
      <div><div class="stat-n">${ai.stat2 || "500+"}</div><div class="stat-l">${ai.stat2Label || "Clients"}</div></div>
      <div><div class="stat-n">4.9★</div><div class="stat-l">Rating</div></div>
      <div><div class="stat-n">Free</div><div class="stat-l">Estimate</div></div>
    </div>
    <div class="hero-btns"><a class="btn-d" href="#">Get Free Estimate →</a><a class="btn-o" href="#">View Our Work</a></div>
  </div>
  <div class="hero-right">
    <img src="${hero}" onerror="this.style.background='#eee';this.removeAttribute('src')"/>
    <div class="badge"><div class="badge-n">★ 4.9</div><div class="badge-l">200+ Five-Star Reviews</div></div>
  </div>
</div>
<section class="services">
  <div class="sec-tag">What We Do</div><h2 class="sec-h">Our Services</h2>
  <div class="svc-grid">
    <div class="svc"><div class="svc-ico"></div><div class="svc-n">Service One</div></div>
    <div class="svc"><div class="svc-ico"></div><div class="svc-n">Service Two</div></div>
    <div class="svc"><div class="svc-ico"></div><div class="svc-n">Service Three</div></div>
    <div class="svc"><div class="svc-ico"></div><div class="svc-n">Service Four</div></div>
  </div>
</section>
<section class="gallery">
  <div class="sec-tag" style="text-align:center">Our Work</div><h2 class="sec-h">See the Results</h2>
  <div class="gal-grid">
    <img src="${hero}" onerror="this.style.background='#ddd';this.removeAttribute('src')"/>
    <img src="${card1}" onerror="this.style.background='#ddd';this.removeAttribute('src')"/>
    <img src="${card2}" onerror="this.style.background='#ddd';this.removeAttribute('src')"/>
  </div>
</section>
<section class="testimonials">
  <div class="sec-tag" style="text-align:center">Reviews</div><h2 class="sec-h">What Clients Say</h2>
  <div class="t-grid">
    <div class="t"><p>"Absolutely incredible service — exceeded every expectation."</p><div class="t-name">Sarah J.</div><div class="t-role">Local Resident</div></div>
    <div class="t"><p>"Fast, professional, and very fairly priced. Highly recommend."</p><div class="t-name">Michael R.</div><div class="t-role">Homeowner</div></div>
    <div class="t"><p>"The team was on time, clean, and thorough. Will use again."</p><div class="t-name">Elena V.</div><div class="t-role">Repeat Customer</div></div>
  </div>
</section>
<section class="cta">
  <div><h2>Ready to get started?</h2><p>${biz.name} · ${biz.city} · Free estimates · Licensed & insured</p></div>
  <a class="cta-phone" href="tel:${biz.phone}">${biz.phone || "Contact Us"}</a>
</section>
<footer><span>${biz.name} · ${biz.city}</span><span>Powered by <span class="powered">Exsisto Pro</span> · $299/mo</span></footer>
</body></html>`;
}

// ─── STEP BAR ─────────────────────────────────────────────────────────────────
function StepBar({ step }: { step: number }) {
  const steps = ["Your Info", "About You", "Pick a Design", "Choose Plan", "Go Live"];
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

// ─── STEP 1: INFO ─────────────────────────────────────────────────────────────
function StepInfo({ onNext }: { onNext: (b: BizInfo) => void }) {
  const [form, setForm] = useState<BizInfo>({ name: "", industry: "", city: "", phone: "", customIndustry: "" });
  const [error, setError] = useState("");

  function submit() {
    if (!form.name.trim()) return setError("Business name is required");
    if (!form.industry) return setError("Please select your industry");
    if (form.industry === "other" && !form.customIndustry?.trim()) return setError("Please describe your business type");
    if (!form.city.trim()) return setError("City is required");
    setError("");
    onNext(form);
  }

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Tell us about your business</h2>
        <p>Just the basics — takes about 30 seconds</p>
      </div>
      <div className="form-group">
        <label>Business Name *</label>
        <input className="form-input" type="text" placeholder="e.g. Matty's Automotive"
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="form-group">
        <label>Industry *</label>
        <div className="industry-grid">
          {INDUSTRIES.map(ind => (
            <button key={ind.id}
              className={`industry-btn ${form.industry === ind.id ? "active" : ""}`}
              onClick={() => setForm(f => ({ ...f, industry: ind.id }))}>
              <span className="industry-emoji">{ind.emoji}</span>
              <span className="industry-label">{ind.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>City *</label>
          <input className="form-input" type="text" placeholder="e.g. Westfield"
            value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input className="form-input" type="tel" placeholder="(908) 555-0100"
            value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
      </div>
      {form.industry === "other" && (
        <div className="form-group">
          <label>Describe your business *</label>
          <input className="form-input" type="text" placeholder="e.g. Wedding Photography, Food Truck, Dog Training..."
            value={form.customIndustry || ""}
            onChange={e => setForm(f => ({ ...f, customIndustry: e.target.value }))} />
        </div>
      )}
      {error && <div className="error-msg">{error}</div>}
      <button className="btn-primary btn-lg" onClick={submit}>Next: About You →</button>
    </div>
  );
}



// ─── SERVICE & STAT SUGGESTIONS (module-level) ───────────────────────────────
const SERVICE_SUGGESTIONS: Record<string, string[]> = {
  auto:        ["Full Restoration","Custom Paint & Bodywork","Engine Rebuilds","Chrome & Detailing","Panel Fabrication","Classic Car Storage"],
  restaurant:  ["Dine-In","Takeout & Delivery","Private Events","Catering","Bar & Cocktails","Weekend Brunch"],
  gym:         ["Personal Training","Group Fitness Classes","Nutrition Coaching","Strength & Conditioning","Yoga & Pilates","Recovery & Wellness"],
  plumbing:    ["Emergency Repairs","Drain Cleaning","Water Heater Install","Pipe Replacement","Bathroom Remodels","Leak Detection"],
  dental:      ["General Dentistry","Teeth Whitening","Invisalign","Dental Implants","Emergency Care","Cosmetic Bonding"],
  law:         ["Personal Injury","Criminal Defense","Family Law","Estate Planning","Business Law","Free Consultations"],
  salon:       ["Cuts & Color","Keratin Treatments","Hair Extensions","Balayage","Bridal Hair","Scalp Treatments"],
  realestate:  ["Buyer Representation","Seller Services","Luxury Homes","Investment Properties","First-Time Buyers","Market Analysis"],
  pet:         ["Dog Grooming","Cat Grooming","Boarding","Daycare","Obedience Training","Mobile Grooming"],
  hvac:        ["AC Installation","Heating Repair","Duct Cleaning","Maintenance Plans","Emergency Service","Smart Thermostats"],
  bakery:      ["Artisan Breads","Custom Cakes","Pastries & Croissants","Wedding Cakes","Gluten-Free Options","Coffee Bar"],
  landscaping: ["Lawn Mowing","Landscape Design","Irrigation Systems","Tree & Shrub Trimming","Leaf Removal","Snow Plowing"],
  other:       ["Core Service","Consultation","Custom Work","Maintenance","Installation","Emergency Service"],
};

const STAT_SUGGESTIONS: Record<string, Array<{label: string; placeholder: string}>> = {
  auto:        [{label:"Years in Business",placeholder:"e.g. 20"},{label:"Cars Restored",placeholder:"e.g. 500+"}],
  restaurant:  [{label:"Years Open",placeholder:"e.g. 12"},{label:"Happy Diners",placeholder:"e.g. 10,000+"}],
  gym:         [{label:"Years Open",placeholder:"e.g. 8"},{label:"Members",placeholder:"e.g. 300+"}],
  plumbing:    [{label:"Years in Business",placeholder:"e.g. 15"},{label:"Jobs Completed",placeholder:"e.g. 2,000+"}],
  dental:      [{label:"Years in Practice",placeholder:"e.g. 20"},{label:"Patients Served",placeholder:"e.g. 5,000+"}],
  law:         [{label:"Years in Practice",placeholder:"e.g. 18"},{label:"Cases Won",placeholder:"e.g. 400+"}],
  salon:       [{label:"Years in Business",placeholder:"e.g. 10"},{label:"Happy Clients",placeholder:"e.g. 2,000+"}],
  realestate:  [{label:"Years in Business",placeholder:"e.g. 15"},{label:"Homes Sold",placeholder:"e.g. 200+"}],
  pet:         [{label:"Years in Business",placeholder:"e.g. 8"},{label:"Pets Groomed",placeholder:"e.g. 5,000+"}],
  hvac:        [{label:"Years in Business",placeholder:"e.g. 20"},{label:"Systems Installed",placeholder:"e.g. 1,000+"}],
  bakery:      [{label:"Years Baking",placeholder:"e.g. 12"},{label:"Items Made Daily",placeholder:"e.g. 200+"}],
  landscaping: [{label:"Years in Business",placeholder:"e.g. 15"},{label:"Lawns Maintained",placeholder:"e.g. 150+"}],
  other:       [{label:"Years in Business",placeholder:"e.g. 10"},{label:"Clients Served",placeholder:"e.g. 500+"}],
};

// ─── STEP 2: ABOUT YOUR BUSINESS ─────────────────────────────────────────────
function StepAbout({ biz, onNext, onBack }: {
  biz: BizInfo;
  onNext: (extra: Partial<BizInfo>) => void;
  onBack: () => void;
}) {
  const suggestions = SERVICE_SUGGESTIONS[biz.industry] || SERVICE_SUGGESTIONS["other"] || [];
  const statSuggestions = STAT_SUGGESTIONS[biz.industry] || [{label:"Years in Business",placeholder:"e.g. 10"},{label:"Jobs Completed",placeholder:"e.g. 500+"}];

  const [description, setDescription] = useState(biz.description || "");
  const [services, setServices] = useState<string[]>(biz.services || []);
  const [customService, setCustomService] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState(biz.yearsInBusiness || "");
  const [differentiator, setDifferentiator] = useState(biz.differentiator || "");
  const [stat1Value, setStat1Value] = useState(biz.stat1Value || "");
  const [stat2Value, setStat2Value] = useState(biz.stat2Value || "");
  const [error, setError] = useState("");

  const indLabel = biz.customIndustry || biz.industry;

  function toggleService(s: string) {
    setServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function addCustomService() {
    const trimmed = customService.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices(prev => [...prev, trimmed]);
      setCustomService("");
    }
  }

  function submit() {
    if (!description.trim()) return setError("Please tell us what you do — this helps us write your website");
    if (services.length === 0) return setError("Select at least one service");
    setError("");
    onNext({
      description,
      services,
      yearsInBusiness,
      differentiator,
      stat1Label: statSuggestions[0]?.label,
      stat1Value,
      stat2Label: statSuggestions[1]?.label,
      stat2Value,
    });
  }

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Tell us more about {biz.name}</h2>
        <p>This helps us write real content for your site — takes 2 minutes</p>
      </div>

      {/* Description */}
      <div className="form-group">
        <label>What do you do? *</label>
        <textarea
          className="form-input form-textarea"
          placeholder={`Describe your ${indLabel} business in 2-3 sentences. What makes you great? Who do you serve?`}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />
        <div className="field-hint">{description.length} characters · Aim for 50-200</div>
      </div>

      {/* Services */}
      <div className="form-group">
        <label>Your Services * <span className="label-hint">Pick all that apply</span></label>
        <div className="service-chips">
          {suggestions.map(s => (
            <button key={s}
              className={`service-chip ${services.includes(s) ? "active" : ""}`}
              onClick={() => toggleService(s)}>
              {services.includes(s) ? "✓ " : ""}{s}
            </button>
          ))}
        </div>
        <div className="custom-service-row">
          <input className="form-input" type="text" placeholder="Add your own service..."
            value={customService}
            onChange={e => setCustomService(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCustomService()} />
          <button className="btn-add" onClick={addCustomService}>+ Add</button>
        </div>
        {services.filter(s => !suggestions.includes(s)).map(s => (
          <div key={s} className="custom-chip">
            <span>✓ {s}</span>
            <button onClick={() => setServices(prev => prev.filter(x => x !== s))}>✕</button>
          </div>
        ))}
      </div>

      {/* Years + Differentiator */}
      <div className="form-row">
        <div className="form-group">
          <label>Years in Business</label>
          <input className="form-input" type="text" placeholder="e.g. 15"
            value={yearsInBusiness} onChange={e => { setYearsInBusiness(e.target.value); setStat1Value(e.target.value); }} />
        </div>
        <div className="form-group">
          <label>What makes you different?</label>
          <input className="form-input" type="text"
            placeholder="e.g. Family-owned, same-day service, 5-star rated..."
            value={differentiator} onChange={e => setDifferentiator(e.target.value)} />
        </div>
      </div>

      {/* Stats - only show the second stat since years is already captured above */}
      <div className="form-group">
        <label>Your Best Stat <span className="label-hint">Optional — shown on your site</span></label>
        <div className="stat-input-wrap">
          <div className="stat-input-label">{statSuggestions[1]?.label}</div>
          <input className="form-input" type="text" placeholder={statSuggestions[1]?.placeholder}
            value={stat2Value} onChange={e => setStat2Value(e.target.value)} />
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      <div className="step-actions">
        <button className="btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn-primary btn-lg" onClick={submit}>Next: About You →</button>
      </div>
    </div>
  );
}

// ─── STEP 2: DESIGN PICKER ────────────────────────────────────────────────────
function StepDesign({
  biz, ai, loadingAI, onNext, onBack
}: {
  biz: BizInfo;
  ai: AIContent | null;
  loadingAI: boolean;
  onNext: (planId: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState<string | null>(null);
  const [pexelsImgs, setPexelsImgs] = useState<string[]>([]);
  const [loadingPexels, setLoadingPexels] = useState(false);

  // For industries not in our library, fetch from Pexels
  const hasLibraryImages = !!IMAGES[biz.industry];
  useEffect(() => {
    if (!hasLibraryImages) {
      setLoadingPexels(true);
      const query = biz.customIndustry || biz.industry || "small business professional";
      fetch(`/api/pexels-search?q=${encodeURIComponent(query)}&o=landscape`)
        .then(r => r.json())
        .then(data => {
          const urls = (data.photos || []).map((p: {landscape?: string; square?: string}) => p.landscape || p.square || "").filter(Boolean);
          if (urls.length > 0) setPexelsImgs(urls);
          setLoadingPexels(false);
        })
        .catch(() => { setLoadingPexels(false); });
    }
  }, [biz.industry, biz.customIndustry, hasLibraryImages]);

  const imgs = hasLibraryImages 
    ? getImgs(biz.industry) 
    : pexelsImgs.length > 0 
      ? pexelsImgs 
      : []; // empty array shows grey placeholder while loading
  const templateId = getTemplate(biz.industry);
  const stitchUrl = `https://www.exsisto.ai/stitch-templates/${templateId}.html`;

  const fallbackAI: AIContent = {
    headline: `${biz.name} — ${biz.city}'s Trusted Professionals`,
    tagline: "Quality service you can count on.",
    subtext: `Serving ${biz.city} with professional, reliable service. Contact us today for a free estimate.`,
    stat1: biz.stat1Value || biz.yearsInBusiness || "10+",
    stat1Label: biz.stat1Label || "Years in Business",
    stat2: biz.stat2Value || "500+",
    stat2Label: biz.stat2Label || "Happy Clients",
  };
  const indLabel = INDUSTRIES.find(i => i.id === biz.industry)?.label || biz.industry;
  const content: AIContent = {
    headline: (ai?.headline && ai.headline !== "undefined") ? ai.headline : fallbackAI.headline,
    tagline: (ai?.tagline && ai.tagline !== "undefined") ? ai.tagline : fallbackAI.tagline,
    subtext: (ai?.subtext && ai.subtext !== "undefined") ? ai.subtext 
      : `Trusted ${indLabel.toLowerCase()} services in ${biz.city}. Licensed, insured, and committed to excellence.`,
  };

  const starterHTML = buildStarterHTML(biz, content, imgs);
  const proHTML = buildProHTML(biz, content, imgs);

  const designs = [
    { id: "starter", label: "Starter", price: "$99/mo", badge: "Simple & Clean", description: "Clean, professional layout with your hero image" },
    { id: "pro",     label: "Pro",     price: "$299/mo", badge: "Rich & Detailed", description: "Split-hero layout with gallery and testimonials" },
    { id: "premium", label: "Premium", price: "$599/mo", badge: "✦ Full AI Design", description: "Full custom Stitch AI-generated design" },
  ];

  return (
    <div className="step-content step-wide">
      <div className="step-header">
        <h2>Pick your design</h2>
        <p>
          {loadingAI
            ? "✦ Writing your personalized copy…"
            : `Showing real previews for ${biz.name} · ${biz.city}`}
        </p>
      </div>

      {ai && (
        <div className="ai-bar">
          <div className="ai-bar-label">✦ AI-written for {biz.name}</div>
          <div className="ai-bar-headline">"{content.headline}"</div>
          <div className="ai-bar-sub">{content.tagline}</div>
        </div>
      )}

      {loadingPexels && (
        <div className="pexels-loading">
          <div className="pexels-spinner"></div>
          <span>Finding photos for {biz.customIndustry || biz.industry}…</span>
        </div>
      )}
      <div className="designs-grid" style={{opacity: loadingPexels ? 0.3 : 1, pointerEvents: loadingPexels ? 'none' : 'auto'}}>
        {designs.map((d, idx) => (
          <div key={d.id}
            className={`design-card ${selected === d.id ? "selected" : ""} ${d.id === "pro" ? "popular" : ""}`}
            onClick={() => setSelected(d.id)}>
            {d.id === "pro" && <div className="popular-ribbon">Most Popular</div>}

            <div className="design-header">
              <div className="design-tier-badge">{d.badge}</div>
              <div className="design-price">{d.price}</div>
            </div>

            {/* Preview iframe */}
            <div className="design-preview-wrap" onClick={e => { e.stopPropagation(); setFullscreen(d.id); }}>
              {d.id === "premium" ? (
                <iframe src={stitchUrl} className="design-iframe" title="Premium preview" />
              ) : (
                <iframe
                  srcDoc={d.id === "starter" ? starterHTML : proHTML}
                  className="design-iframe"
                  title={`${d.label} preview`}
                />
              )}
              <div className="design-preview-hover">
                <span>🔍 Click to expand</span>
              </div>
            </div>

            <div className="design-footer">
              <div className="design-label">{d.label} — {d.description}</div>
              {selected === d.id && <div className="design-selected">✓ Selected</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div className="fs-modal" onClick={() => setFullscreen(null)}>
          <div className="fs-modal-inner" onClick={e => e.stopPropagation()}>
            <div className="fs-modal-bar">
              <span>{designs.find(d => d.id === fullscreen)?.label} Preview — {biz.name}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {fullscreen === "premium" && (
                  <a href={stitchUrl} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">Open ↗</a>
                )}
                <button className="btn-ghost btn-sm" onClick={() => setFullscreen(null)}>✕ Close</button>
              </div>
            </div>
            {fullscreen === "premium" ? (
              <iframe src={stitchUrl} className="fs-iframe" title="Full preview" />
            ) : (
              <iframe
                srcDoc={fullscreen === "starter" ? starterHTML : proHTML}
                className="fs-iframe"
                title="Full preview"
              />
            )}
          </div>
        </div>
      )}

      <div className="step-actions">
        <button className="btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn-primary btn-lg" disabled={!selected}
          onClick={() => selected && onNext(selected)}>
          Choose This Design →
        </button>
      </div>
    </div>
  );
}

// ─── STEP 3: PLAN ─────────────────────────────────────────────────────────────
function StepPlan({ selectedDesign, onNext, onBack }: {
  selectedDesign: string;
  onNext: (planId: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState(selectedDesign);

  return (
    <div className="step-content">
      <div className="step-header">
        <h2>Confirm your plan</h2>
        <p>All plans include your website, weekly blogs, and social media management</p>
      </div>
      <div className="plan-grid">
        {PLANS.map(p => (
          <div key={p.id}
            className={`plan-card ${selected === p.id ? "selected" : ""} ${p.popular ? "popular" : ""}`}
            onClick={() => setSelected(p.id)}>
            {p.popular && <div className="popular-badge">Most Popular</div>}
            <div className="plan-name">{p.name}</div>
            <div className="plan-badge">{p.badge}</div>
            <div className="plan-price"><span className="plan-amt">{p.price}</span><span className="plan-per">{p.period}</span></div>
            <ul className="plan-feats">
              {p.features.map((f, i) => <li key={i}><span className="ck">✓</span>{f}</li>)}
            </ul>
            {selected === p.id && <div className="plan-sel">Selected ✓</div>}
          </div>
        ))}
      </div>
      <div className="step-actions">
        <button className="btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn-primary btn-lg" onClick={() => onNext(selected)}>Continue →</button>
      </div>
    </div>
  );
}

// ─── STEP 4: SIGNUP ───────────────────────────────────────────────────────────
function StepSignup({ biz, planId, onBack }: { biz: BizInfo; planId: string; onBack: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const plan = PLANS.find(p => p.id === planId) || PLANS[1];
  const ind = INDUSTRIES.find(i => i.id === biz.industry);

  async function submit() {
    if (!email.trim()) return setError("Email is required");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, businessName: biz.name, industry: biz.industry, city: biz.city, phone: biz.phone, planId }),
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
        <p>Create your account — we'll start building immediately</p>
      </div>
      <div className="order-box">
        <div className="order-title">Order Summary</div>
        <div className="order-row"><span>Business</span><span>{biz.name} · {biz.city}</span></div>
        <div className="order-row"><span>Industry</span><span>{ind?.emoji} {ind?.label}</span></div>
        <div className="order-row"><span>Plan</span><span className="order-plan-val">{plan.name} — {plan.price}/mo</span></div>
        <div className="order-divider" />
        <div className="order-row order-total"><span>Due today</span><span>{plan.price}/mo</span></div>
      </div>
      <div className="form-group">
        <label>Email *</label>
        <input className="form-input" type="email" placeholder="you@yourbusiness.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Password *</label>
        <input className="form-input" type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      {error && <div className="error-msg">{error}</div>}
      <button className="btn-primary btn-lg btn-full" onClick={submit} disabled={loading}>
        {loading ? "Creating your account…" : `Create Account & Pay ${plan.price}/mo →`}
      </button>
      <p className="terms">By signing up you agree to our Terms of Service. Cancel anytime.</p>
      <div className="step-actions" style={{ marginTop: "12px" }}>
        <button className="btn-ghost" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function PreviewPage() {
  const [step, setStep] = useState(0);
  const [biz, setBiz] = useState<BizInfo | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [ai, setAI] = useState<AIContent | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  function onInfo(b: BizInfo) {
    setBiz(b);
    setStep(1);
  }

  async function onAbout(extra: Partial<BizInfo>) {
    const fullBiz = { ...biz!, ...extra };
    setBiz(fullBiz);
    setStep(2);
    setLoadingAI(true);
    setAI(null);
    try {
      const res = await fetch("/api/generate-preview-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullBiz),
      });
      const data = await res.json();
      setAI(data);
    } catch { /* silently fail — fallback text used */ }
    setLoadingAI(false);
  }

  return (
    <div className="preview-page">
      <nav className="preview-nav">
        <div className="preview-nav-logo">Exsisto</div>
        <div className="preview-nav-tag">✦ Build your site in 60 seconds</div>
      </nav>
      <div className="preview-container">
        <StepBar step={step} />
        {step === 0 && <StepInfo onNext={onInfo} />}
        {step === 1 && biz && (
          <StepAbout biz={biz} onNext={onAbout} onBack={() => setStep(0)} />
        )}
        {step === 2 && biz && (
          <StepDesign biz={biz} ai={ai} loadingAI={loadingAI}
            onNext={pid => { setPlanId(pid); setStep(3); }}
            onBack={() => setStep(1)} />
        )}
        {step === 3 && planId && (
          <StepPlan selectedDesign={planId}
            onNext={pid => { setPlanId(pid); setStep(4); }}
            onBack={() => setStep(2)} />
        )}
        {step === 4 && biz && planId && (
          <StepSignup biz={biz} planId={planId} onBack={() => setStep(3)} />
        )}
      </div>
    </div>
  );
}

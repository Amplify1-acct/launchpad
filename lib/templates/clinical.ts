import { SiteData } from "./trades";

export function generateClinicalTemplate(data: SiteData): string {
  const b = data.business;
  const businessName = b.name;
  const tagline = b.tagline;
  const city = b.city;
  const state = b.state;
  const phone = b.phone;
  const email = b.email;
  const address = b.address;
  const accentColor = b.accent_color || "#0d7694";
  const industry = b.industry || "Medical";
  const services = (data.website?.services || []).map((s: any) => s.name || s).slice(0, 3);
  const stats = data.website?.stats || [];

  const primaryDark = "#005c75";

  const serviceIcons: Record<string, string> = {
    "General Dentistry": "dentistry",
    "Teeth Whitening": "brightness_high",
    "Invisalign": "health_and_safety",
    "Primary Care": "favorite",
    "Urgent Care": "emergency",
    "Pediatric Care": "child_care",
    "Chiropractic": "accessibility_new",
    "Physical Therapy": "sports_gymnastics",
    "Mental Health": "psychology",
  };

  const defaultStats = stats.length > 0 ? stats : [
    { num: "15+", label: "Years Experience" },
    { num: "3,000+", label: "Happy Patients" },
    { num: "99%", label: "Satisfaction" },
  ];

  const navLabel = industry.toLowerCase().includes("dental") ? "Our Services" :
    industry.toLowerCase().includes("law") ? "Practice Areas" : "Services";

  const ctaLabel = industry.toLowerCase().includes("dental") ? "Book Appointment" :
    industry.toLowerCase().includes("law") ? "Free Consultation" : "Schedule Visit";

  const heroHeadline = `${industry} in <span style="color:${accentColor}">${city || "Your City"}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${businessName}${city ? ` | ${city}, ${state}` : ""}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          "primary": "${primaryDark}",
          "primary-container": "${accentColor}",
          "on-primary": "#ffffff",
          "surface": "#f7fafc",
          "surface-container-low": "#f1f4f6",
          "surface-container-lowest": "#ffffff",
          "surface-container-high": "#e6e8eb",
          "on-surface": "#181c1e",
          "on-surface-variant": "#3f484d",
          "secondary-container": "#c6e4f3",
          "tertiary": "#7d4704",
        },
        fontFamily: { "headline": ["Manrope"], "body": ["Inter"] },
        borderRadius: { "DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem" },
      },
    },
  }
</script>
<style>
  .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; display: inline-block; vertical-align: middle; }
  .signature-gradient { background: linear-gradient(135deg, ${primaryDark} 0%, ${accentColor} 100%); }
</style>
</head>
<body class="bg-surface text-on-surface font-body">

<header class="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm font-headline">
<nav class="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
  <div class="text-xl font-bold" style="color:${primaryDark}">${businessName}</div>
  <div class="hidden md:flex items-center gap-8">
    <a class="font-semibold border-b-2 py-1" style="color:${accentColor};border-color:${accentColor}" href="#">${navLabel}</a>
    <a class="text-slate-600 hover:opacity-80 transition-opacity py-1" href="#">About</a>
    <a class="text-slate-600 hover:opacity-80 transition-opacity py-1" href="#">Contact</a>
  </div>
  <div class="flex items-center gap-6">
    ${phone ? `<a class="hidden lg:flex items-center gap-2 font-semibold hover:opacity-80" style="color:${primaryDark}" href="tel:${phone.replace(/\D/g, "")}"><span class="material-symbols-outlined text-lg">call</span>${phone}</a>` : ""}
    <button class="signature-gradient text-white px-6 py-2.5 rounded-md font-semibold">${ctaLabel}</button>
  </div>
</nav>
</header>

<main class="pt-20">

<section class="relative min-h-[700px] flex items-center overflow-hidden bg-surface">
  <div class="max-w-7xl mx-auto px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
    <div class="lg:col-span-6 z-10">
      <h1 class="font-headline text-5xl lg:text-7xl font-extrabold text-on-surface leading-[1.1] tracking-tight mb-8">${heroHeadline}</h1>
      <p class="font-body text-xl text-on-surface-variant leading-relaxed mb-10 max-w-xl">
        ${tagline || `${businessName} provides expert ${industry.toLowerCase()} services in ${city}, ${state} with compassionate, patient-centered care.`}
      </p>
      <div class="flex flex-col sm:flex-row gap-4">
        <button class="signature-gradient text-white px-8 py-4 rounded-md font-bold text-lg">${ctaLabel}</button>
        <button class="bg-surface-container-low px-8 py-4 rounded-md font-bold text-lg" style="color:${primaryDark}">Learn More</button>
      </div>
    </div>
    <div class="lg:col-span-6 relative h-[500px] lg:h-[600px] w-full rounded-2xl overflow-hidden shadow-2xl">
      <img src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=800&h=600&fit=crop&auto=format" alt="${businessName}" class="w-full h-full object-cover"/>
    </div>
  </div>
  <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20" style="background:${accentColor}"></div>
</section>

<section class="bg-surface-container-low py-16">
  <div class="max-w-7xl mx-auto px-8">
    <div class="grid grid-cols-1 md:grid-cols-${defaultStats.length} gap-12 text-center">
      ${defaultStats.map((s: any) => `<div class="space-y-2"><div class="font-headline text-4xl font-extrabold" style="color:${primaryDark}">${s.num}</div><div class="text-on-surface-variant font-medium tracking-wide">${s.label}</div></div>`).join("")}
    </div>
  </div>
</section>

<section class="py-24 bg-surface">
  <div class="max-w-7xl mx-auto px-8">
    <div class="mb-16">
      <h2 class="font-headline text-3xl lg:text-5xl font-extrabold text-on-surface mb-6">${navLabel}</h2>
      <p class="font-body text-lg text-on-surface-variant max-w-2xl">Expert care tailored to your needs, delivered with the latest technology and a compassionate approach.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-${Math.min(services.length || 3, 3)} gap-8">
      ${(services.length > 0 ? services : ["General Care", "Specialized Treatment", "Wellness Services"]).map((s: string) => `
      <div class="bg-surface-container-lowest p-8 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 group">
        <div class="w-14 h-14 bg-secondary-container rounded-lg flex items-center justify-center mb-8">
          <span class="material-symbols-outlined text-3xl" style="color:${primaryDark}">${serviceIcons[s] || "medical_services"}</span>
        </div>
        <h3 class="font-headline text-2xl font-bold text-on-surface mb-4">${s}</h3>
        <p class="text-on-surface-variant leading-relaxed mb-6">Expert ${s.toLowerCase()} services for ${city || "your community"} patients with personalized care plans.</p>
        <a class="font-semibold flex items-center gap-2" style="color:${accentColor}" href="#">Learn more <span class="material-symbols-outlined text-sm">arrow_forward</span></a>
      </div>`).join("")}
    </div>
  </div>
</section>

<section class="py-24 bg-surface-container-low">
  <div class="max-w-7xl mx-auto px-8 flex flex-col lg:flex-row gap-16 items-center">
    <div class="lg:w-1/2 relative">
      <div class="flex gap-1 mb-8">${[1,2,3,4,5].map(() => `<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;color:${accentColor}">star</span>`).join("")}</div>
      <blockquote class="font-headline text-2xl lg:text-4xl font-semibold text-on-surface leading-tight mb-8">
        "The care I received at ${businessName} was exceptional. I felt completely at ease from the moment I walked in."
      </blockquote>
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
          <span class="material-symbols-outlined" style="color:${accentColor}">person</span>
        </div>
        <div><p class="font-bold text-on-surface">A Happy Patient</p><p class="text-sm text-on-surface-variant">${city}, ${state}</p></div>
      </div>
    </div>
    <div class="lg:w-1/2">
      <div class="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
        <img src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=700&h=525&fit=crop&auto=format" alt="Patient experience" class="w-full h-full object-cover"/>
      </div>
    </div>
  </div>
</section>

<section class="py-24">
  <div class="max-w-5xl mx-auto px-8">
    <div class="signature-gradient rounded-[2rem] p-12 lg:p-20 text-center text-white shadow-2xl relative overflow-hidden">
      <div class="relative z-10">
        <h2 class="font-headline text-3xl lg:text-5xl font-extrabold mb-6">Ready to get started?</h2>
        <p class="text-lg lg:text-xl mb-10 max-w-2xl mx-auto opacity-90">${city ? `Serving ${city} and surrounding areas. ` : ""}Contact ${businessName} today to schedule your appointment.</p>
        <button class="bg-white px-10 py-5 rounded-md font-bold text-xl shadow-lg" style="color:${primaryDark}">${ctaLabel}</button>
      </div>
      <div class="absolute inset-0 opacity-10 pointer-events-none"><svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none"><circle cx="90" cy="10" r="30" fill="white"/><circle cx="10" cy="90" r="40" fill="white"/></svg></div>
    </div>
  </div>
</section>

</main>

<footer class="bg-slate-50 py-12 px-8 text-sm">
  <div class="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
    <div><div class="font-headline font-bold text-lg mb-6" style="color:${primaryDark}">${businessName}</div><p class="text-slate-500 leading-relaxed">Providing expert ${industry.toLowerCase()} care with compassion${city ? ` in ${city}, ${state}` : ""}.</p></div>
    <div><h4 class="font-bold mb-6" style="color:${primaryDark}">Services</h4><ul class="space-y-4">${(services.length > 0 ? services : ["General Care"]).map((s: string) => `<li><a class="text-slate-500 hover:opacity-80" href="#">${s}</a></li>`).join("")}</ul></div>
    <div><h4 class="font-bold mb-6" style="color:${primaryDark}">Contact</h4><ul class="space-y-4">${address ? `<li class="flex items-start gap-3 text-slate-500"><span class="material-symbols-outlined text-lg" style="color:${accentColor}">location_on</span>${address}</li>` : ""}${phone ? `<li class="flex items-center gap-3 text-slate-500"><span class="material-symbols-outlined text-lg" style="color:${accentColor}">phone</span>${phone}</li>` : ""}${email ? `<li class="flex items-center gap-3 text-slate-500"><span class="material-symbols-outlined text-lg" style="color:${accentColor}">mail</span>${email}</li>` : ""}</ul></div>
    <div><h4 class="font-bold mb-6" style="color:${primaryDark}">Hours</h4><ul class="space-y-4 text-slate-500"><li class="flex justify-between"><span>Mon–Thu:</span><span>8am–5pm</span></li><li class="flex justify-between"><span>Friday:</span><span>8am–3pm</span></li><li class="flex justify-between font-semibold text-red-500"><span>Sat–Sun:</span><span>Closed</span></li></ul></div>
  </div>
  <div class="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 text-slate-400 text-center">© ${new Date().getFullYear()} ${businessName}. All rights reserved.</div>
</footer>
</body>
</html>`;
}

// ─── CURATED PHOTO LIBRARY ────────────────────────────────────────────────────
// Hand-picked Pexels photos per industry.
// Multiple options per category — we pick randomly for variety.
// All landscape orientation, high resolution, professional quality.

export type PhotoSet = {
  hero: string[];       // Full-width hero images
  interior?: string[];  // Interior/detail shots used in about/services sections
};

const PX = "https://images.pexels.com/photos";

export const INDUSTRY_PHOTOS: Record<string, PhotoSet> = {

  // ── LAW ────────────────────────────────────────────────────────────────────
  law: {
    hero: [
      `${PX}/5668473/pexels-photo-5668473.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // attorney at desk, serious
      `${PX}/3771097/pexels-photo-3771097.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // law office, books
      `${PX}/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // lawyer signing document
      `${PX}/8112199/pexels-photo-8112199.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // law firm meeting room
      `${PX}/5669619/pexels-photo-5669619.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // attorney professional
    ],
    interior: [
      `${PX}/5668882/pexels-photo-5668882.jpeg?auto=compress&cs=tinysrgb&w=800`,   // law library
      `${PX}/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=800`,   // office meeting
    ],
  },

  // ── FINANCIAL / ACCOUNTING ─────────────────────────────────────────────────
  financial: {
    hero: [
      `${PX}/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // business meeting professional
      `${PX}/7681091/pexels-photo-7681091.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // financial advisor desk
      `${PX}/5849559/pexels-photo-5849559.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // accountant working
      `${PX}/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // team meeting office
      `${PX}/6694900/pexels-photo-6694900.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // financial charts meeting
    ],
    interior: [
      `${PX}/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800`,
      `${PX}/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── CONSULTING ─────────────────────────────────────────────────────────────
  consulting: {
    hero: [
      `${PX}/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // whiteboard strategy
      `${PX}/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // team collaboration
      `${PX}/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // business professional
      `${PX}/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // business meeting
      `${PX}/5439381/pexels-photo-5439381.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // consultant presenting
    ],
    interior: [
      `${PX}/3182781/pexels-photo-3182781.jpeg?auto=compress&cs=tinysrgb&w=800`,
      `${PX}/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── REAL ESTATE ────────────────────────────────────────────────────────────
  "real estate": {
    hero: [
      `${PX}/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // modern house exterior
      `${PX}/1643389/pexels-photo-1643389.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // beautiful home
      `${PX}/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1400`,    // luxury real estate
      `${PX}/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // home with pool
      `${PX}/7578936/pexels-photo-7578936.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // real estate agent showing home
    ],
    interior: [
      `${PX}/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800`,
      `${PX}/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── INSURANCE ──────────────────────────────────────────────────────────────
  insurance: {
    hero: [
      `${PX}/3760072/pexels-photo-3760072.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // insurance meeting
      `${PX}/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // professional handshake
      `${PX}/5849577/pexels-photo-5849577.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // advisor with client
      `${PX}/3182746/pexels-photo-3182746.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // office professional
    ],
    interior: [
      `${PX}/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── PLUMBING ───────────────────────────────────────────────────────────────
  plumbing: {
    hero: [
      `${PX}/8486972/pexels-photo-8486972.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // plumber working under sink
      `${PX}/6474471/pexels-photo-6474471.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // plumber with tools
      `${PX}/8486971/pexels-photo-8486971.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // pipe work professional
      `${PX}/4108712/pexels-photo-4108712.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // worker with wrench
    ],
    interior: [
      `${PX}/6474508/pexels-photo-6474508.jpeg?auto=compress&cs=tinysrgb&w=800`,
      `${PX}/8486970/pexels-photo-8486970.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── ROOFING ────────────────────────────────────────────────────────────────
  roofing: {
    hero: [
      `${PX}/1249611/pexels-photo-1249611.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // roofer on roof
      `${PX}/8961065/pexels-photo-8961065.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // roofing work
      `${PX}/5974042/pexels-photo-5974042.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // contractor on roof
      `${PX}/2760241/pexels-photo-2760241.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // house roofing project
    ],
    interior: [
      `${PX}/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── HVAC ───────────────────────────────────────────────────────────────────
  hvac: {
    hero: [
      `${PX}/4489794/pexels-photo-4489794.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // hvac technician
      `${PX}/8961070/pexels-photo-8961070.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // ac unit work
      `${PX}/5691659/pexels-photo-5691659.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // technician tools
      `${PX}/4489795/pexels-photo-4489795.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // hvac professional
    ],
    interior: [
      `${PX}/4489796/pexels-photo-4489796.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── ELECTRICAL ─────────────────────────────────────────────────────────────
  electrical: {
    hero: [
      `${PX}/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=1400`,    // electrician panel
      `${PX}/8961074/pexels-photo-8961074.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // electrician working
      `${PX}/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // wiring professional
      `${PX}/5691661/pexels-photo-5691661.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // electrical work
    ],
    interior: [
      `${PX}/8961079/pexels-photo-8961079.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── CONTRACTOR / GENERAL ───────────────────────────────────────────────────
  contractor: {
    hero: [
      `${PX}/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // contractor site
      `${PX}/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // construction work
      `${PX}/3760529/pexels-photo-3760529.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // builder professional
      `${PX}/1530760/pexels-photo-1530760.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // construction team
    ],
    interior: [
      `${PX}/1537451/pexels-photo-1537451.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── LANDSCAPING ────────────────────────────────────────────────────────────
  landscaping: {
    hero: [
      `${PX}/1453499/pexels-photo-1453499.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // beautiful garden
      `${PX}/775201/pexels-photo-775201.jpeg?auto=compress&cs=tinysrgb&w=1400`,    // landscaping work
      `${PX}/1002703/pexels-photo-1002703.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // manicured lawn
      `${PX}/6231586/pexels-photo-6231586.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // landscaper working
      `${PX}/1458694/pexels-photo-1458694.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // garden design
    ],
    interior: [
      `${PX}/1105019/pexels-photo-1105019.jpeg?auto=compress&cs=tinysrgb&w=800`,
      `${PX}/1453499/pexels-photo-1453499.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── CLEANING ───────────────────────────────────────────────────────────────
  cleaning: {
    hero: [
      `${PX}/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // cleaner professional
      `${PX}/4107278/pexels-photo-4107278.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // house cleaning
      `${PX}/6195130/pexels-photo-6195130.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // cleaning service
      `${PX}/4239092/pexels-photo-4239092.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // spotless clean home
    ],
    interior: [
      `${PX}/4239098/pexels-photo-4239098.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── PAINTING ───────────────────────────────────────────────────────────────
  painting: {
    hero: [
      `${PX}/1669754/pexels-photo-1669754.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // painter at work
      `${PX}/6474473/pexels-photo-6474473.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // house painting
      `${PX}/1669755/pexels-photo-1669755.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // painting detail
      `${PX}/4792509/pexels-photo-4792509.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // professional painter
    ],
    interior: [
      `${PX}/6474474/pexels-photo-6474474.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── SALON / BEAUTY ─────────────────────────────────────────────────────────
  salon: {
    hero: [
      `${PX}/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // hair salon styling
      `${PX}/3997989/pexels-photo-3997989.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // salon professional
      `${PX}/3993444/pexels-photo-3993444.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // hair stylist
      `${PX}/1570807/pexels-photo-1570807.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // beauty salon interior
      `${PX}/3992870/pexels-photo-3992870.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // salon chair
    ],
    interior: [
      `${PX}/3993456/pexels-photo-3993456.jpeg?auto=compress&cs=tinysrgb&w=800`,
      `${PX}/1570807/pexels-photo-1570807.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── SPA / WELLNESS ─────────────────────────────────────────────────────────
  spa: {
    hero: [
      `${PX}/3997993/pexels-photo-3997993.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // spa treatment
      `${PX}/3757952/pexels-photo-3757952.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // wellness spa
      `${PX}/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // massage therapy
      `${PX}/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // spa interior
    ],
    interior: [
      `${PX}/3757943/pexels-photo-3757943.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── FITNESS ────────────────────────────────────────────────────────────────
  fitness: {
    hero: [
      `${PX}/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // gym workout
      `${PX}/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=1400`,    // personal trainer
      `${PX}/416717/pexels-photo-416717.jpeg?auto=compress&cs=tinysrgb&w=1400`,    // fitness class
      `${PX}/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // gym interior
    ],
    interior: [
      `${PX}/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── MEDICAL / DENTAL ───────────────────────────────────────────────────────
  medical: {
    hero: [
      `${PX}/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // doctor office
      `${PX}/3376790/pexels-photo-3376790.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // medical professional
      `${PX}/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // clinic interior
      `${PX}/4033148/pexels-photo-4033148.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // doctor with patient
    ],
    interior: [
      `${PX}/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── PHOTOGRAPHY ────────────────────────────────────────────────────────────
  photography: {
    hero: [
      `${PX}/3800517/pexels-photo-3800517.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // photographer studio
      `${PX}/1264210/pexels-photo-1264210.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // photographer working
      `${PX}/3004165/pexels-photo-3004165.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // photography session
      `${PX}/3800517/pexels-photo-3800517.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // camera professional
    ],
    interior: [
      `${PX}/1264210/pexels-photo-1264210.jpeg?auto=compress&cs=tinysrgb&w=800`,
    ],
  },

  // ── PEST CONTROL ───────────────────────────────────────────────────────────
  pest: {
    hero: [
      `${PX}/5472314/pexels-photo-5472314.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // pest control worker
      `${PX}/6195121/pexels-photo-6195121.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // exterminator professional
      `${PX}/5472313/pexels-photo-5472313.jpeg?auto=compress&cs=tinysrgb&w=1400`,  // pest control spray
    ],
    interior: [],
  },

};

// ── FALLBACKS BY TEMPLATE TYPE ─────────────────────────────────────────────
export const TEMPLATE_FALLBACKS: Record<string, string[]> = {
  professional: [
    `${PX}/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1400`,
    `${PX}/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1400`,
    `${PX}/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1400`,
  ],
  trades: [
    `${PX}/1249611/pexels-photo-1249611.jpeg?auto=compress&cs=tinysrgb&w=1400`,
    `${PX}/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=1400`,
    `${PX}/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=1400`,
  ],
};

// ── LOOKUP FUNCTION ────────────────────────────────────────────────────────
export function getPhotos(industry: string, template: string): PhotoSet {
  const lower = industry.toLowerCase();

  const matches: [string, PhotoSet][] = Object.entries(INDUSTRY_PHOTOS)
    .filter(([key]) => lower.includes(key));

  if (matches.length > 0) return matches[0][1];

  // Fallback by template type
  return {
    hero: TEMPLATE_FALLBACKS[template] || TEMPLATE_FALLBACKS.trades,
  };
}

export function pickHero(industry: string, template: string): string {
  const photos = getPhotos(industry, template);
  const pool = photos.hero;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickInterior(industry: string, template: string): string {
  const photos = getPhotos(industry, template);
  const pool = photos.interior?.length ? photos.interior : photos.hero;
  return pool[Math.floor(Math.random() * pool.length)];
}

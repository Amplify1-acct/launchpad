export interface BlogPost {
  slug: string;
  industry: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  author: string;
  authorRole: string;
  image: string;
  content: Section[];
}

interface Section {
  type: "intro" | "h2" | "p" | "ul" | "tip" | "cta";
  text?: string;
  items?: string[];
}

export const posts: BlogPost[] = [
  {
    slug: "5-signs-you-need-a-new-water-heater",
    industry: "Plumbing",
    title: "5 Signs You Need a New Water Heater (And What to Do About It)",
    excerpt: "Most homeowners don't think about their water heater until something goes wrong. Here's how to spot the warning signs early — before you're left with a cold shower and a flooded basement.",
    readTime: "4 min read",
    date: "March 18, 2026",
    author: "Mike's Plumbing",
    authorRole: "Licensed Master Plumber · Serving NJ since 2004",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&h=600&fit=crop&auto=format",
    content: [
      { type: "intro", text: "Most homeowners don't think about their water heater until something goes wrong. But a failing water heater rarely dies without warning — it gives you plenty of signals first. Catching them early can save you thousands in emergency repairs, water damage, and sky-high energy bills." },
      { type: "h2", text: "1. Your water isn't as hot as it used to be" },
      { type: "p", text: "If you've noticed lukewarm showers even when the tap is turned all the way to hot, your water heater is struggling. This usually means the heating elements are wearing out, or sediment has built up so thick at the bottom of the tank that it's insulating the water from the heat source. Either way, it's a clear sign the unit is on its way out." },
      { type: "h2", text: "2. You hear rumbling, popping, or banging sounds" },
      { type: "p", text: "As sediment hardens at the bottom of the tank over the years, the water heater has to work harder to heat the water above it. That extra strain causes the sediment to crack and pop — those weird noises you're hearing. Beyond being annoying, this puts serious stress on the tank and dramatically shortens its lifespan." },
      { type: "h2", text: "3. You see rust or discoloration in your hot water" },
      { type: "p", text: "Rusty or brownish hot water is one of the most alarming signs. It typically means one of two things: the anode rod (a sacrificial metal rod that prevents rust inside the tank) has worn out, or the tank itself has started to corrode from the inside. If the rust is only in your hot water and not your cold, the water heater is almost certainly the culprit." },
      { type: "h2", text: "4. You notice water pooling around the base" },
      { type: "p", text: "Any moisture around the base of your water heater is a red flag. Small leaks can be caused by a loose connection or faulty pressure relief valve — both fixable. But if the tank itself is leaking, that's a sign the metal has expanded and cracked over years of heating cycles, and replacement is the only safe option. Don't ignore even a small puddle." },
      { type: "h2", text: "5. Your unit is more than 10 years old" },
      { type: "p", text: "The average tank water heater lasts 8–12 years. If yours is approaching or past that mark, it's worth having a plumber take a look — even if you haven't noticed obvious symptoms yet. Proactive replacement is almost always cheaper than emergency replacement after a failure, and modern units are significantly more energy efficient, which means lower monthly bills." },
      { type: "tip", text: "Pro tip: Check the serial number on your water heater. The first two digits usually indicate the year of manufacture. A unit made in 2013 or earlier is living on borrowed time." },
      { type: "h2", text: "What to do next" },
      { type: "ul", items: [
        "If your unit is under 8 years old and showing one symptom, call a plumber for an inspection — it may just need a part replaced.",
        "If it's over 10 years old or showing multiple symptoms, start planning for replacement. Budget $800–$1,500 for a standard tank unit installed.",
        "Consider upgrading to a tankless water heater — they last 20+ years and can cut your water heating costs by up to 30%.",
        "Never ignore water pooling around the base. Shut off the cold water supply to the tank and call a plumber same day."
      ]},
      { type: "cta", text: "Not sure if your water heater needs repair or replacement? We offer free inspections for homeowners in the area. Give us a call and we'll give you an honest assessment — no upselling, no pressure." },
    ],
  },
  {
    slug: "how-to-prepare-for-your-family-photo-session",
    industry: "Photography",
    title: "How to Prepare for Your Family Photo Session (And Actually Enjoy It)",
    excerpt: "The secret to great family photos isn't finding the perfect location or wearing matching outfits. It's showing up relaxed, prepared, and ready to have fun. Here's everything you need to know.",
    readTime: "5 min read",
    date: "March 20, 2026",
    author: "Sarah Kim Photography",
    authorRole: "Family & Wedding Photographer · NJ & NYC",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191011?w=1200&h=600&fit=crop&auto=format",
    content: [
      { type: "intro", text: "I've photographed hundreds of families, and the sessions that produce the most beautiful, authentic images have almost nothing to do with the outfits or the location. They come down to one thing: how relaxed and present everyone is. Here's how to set your family up for a session you'll actually enjoy." },
      { type: "h2", text: "Start with outfits — but don't overthink them" },
      { type: "p", text: "You don't need to match perfectly. In fact, perfectly matching outfits can look stiff and dated. Instead, aim for a coordinated color palette — pick 2-3 colors that complement each other and have each family member wear something in those tones. Earthy neutrals (cream, tan, olive, rust) photograph beautifully and age well. Avoid busy patterns and large logos, which distract from faces." },
      { type: "tip", text: "Lay everyone's outfits flat together and take a photo on your phone before the session. If it looks cohesive there, it'll look cohesive in the photos." },
      { type: "h2", text: "Pick the right time of day" },
      { type: "p", text: "If you have young kids, this is the single most important decision you'll make. Schedule the session during their best window — usually mid-morning after breakfast, or late afternoon before the dinner meltdown. For outdoor sessions, the hour after sunrise and the hour before sunset (called golden hour) give you the softest, most flattering light. Midday sun creates harsh shadows and squinting — avoid it if you can." },
      { type: "h2", text: "Brief the kids honestly" },
      { type: "p", text: "Don't tell young kids we're going to take photos. Tell them we're going to a fun place to play, and someone is going to take some pictures. The less pressure they feel, the more natural they'll look. For older kids, let them have some input — maybe they get to pick a location they love, or they get to suggest a fun shot idea. Ownership = cooperation." },
      { type: "h2", text: "On the day of: give yourself a buffer" },
      { type: "p", text: "Rushing to a session is the fastest way to make everyone stressed and stiff. Plan to arrive 10-15 minutes early. Use that time to let the kids run around, explore the space, and burn off nervous energy. By the time we start shooting, they're settled and you're relaxed." },
      { type: "ul", items: [
        "Bring snacks — a hungry toddler is an uncooperative toddler",
        "Skip nap time right before the session so kids aren't groggy",
        "Let kids bring one comfort item (stuffed animal, toy) for pre-session warmup",
        "Don't threaten or bribe kids right before we start — it backfires",
        "Trust your photographer to bring out the smiles — that's our job"
      ]},
      { type: "h2", text: "What about posing?" },
      { type: "p", text: "I'll guide you through everything, so you never have to worry about what to do with your hands. My sessions are built around real interactions — walking together, whispering something funny to your partner, parents lifting the kids, siblings chasing each other. The posed shots are quick. The candid moments between them are where the magic happens." },
      { type: "cta", text: "Ready to book your session? Spring mini sessions are now open with limited spots available. Reach out to check availability and I'll send you my full prep guide with location suggestions, outfit ideas, and everything else you need." },
    ],
  },
  {
    slug: "home-staging-tips-that-actually-work",
    industry: "Real Estate",
    title: "10 Home Staging Tips That Actually Sell Homes Faster (And for More Money)",
    excerpt: "Staged homes sell 73% faster and for up to 10% more than unstaged homes. But you don't need to spend a fortune to make a huge difference. Here are the tips that actually move the needle.",
    readTime: "6 min read",
    date: "March 22, 2026",
    author: "Johnson Realty Group",
    authorRole: "Top 1% Realtors in NJ · Serving Westfield & Surrounding Areas",
    image: "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1200&h=600&fit=crop&auto=format",
    content: [
      { type: "intro", text: "Staged homes sell 73% faster and for up to 10% more than unstaged homes, according to the National Association of Realtors. But effective staging doesn't require a designer or a big budget. After helping hundreds of families sell their homes in this market, here are the moves that actually make a difference." },
      { type: "h2", text: "1. Depersonalize ruthlessly" },
      { type: "p", text: "The goal of staging is to help buyers picture themselves living in the home — not to remind them that you live there. Remove family photos, kids' artwork on the fridge, monogrammed items, and religious decor. Box up trophies, diplomas, and collections. You want buyers to walk in and see a blank canvas for their life, not a museum of yours." },
      { type: "h2", text: "2. Deep clean everything — especially kitchens and bathrooms" },
      { type: "p", text: "Buyers notice dirt and smells instantly, even subconsciously. A professionally cleaned home signals that the property has been well maintained. Pay special attention to grout, baseboards, appliances, and windows. If you have pets, have the carpets professionally steam cleaned and use an odor eliminator — you've gone nose-blind to pet smell, but buyers haven't." },
      { type: "h2", text: "3. Maximize light" },
      { type: "p", text: "Light sells homes. Open every curtain and blind before showings. Replace any burned-out bulbs and consider upgrading to brighter LEDs throughout. For dark rooms, add a floor lamp or table lamp. Clean your windows inside and out — you'd be amazed how much light dirty windows block." },
      { type: "tip", text: "Turn on every light in the house before buyers arrive, even during the day. A bright home always feels larger and more welcoming." },
      { type: "h2", text: "4. Neutralize paint colors" },
      { type: "p", text: "That bold red dining room might be your favorite thing about your house, but it's a distraction for buyers. Fresh paint in neutral tones (warm whites, light greiges, soft grays) is one of the highest-ROI investments you can make before listing. A $500 paint job can add thousands to your sale price and dramatically speed up your timeline." },
      { type: "h2", text: "5. Edit furniture ruthlessly" },
      { type: "p", text: "Most rooms have too much furniture for showings. Remove 30-50% of what's in each room to make spaces feel larger and allow easy traffic flow. If you have oversized furniture, consider renting a storage unit for the listing period. The goal is for every room to feel spacious and airy." },
      { type: "ul", items: [
        "Remove extra chairs, side tables, and decorative items that clutter visual space",
        "Pull furniture away from walls slightly — it makes rooms look larger",
        "Clear kitchen counters completely except for 1-2 intentional items",
        "Make every bed with crisp, hotel-quality linens",
        "Replace worn towels in bathrooms with fresh white ones",
        "Add a simple centerpiece to the dining table — a bowl of lemons or fresh flowers"
      ]},
      { type: "h2", text: "6. Don't forget curb appeal" },
      { type: "p", text: "Buyers form their first impression before they even walk through the door. Mow the lawn, trim hedges, pull weeds, and pressure wash the driveway and walkway. A fresh coat of paint on the front door and new house numbers can completely transform how a home photographs and how buyers feel pulling up." },
      { type: "h2", text: "7. Address every deferred maintenance item" },
      { type: "p", text: "Buyers make mental deductions for every flaw they notice. A dripping faucet, a cracked outlet cover, a squeaky door — each one makes them wonder what else hasn't been maintained. Walk through your home with a buyer's eye and fix every small thing. The cost is minimal; the perception shift is enormous." },
      { type: "cta", text: "Thinking about selling? We offer a free home valuation and pre-listing consultation where we walk through exactly what to do (and not do) to maximize your sale price. No obligation, just honest advice from a team that has sold over 300 homes in this market." },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find(p => p.slug === slug);
}

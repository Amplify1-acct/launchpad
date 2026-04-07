import { createAdminClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "exsisto-internal-2026";
export const maxDuration = 120;

const POSTS_PER_PLAN: Record<string, number> = {
  starter: 2,
  pro: 4,
  premium: 8,
};

async function generateBlogPost(
  client: Anthropic,
  businessName: string,
  industry: string,
  city: string,
  topic: string,
  services: string[]
): Promise<{ title: string; content: string; word_count: number }> {
  const servicesText = services.length > 0 ? services.join(", ") : industry;

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `Write a professional blog post for a local ${industry} business called "${businessName}" in ${city}.

Topic: ${topic}
Services they offer: ${servicesText}

Requirements:
- 600-800 words
- Conversational but professional tone
- Include practical tips or insights for local customers
- Naturally mention the business name 2-3 times
- Include a call to action at the end
- Format with a clear title on the first line, then the body
- No markdown headers (##), just plain paragraphs
- Start the body directly after the title line

Return ONLY the blog post with title on line 1, blank line, then body. No preamble.`
    }]
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const lines = text.trim().split("\n");
  const title = lines[0].replace(/^#+ /, "").trim();
  const content = lines.slice(2).join("\n").trim();
  const word_count = content.split(/\s+/).length;

  return { title, content, word_count };
}

function getBlogTopics(industry: string, businessName: string, city: string): string[] {
  const topics: Record<string, string[]> = {
    dental: [
      `Top 5 reasons residents of ${city} trust ${businessName} for their dental care`,
      `How often should you really visit the dentist? A guide for ${city} families`,
      `The truth about teeth whitening: what works and what doesn't`,
      `Children's dental health: starting good habits early`,
      `What to do in a dental emergency in ${city}`,
      `Understanding dental insurance: a guide for ${city} residents`,
      `The link between oral health and overall wellness`,
      `Invisalign vs. traditional braces: which is right for you?`,
    ],
    plumbing: [
      `5 signs your ${city} home needs a plumber right now`,
      `How to prevent frozen pipes this winter in ${city}`,
      `Water heater maintenance tips from ${businessName}`,
      `When to repair vs. replace your plumbing fixtures`,
      `Common causes of low water pressure and how to fix them`,
      `Why you should never ignore a slow drain`,
      `The true cost of a hidden water leak in your ${city} home`,
      `How to choose the right plumber in ${city}`,
    ],
    hvac: [
      `How to lower your energy bills this summer in ${city}`,
      `When is it time to replace your AC unit?`,
      `HVAC maintenance checklist for ${city} homeowners`,
      `The importance of changing your air filter regularly`,
      `Heat pump vs. central air: what's best for ${city} homes?`,
      `Signs your furnace needs repair before winter hits`,
      `Indoor air quality tips for ${city} families`,
      `How to choose the right HVAC contractor in ${city}`,
    ],
    auto: [
      `5 signs your car needs body work — don't ignore these`,
      `How to choose the right auto body shop in ${city}`,
      `The difference between paint touch-up and full respray`,
      `What to do after a fender bender in ${city}`,
      `How weather affects your car's paint and what to do about it`,
      `Paintless dent repair: when it works and when it doesn't`,
      `How ${businessName} handles insurance claims seamlessly`,
      `Why genuine parts matter for your vehicle's repair`,
    ],
    law: [
      `What to do immediately after an accident in ${city}`,
      `Understanding your rights as a personal injury victim in ${city}`,
      `How long does a personal injury case take in ${city}?`,
      `Common mistakes that hurt your injury claim`,
      `How ${businessName} fights for maximum compensation`,
      `The statute of limitations for injury claims in your state`,
      `What is comparative negligence and how does it affect your case?`,
      `Why you should never talk to insurance adjusters without a lawyer`,
    ],
    restaurant: [
      `The story behind ${businessName}: why we started and what drives us`,
      `Farm-to-table dining in ${city}: how we source our ingredients`,
      `Perfect pairings: our guide to wine and food at ${businessName}`,
      `Hosting your next event at ${businessName}: what you need to know`,
      `Our chef's favorite dishes and the stories behind them`,
      `Seasonal menu changes: what's new at ${businessName} this season`,
      `The best restaurants in ${city}: our neighborhood guide`,
      `Why ${city} diners keep coming back to ${businessName}`,
    ],
    salon: [
      `How to maintain your color between visits to ${businessName}`,
      `The hottest hair trends in ${city} this season`,
      `Balayage vs. highlights: which technique is right for you?`,
      `How to choose the right haircut for your face shape`,
      `Keratin treatments: everything ${city} clients need to know`,
      `Building a hair care routine that actually works`,
      `Why ${businessName} uses professional-grade products only`,
      `How to prepare for your first visit to ${businessName}`,
    ],
    gym: [
      `How to start working out when you have no idea where to begin`,
      `The best workout routine for busy ${city} professionals`,
      `Why personal training at ${businessName} gets faster results`,
      `Nutrition basics: fueling your fitness goals`,
      `How to stay motivated when the gym feels like a chore`,
      `Group fitness vs. solo training: which is right for you?`,
      `Recovery days: why rest is part of your fitness plan`,
      `${businessName}'s guide to setting realistic fitness goals`,
    ],
    realestate: [
      `The ${city} real estate market: what buyers need to know right now`,
      `How to price your ${city} home to sell quickly`,
      `First-time home buyer's guide to ${city} neighborhoods`,
      `How ${businessName} gets sellers top dollar in any market`,
      `Investment properties in ${city}: where to start`,
      `Common mistakes home buyers make and how to avoid them`,
      `What to look for in a ${city} real estate agent`,
      `How to negotiate the best deal in a competitive market`,
    ],
    pet: [
      `How often should your dog be professionally groomed?`,
      `Signs your pet is stressed and what to do about it`,
      `${businessName}'s guide to choosing the right boarding facility`,
      `Puppy training basics every ${city} dog owner should know`,
      `The benefits of doggy daycare for your pet's social development`,
      `How to prepare your pet for grooming day`,
      `Seasonal pet care tips for ${city} pet owners`,
      `Why professional grooming is healthier than bathing at home`,
    ],
    bakery: [
      `The story behind ${businessName}: baked with love in ${city}`,
      `Custom cakes for every occasion: how we bring your vision to life`,
      `Our most popular items and why ${city} can't get enough`,
      `Gluten-free baking: how we make it taste just as good`,
      `How to order a custom wedding cake from ${businessName}`,
      `The secret to our signature sourdough`,
      `Seasonal flavors: what's fresh at ${businessName} this month`,
      `Why ${city} chooses ${businessName} for every celebration`,
    ],
    lawn_care: [
      `Spring lawn care checklist for ${city} homeowners`,
      `How to choose the right plants for ${city}'s climate`,
      `The benefits of professional landscaping for your home's value`,
      `Drought-resistant landscaping ideas for ${city} yards`,
      `How ${businessName} transforms outdoor spaces`,
      `Fall landscaping prep: getting your yard ready for winter`,
      `Irrigation systems: do you really need one in ${city}?`,
      `Low-maintenance landscaping ideas for busy homeowners`,
    ],
    landscaping: [
      `Spring lawn care checklist for ${city} homeowners`,
      `How to choose the right plants for ${city}'s climate`,
      `The benefits of professional landscaping for your home's value`,
      `Drought-resistant landscaping ideas for ${city} yards`,
      `How ${businessName} transforms outdoor spaces`,
      `Fall landscaping prep: getting your yard ready for winter`,
      `Irrigation systems: do you really need one in ${city}?`,
      `Low-maintenance landscaping ideas for busy homeowners`,
    ],
  };

  const industryKey = industry.toLowerCase().trim();
  return topics[industryKey] || topics[industryKey.replace(/[^a-z]/g, "")] || [
    `Why ${city} businesses choose ${businessName}`,
    `How ${businessName} serves the ${city} community`,
    `The ${businessName} difference: quality you can count on`,
    `Getting started with ${businessName}: what to expect`,
    `Top questions ${city} customers ask ${businessName}`,
    `How ${businessName} stays ahead in ${city}`,
    `Customer success stories from ${businessName}`,
    `${businessName}'s commitment to the ${city} community`,
  ];
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-internal-secret");
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, business_id } = await request.json() as { email?: string; business_id?: string };
    const supabase = createAdminClient();
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let bizId = business_id;

    // Look up by email if no business_id
    if (!bizId && email) {
      const { data: customer } = await supabase
        .from("customers").select("id").eq("email", email).single();
      if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

      const { data: biz } = await supabase
        .from("businesses").select("id").eq("customer_id", customer.id).single();
      if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });
      bizId = biz.id;
    }

    if (!bizId) return NextResponse.json({ error: "email or business_id required" }, { status: 400 });

    // Get business + plan info
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name, industry, city, services, customer_id")
      .eq("id", bizId)
      .single();
    if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const { data: customer } = await supabase
      .from("customers").select("id, blog_approval_mode").eq("id", biz.customer_id).single();

    const { data: sub } = await supabase
      .from("subscriptions").select("plan").eq("customer_id", biz.customer_id).single();
    const plan = sub?.plan || "starter";
    const postsToGenerate = POSTS_PER_PLAN[plan] || 2;
    const approvalMode = customer?.blog_approval_mode || "manual";

    // Get topics — avoid already-used ones
    const { data: existingPosts } = await supabase
      .from("blog_posts").select("title").eq("business_id", bizId);
    const usedTitles = new Set((existingPosts || []).map((p: { title: string }) => p.title));

    const allTopics = getBlogTopics(biz.industry || "other", biz.name, biz.city || "your city");
    const availableTopics = allTopics.filter(t => !usedTitles.has(t));
    const topics = availableTopics.slice(0, postsToGenerate);

    if (topics.length === 0) {
      return NextResponse.json({ success: true, generated: 0, message: "No new topics available" });
    }

    const services: string[] = Array.isArray(biz.services) ? biz.services : [];
    const generated: string[] = [];

    for (const topic of topics) {
      try {
        const { title, content: postContent, word_count } = await generateBlogPost(
          anthropic,
          biz.name,
          biz.industry || "service",
          biz.city || "your city",
          topic,
          services
        );

        const status = approvalMode === "auto" ? "published" : "pending";
        const now = new Date().toISOString();

        await supabase.from("blog_posts").insert({
          business_id: bizId,
          title,
          content: postContent,
          word_count,
          status,
          approved_at: approvalMode === "auto" ? now : null,
        });

        generated.push(title);
      } catch (err) {
        console.error("Failed to generate post:", topic, err);
      }
    }

    return NextResponse.json({
      success: true,
      generated: generated.length,
      titles: generated,
      plan,
      approval_mode: approvalMode,
    });

  } catch (err) {
    const error = err as Error;
    console.error("generate-blogs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

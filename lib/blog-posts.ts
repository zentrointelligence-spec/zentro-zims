export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  readTime: string;
  /** Plain text paragraphs separated by blank lines (rendered as &lt;p&gt; blocks). */
  content: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-insurance-agents-use-spreadsheets",
    title: "Why insurance agents still use spreadsheets (and why they should stop)",
    date: "2026-03-15",
    author: "Zentro Team",
    excerpt:
      "Spreadsheets made sense when your agency had 20 clients. Here is what happens when it has 200.",
    readTime: "5 min read",
    content: `Spreadsheets are the default operating system of the insurance industry. They are cheap, familiar, and infinitely flexible. When your book of business is small, a single workbook can hold every lead, every policy renewal date, and every note from your last conversation. The problem is that flexibility becomes a liability the moment your agency grows.

When you cross a few dozen active policies, you stop remembering where each renewal date lives. One tab holds motor policies, another tab was started by a colleague who has since left, and a third tab contains formulas that nobody dares to touch. Copy-paste errors creep in. Version control is whichever file was last emailed. You cannot answer simple questions—who owns the latest renewal list?—without opening five attachments.

Spreadsheets also fail at collaboration in real time. Two people editing the same file leads to conflicted copies. WhatsApp screenshots of cells become the unofficial database. Managers lose visibility because reporting requires someone to manually consolidate tabs every Friday night. The cost is not the price of Microsoft Excel; it is the opportunity cost of missed renewals, duplicated outreach, and clients who feel forgotten because nobody saw the note in row 1847.

Modern agencies replace spreadsheets with a single system of record. Policies, customers, leads, and interactions live in one place with audit trails, permissions, and automation on top. Renewals can trigger tasks automatically. WhatsApp messages can attach to the right client without anyone forwarding a chat export. You still export to Excel when you need to—but you do not run the business inside the grid.

If your agency is still on spreadsheets, you are not behind the curve on purpose. You are optimising for what worked yesterday. The question is whether that optimisation still matches the complexity of your book today. When renewals slip through the cracks, the spreadsheet is not the villain—but it is rarely the hero either.

Moving to a dedicated platform does not mean abandoning rigour. It means encoding the rules once—who owns a renewal, when reminders fire, how data is validated—so that humans spend time advising clients instead of reconciling files. The agencies that make the switch rarely miss the midnight merge sessions. They do miss fewer renewals—and that is the whole point.`,
  },
  {
    slug: "whatsapp-for-insurance-agents",
    title: "How to use WhatsApp professionally as an insurance agent",
    date: "2026-03-22",
    author: "Zentro Team",
    excerpt:
      "WhatsApp is where your clients are. Here is how to use it without losing track of every conversation.",
    readTime: "4 min read",
    content: `Your clients already live on WhatsApp. They use it to coordinate school runs, talk to family abroad, and yes—to ask quick questions about their policy or send a photo of a scratch on the bumper. If you force every interaction back to email, you add friction. If you embrace chat without structure, you lose history the moment someone changes phones.

Professional use of WhatsApp starts with boundaries. Decide your business hours and communicate them clearly. Use a business profile with your agency name and a short description of what you help with. When conversations contain advice that could matter later, summarise the outcome in your CRM so the next teammate can see context without scrolling through two hundred voice notes.

Templates save time without sounding robotic. Keep a handful of approved snippets: how to request documents, how to explain waiting periods, how to acknowledge a claim intake. Personalise the first sentence, then reuse the accurate compliance language underneath. That reduces typos and speeds up replies when you are between meetings.

Attachments and privacy deserve discipline. Never request full identity numbers over chat unless your regulator and your security team are comfortable with the channel. Prefer secure links for uploads when documents are sensitive. If a client sends medical information casually, acknowledge receipt and move detailed discussion to a channel your agency has assessed for PHI or PII handling.

The hardest part is continuity. Clients message whoever replies fastest. If three agents share one phone, messages stack up unread unless you have a shared inbox or a system that logs inbound and outbound messages against the right policy. Otherwise, renewals get promised in chat by Agent A while Agent B is updating the spreadsheet nobody trusts.

Treat WhatsApp as a front door, not a filing cabinet. Capture decisions where they belong—in the policy record—with timestamps. When you do, WhatsApp becomes a strength: fast, human, and convenient. When you do not, it becomes the place good service goes to disappear. The agents who win on WhatsApp are not the fastest typists; they are the ones who close the loop every single time.`,
  },
  {
    slug: "never-miss-a-renewal",
    title: "How to never miss a policy renewal again",
    date: "2026-04-01",
    author: "Zentro Team",
    excerpt:
      "A missed renewal is a lost client. Here is the system that makes renewals automatic.",
    readTime: "6 min read",
    content: `A renewal is not a calendar event. It is a revenue event, a relationship event, and often a compliance event rolled into one. Missing it does not feel dramatic in the moment—it feels like an honest mistake. The client notices differently. They receive coverage elsewhere, or they assume you deprioritised them. Either way, the lapse shows up as churn long before your spreadsheet turns red.

The agencies that rarely miss renewals share three habits. First, they maintain a single expiry date source of truth. Not “the date on the PDF unless we updated the rider,” but one field per policy that powers every reminder. Second, they define a renewal window in days—not “whenever someone remembers,” but “we start the sequence at T minus thirty.” Third, they assign ownership. A renewal without an owner is a renewal that waits for a hero.

Automation does not replace the agent; it removes the ambient anxiety of keeping everything in your head. When the system flags policies entering the renewal window, work queues become obvious. Tasks can be created automatically so a human still chooses the tone of the outreach, but nobody has to rebuild a pivot table to find who is due next week.

Good renewal hygiene also includes data quality. Wrong mobile numbers, outdated email addresses, and policies filed under nicknames all break the chain. Spend a season cleaning contact channels and you compound the value of every automated reminder you send afterwards. A message that reaches the wrong channel is the same as no message at all.

Clients respond to clarity. Tell them early what will change at renewal: premium drivers, coverage comparisons, and deadlines to accept. A structured cadence—initial heads-up, follow-up with documents, final call to action—reduces last-minute panic and builds trust. When clients trust the process, they renew faster and refer more often.

Finally, measure what you fear. Track renewal rate by producer, by product line, and by channel. If WhatsApp renewals outperform email for a segment, double down. If a cohort always slips at ninety days, investigate whether your window is too short or your messaging too generic. Renewals are not luck. They are a system—and systems can be engineered until “we missed it” stops being something your agency says altogether.`,
  },
];

export function getAllBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}

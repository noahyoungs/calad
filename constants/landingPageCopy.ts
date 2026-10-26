export const POSTHOG_FLAGS = {
  LANDING_HERO_COPY_EXPERIMENT: 'landing-hero-copy-experiment',
} as const;

export type HeroCopyVariantKey = 'variant-a' | 'variant-b'; // Or more specific keys if you prefer

export interface HeroCopy {
  headingLine1: string;
  headingLine2: string;
  line1: string;
  line2: string;
}

export const landingPageCopy = {
  navbar: {
    menuItems: [
      { label: "Home", href: "/" },
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  
  promoBanner: {
    text: "Try all features for free, limited time only",
    buttonText: "Start Free Trial",
  },
  
  hero: {
    headingLine1: "Your AI Calendar", // Split the control heading
    headingLine2: "Assistant",
    line1: "I help you create and manage calendar events.", // This will be our 'control' line1
    line2: "No clicks, no clutter. Just tell me what to schedule.", // This will be our 'control' line2
    watchDemoText: "Watch Video",
    consentText: "By continuing, you confirm you are at least 13 years old and of digital consent age in your region.",
  },

  heroVariants: {
    // The 'control' variant will use the default heading and description from landingPageCopy.hero
    'variant-a': {
      headingLine1: "Hi, I'm cal.ad 👋", // Variant A split
      headingLine2: "",
      line1: "I'm your personal AI calendar assistant. Just tell me what you need.", // Variant A line1
      line2: "I'll handle the scheduling, so you can focus on what matters.", // Variant A line2
    },
    'variant-b': {
      headingLine1: "I Can Take It", // Variant B split
      headingLine2: "From Here",
      line1: "Tell me what to schedule — by chat or email, your choice.", // Variant B line1
      line2: "I'll keep your calendar clear, accurate, and up to date.", // Variant B line2
    },
  } as Record<HeroCopyVariantKey, HeroCopy>,
  
  features: {
    sectionTitle: "Key Features",
    sectionDescription: "cal.ad combines AI with calendar management to make scheduling effortless",
    seeDemo: "See Demo",
    featureItems: [
      {
        title: "Email-to-Calendar Integration",
        description: "Forward any email to cal.ad and the assistant will auto-generate one or more calendar events.",
        icon: "tabler:mail-spark",
        color: "#ffd125",
        isPro: false,
        demoUrl: "https://app.supademo.com/embed/cma6nu7dq518313m0v4utoes0?embed_v=2",
        demoTitle: "Turn any email into a polished event",
        aspectRatio: "1.4537313433"
      },
      {
        title: "Process PDFs and Images",
        description: "Upload PDFs or images with event details, and cal.ad will create calendar events automatically.",
        icon: "tabler:file-settings",
        color: "#ffd125",
        isPro: false,
        demoUrl: "https://app.supademo.com/embed/cma82a64z5lk413m0emg26dnq?embed_v=2",
        demoTitle: "Easily turn any image or PDF into a calendar event",
        aspectRatio: "1.5470008952551477"
      },
      {
        title: "Advanced Calendar Management",
        description: "cal.ad will find, edit, and delete existing events, to manage your calendar conversationally.",
        icon: "tabler:calendar-cog",
        color: "#ffd125",
        isPro: true,
        demoUrl: "https://app.supademo.com/embed/cmaat3qac66lc13m020j7ha6q?embed_v=2",
        demoTitle: "Modify and delete existing events from your calendar",
        aspectRatio: "1.7777777777777777"
      },
      {
        title: "Summarize Your Schedule",
        description: "Ask cal.ad about your schedule in natural language. Get a summary of any day, week, or month.",
        icon: "tabler:calendar-smile",
        color: "#ffd125",
        isPro: true,
        demoUrl: "https://app.supademo.com/embed/cmaax33i568qa13m05fmlo8u8?embed_v=2",
        demoTitle: "Get an AI-generated summary of your week",
        aspectRatio: "1.7777777777777777"
      }
    ]
  },
  
  pricing: {
    title: "Compare Plans",
    subtitle: "See what works for you",
    description: "Find the perfect plan for your scheduling needs",
    yearlyDiscountLabel: "Save 34%",
    payMonthly: "Pay Monthly",
    payYearly: "Pay Yearly",
    customSolutionText: "Need a custom solution?",
    contactUs: "Contact us."
  },
  
  faq: {
    sectionTitle: "Frequently asked questions",
    mobileSectionTitle: "FAQs",
    questions: [
      {
        title: "What is cal.ad?",
        content: "cal.ad is an AI-powered calendar assistant that helps users create, manage, and summarize events using natural language — through both chat and email. Designed for busy professionals, remote teams, and anyone who wants to automate scheduling, cal.ad makes your calendar feel like it's on autopilot."
      },
      {
        title: "How does the AI understand my event details?",
        content: "Our advanced natural language processing technology analyzes your text and identifies key event information like dates, times, locations, and participants. It then structures this information into properly formatted calendar events."
      },
      {
        title: "Is my calendar data secure?",
        content: "Yes, security is our top priority. We use industry-standard encryption and authentication protocols to protect your data. cal.ad only accesses the calendar information necessary to create and manage your events, under your instruction."
      },
      {
        title: "Which calendar services are supported?",
        content: "cal.ad currently integrates with Google Calendar, with support for Microsoft Outlook, Apple Calendar, and other popular calendar services coming soon."
      },
      {
        title: "How does the email integration work?",
        content: "Simply forward emails containing event details to hello@cal.ad, and our AI will automatically extract the relevant information and create calendar events for you."
      },
      {
        title: "What file types can cal.ad process?",
        content: "cal.ad can extract event information from PDF documents and images (JPG, PNG). Our AI can identify dates, times, and other event details from these files."
      },
      {
        title: "How do I send files to cal.ad?",
        content: "You can send files to cal.ad by uploading them using our chat interface, or by including them as attachments in any emails you send to hello@cal.ad."
      },
      {
        title: "Can cal.ad manage existing events, or view and summarize my calendar?",
        content: "Yes! These features are available in cal.ad Plus."
      },
      {
        title: "Do you have a mobile app?",
        content: "We're currently developing mobile apps for iOS and Android. In the meantime, cal.ad works perfectly through email and our responsive web interface."
      },
      {
        title: "I sent cal.ad an email, but I didn't receive a response. What happened?",
        content: "Please make sure that the email address you've used to send the email is verified in your email settings. If you've already verified your email address, please check your spam folder and make sure you've sent the email to hello@cal.ad. Please also note that for security reasons, cal.ad only processes emails sent with DMARC authentication, which is supported by most major email providers."
      },
      {
        title: "I have a different question. How can I contact you?",
        content: "Contact us here."
      }
    ]
  },
  
  footer: {
    copyright: "© {YEAR} Aldeo Innovations LLC. All rights reserved.",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy-policy" },
      { label: "Terms of Service", href: "/legal/terms-of-service" },
      { label: "Contact", href: "/contact" }
    ],
    socialLinks: [
      { platform: "X", icon: "tabler:brand-x", href: "https://x.com/calad_app" },
      { platform: "YouTube", icon: "tabler:brand-youtube", href: "https://www.youtube.com/@calad_app" }
    ]
  }
};

export default landingPageCopy;

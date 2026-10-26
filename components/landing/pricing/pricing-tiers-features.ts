import type {PricingFeatures} from "./pricing-comparison-types";

import {TiersEnum} from "./pricing-types";

const features: PricingFeatures = [
  {
    title: "Chat Interface",
    items: [
      {
        title: "Create Events",
        tiers: {
          [TiersEnum.Free]: true,
          [TiersEnum.Plus]: true,
        },
        helpText: "Create calendar events using natural language through chat.",
      },
      {
        title: "Edit/Delete Events",
        tiers: {
          [TiersEnum.Free]: false,
          [TiersEnum.Plus]: true
        },
        helpText: "Update or cancel events using natural language chat.",
      },
      {
        title: "View/Summarize Schedule",
        tiers: {
          [TiersEnum.Free]: false,
          [TiersEnum.Plus]: true
        },
        helpText: "Ask natural language questions about your calendar schedule via chat.",
      },

    ],
  },
  {
    title: "Email Integration",
    items: [
      {
        title: "Create Events",
        tiers: {
          [TiersEnum.Free]: "Up to 10 events/30 days",
          [TiersEnum.Plus]: true,
        },
        helpText: "Send an email to the AI to create a calendar event.",
      },
      {
        title: "Edit/Delete Events",
        tiers: {
          [TiersEnum.Free]: false,
          [TiersEnum.Plus]: true
        },
        helpText: "Update or cancel existing events using email.",
      },
      {
        title: "View/Summarize Schedule",
        tiers: {
          [TiersEnum.Free]: false,
          [TiersEnum.Plus]: true
        },
        helpText: "Ask natural language questions about your calendar schedule via email.",
      },

    ],
  },
  {
    title: "Calendar Features",
    items: [
      {
        title: "Invite People",
        tiers: {
          [TiersEnum.Free]: true,
          [TiersEnum.Plus]: true
        },
        helpText: "Invite people to events by email.",
      },
      {
        title: "Add Google Meet Link",
        tiers: {
          [TiersEnum.Free]: true,
          [TiersEnum.Plus]: true
        },
        helpText: "Automatically add a Google Meet link to events.",
      },
    ],
  },
  {
    title: "AI Features",
    items: [
      {
        title: "Recieve Images",
        tiers: {
          [TiersEnum.Free]: true,
          [TiersEnum.Plus]: true
        },
        helpText: "Send images to the AI to process and create events.",
      },
      {
        title: "Recieve PDFs",
        tiers: {
          [TiersEnum.Free]: true,
          [TiersEnum.Plus]: true
        },
        helpText: "Send PDFs to the AI to process and create events.",
      },
      {
        title: "Model Response Quality",
        tiers: {
          [TiersEnum.Free]: "Standard model",
          [TiersEnum.Plus]: "Premium model (faster, more accurate)"
        },
        helpText: "Access to different tiers of AI models for processing your requests.",
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        title: "Support Access",
        tiers: {
          [TiersEnum.Free]: "Best effort basis",
          [TiersEnum.Plus]: "Priority email support"
        },
        helpText: "Get help when you need it through our support channels.",
      },
    ],
  },
];

export default features;

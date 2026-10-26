import type {Frequency, Tier} from "./pricing-types";

import {FrequencyEnum, TiersEnum} from "./pricing-types";

export const frequencies: Array<Frequency> = [
  {
    key: FrequencyEnum.Yearly,
    label: "Pay Yearly",
    priceSuffix: "year",
    discount: "Save 34%",
  },
  {
    key: FrequencyEnum.Monthly,
    label: "Pay Monthly",
    priceSuffix: "month",
    discount: null,
  },
];

export const tiers: Array<Tier> = [
  {
    key: TiersEnum.Free,
    title: "Free",
    description: "For casual users",
    price: {
      [FrequencyEnum.Monthly]: "$0",
      [FrequencyEnum.Yearly]: "$0",
    },
    priceSuffix: "month",
    features: [
      "Create new events via chat",
      "Create up to 10 events/30 days via email",
      "Standard AI model",
      "Best effort support"
    ],
    buttonText: "Get Started",
    buttonVariant: "flat",
    href: "/app/start",
    mostPopular: false,
  },
  {
    key: TiersEnum.Plus,
    title: "cal.ad Plus",
    description: "For professionals & power users",
    price: {
      [FrequencyEnum.Monthly]: "$7.38",
      [FrequencyEnum.Yearly]: "$4.88",
    },
    priceSuffix: "month",
    features: [
      "Everything in Free",
      "Unlimited emails",
      "Edit/Delete existing events",
      "View, summarize, and manage your schedule",
      "Premium AI model",
      "Priority email support"
    ],
    buttonText: "Subscribe",
    buttonVariant: "flat",
    href: "/plus-upgrade",
    mostPopular: true,
  }
];

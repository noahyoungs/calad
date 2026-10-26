import type {TiersEnum} from "./pricing-types";

export type PricingFeatureItem = {
  title: string;
  helpText?: string;
  tiers: {
    [TiersEnum.Free]: boolean | string;
    [TiersEnum.Plus]: boolean | string;
  };
};

export type PricingFeature = {
  title: string;
  items: PricingFeatureItem[];
};

export type PricingFeatures = PricingFeature[];

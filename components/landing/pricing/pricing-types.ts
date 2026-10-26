import type {ButtonProps} from "@heroui/react";

export enum FrequencyEnum {
  Yearly = "yearly",
  Monthly = "monthly",
}

export enum TiersEnum {
  Free = "free",
  Plus = "plus",
}

export type Frequency = {
  key: FrequencyEnum;
  label: string;
  priceSuffix: string;
  discount?: string | null;
};

export type Tier = {
  key: TiersEnum | string;
  title: string;
  price: string | Record<FrequencyEnum, string>;
  priceSuffix?: string;
  href: string;
  description?: string;
  mostPopular?: boolean;
  featured?: boolean;
  features?: string[];
  buttonText: string;
  buttonColor?: ButtonProps["color"];
  buttonVariant: ButtonProps["variant"];
};

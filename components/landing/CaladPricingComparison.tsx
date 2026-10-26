"use client";

import React from "react";
import { Icon } from "@iconify-icon/react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Divider,
  Link,
  Spacer,
  Tab,
  Tabs,
  Tooltip,
} from "@heroui/react";
import { cn } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";

import {
  FrequencyEnum,
  TiersEnum,
  type Frequency,
  type Tier,
} from "./pricing/pricing-types";
import { frequencies, tiers } from "./pricing/pricing-tiers";
import features from "./pricing/pricing-tiers-features";
import { landingPageCopy } from "@/constants/landingPageCopy";

// Update the code to reference the copy from the centralized location
const { title, subtitle, description, yearlyDiscountLabel, payMonthly, payYearly, customSolutionText, contactUs } = landingPageCopy.pricing;

// Reusable components
const PriceDisplay = React.memo(
  ({
    price,
    priceSuffix,
    selectedFrequency,
  }: {
    price: string | Record<FrequencyEnum, string>;
    priceSuffix?: string;
    selectedFrequency: Frequency;
  }) => (
    <motion.div
      className="flex items-baseline gap-1"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="inline text-4xl font-semibold leading-tight tracking-tight text-white">
        {typeof price === "string" ? price : price[selectedFrequency.key]}
      </span>
      {typeof price !== "string" && (
        <span className="text-medium font-medium text-white/60">/month</span>
      )}
    </motion.div>
  )
);

PriceDisplay.displayName = "PriceDisplay";

const FeatureItem = React.memo(
  ({ feature, index }: { feature: string; index: number }) => (
    <motion.li
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ffd125]/20 flex items-center justify-center">
        <Icon className="text-[#ffd125]" icon="tabler:check" width={16} />
      </div>
      <p className="text-white/80">{feature}</p>
    </motion.li>
  )
);

FeatureItem.displayName = "FeatureItem";

const PricingCard = React.memo(
  ({
    tier,
    selectedFrequency,
  }: {
    tier: Tier;
    selectedFrequency: Frequency;
  }) => (
    <Card
      isBlurred
      className={cn("glass h-full p-6 relative overflow-hidden", {
        "border-2 border-[#ffd125]/50": tier.mostPopular,
      })}
      shadow="md"
    >
      {tier.mostPopular && (
        <Chip
          className="absolute right-4 top-4 bg-[#ffd125]/20 text-[#ffd125]"
          size="sm"
          variant="flat"
        >
          Popular
        </Chip>
      )}
      <CardHeader className="flex flex-col items-start gap-3 pb-8">
        <h2 className="text-2xl font-poppins font-medium text-white">
          {tier.title}
        </h2>
        <p className="!font-regular text-white/70">{tier.description}</p>
      </CardHeader>
      <Divider className="bg-white/30" />
      <CardBody className="py-8 gap-8">
        <PriceDisplay
          price={tier.price}
          priceSuffix={tier.priceSuffix}
          selectedFrequency={selectedFrequency}
        />
        <ul className="flex flex-col gap-4">
          {tier.features?.map((feature, index) => (
            <FeatureItem key={feature} feature={feature} index={index} />
          ))}
        </ul>
      </CardBody>
      <CardFooter className="pt-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          <Button
            fullWidth
            as={Link}
            className={cn(
              tier.buttonVariant === "flat"
                ? "bg-[#ffd125] text-[#7f8ee2]"
                : "border-[#ffd125] text-[#ffd125]"
            )}
            href={tier.href}
            variant={tier.buttonVariant}
          >
            {tier.buttonText}
          </Button>
        </motion.div>
      </CardFooter>
    </Card>
  )
);

PricingCard.displayName = "PricingCard";

export default function CaladPricingComparison() {
  const [selectedFrequency, setSelectedFrequency] = React.useState<Frequency>(
    frequencies[0]
  );

  const onFrequencyChange = React.useCallback((selectedKey: React.Key) => {
    const frequencyIndex = frequencies.findIndex((f) => f.key === selectedKey);
    setSelectedFrequency(frequencies[frequencyIndex]);
  }, []);

  const tableVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <section id="pricing" className="py-12 md:py-24 px-4 md:px-8">
      <div className="relative mx-auto flex max-w-5xl flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex max-w-xl flex-col text-center"
        >
          <h2 className="font-poppins font-medium leading-7 text-[#ffd125]">
            {title}
          </h2>
          <h1 className="mt-2 text-4xl font-poppins font-medium tracking-tight text-white">
            {subtitle}
          </h1>
          <h2 className="mt-6 text-lg text-white/80">
            {description}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12"
        >
          <Tabs
            classNames={{
              tabList: "glass",
              cursor: "!bg-[#758dff]",
              tab: "data-[hover-unselected=true]:opacity-90 text-white",
            }}
            radius="full"
            onSelectionChange={onFrequencyChange}
          >
            <Tab
              key={FrequencyEnum.Monthly}
              title={
                <div className="flex items-center gap-2 group-data-[selected=true]:text-white text-white/60">
                  <p>{payMonthly}</p>
                </div>
              }
            />
            <Tab
              key={FrequencyEnum.Yearly}
              aria-label="Pay Yearly"
              className="pr-0.5"
              title={
                <div className="flex items-center gap-2 text-white">
                  <p>{payYearly}</p>
                  <Chip
                    variant="flat"
                    className="bg-[#ffd125]/20 text-[#ffd125]"
                  >
                    {yearlyDiscountLabel}
                  </Chip>
                </div>
              }
            />
          </Tabs>
        </motion.div>

        {/* Mobile and tablet view */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:hidden max-w-3xl mx-auto w-full px-6">
          <AnimatePresence>
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <PricingCard
                  tier={tier}
                  selectedFrequency={selectedFrequency}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Desktop view */}
        <div className="isolate hidden lg:block w-full mt-16">
          <motion.div
            className="relative -mx-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {tiers.some((tier) => tier.mostPopular) && (
              <div className="absolute inset-y-0 right-0 left-0 z-[-1]">
                <div className="grid grid-cols-3 h-full w-full max-w-5xl mx-auto">
                  <div className="col-span-1" /> {/* Feature column space */}
                  <div className="col-span-1" /> {/* Free plan space */}
                  <div className="col-span-1 px-4">
                    {" "}
                    {/* cal.ad Plus space */}
                    <div className="h-full rounded-medium border-2 border-[#ffd125]/50 glass shadow-lg w-full" />
                  </div>
                </div>
              </div>
            )}

            <motion.table
              className="w-full table-fixed text-left max-w-5xl mx-auto"
              variants={tableVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <caption className="sr-only">Pricing plan comparison</caption>
              <thead>
                <motion.tr variants={rowVariants}>
                  <td className="w-1/3" />
                  {tiers.map((tier) => (
                    <th
                      key={tier.key}
                      className="w-1/3 px-8 pt-8 relative"
                      scope="col"
                    >
                      {tier.mostPopular && (
                        <Chip
                          className="absolute top-2 right-6 bg-[#ffd125]/20 text-[#ffd125]"
                          size="sm"
                          variant="flat"
                        >
                          Popular
                        </Chip>
                      )}
                      <div className="text-2xl font-poppins font-medium text-white">
                        {tier.title}
                      </div>
                      <p className="mt-2 font-normal text-white/70">
                        {tier.description}
                      </p>
                    </th>
                  ))}
                </motion.tr>
                <motion.tr variants={rowVariants}>
                  <th scope="row">
                    <span className="sr-only">Price</span>
                  </th>
                  {tiers.map((tier) => (
                    <td key={tier.key} className="px-8 py-8">
                      <AnimatePresence mode="wait">
                        <PriceDisplay
                          price={tier.price}
                          priceSuffix={tier.priceSuffix}
                          selectedFrequency={selectedFrequency}
                        />
                      </AnimatePresence>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="mt-8"
                      >
                        <Button
                          fullWidth
                          as={Link}
                          className={cn({
                            "bg-[#ffd125] text-[#7f8ee2]":
                              tier.buttonVariant === "flat",
                            "border-[#ffd125] text-[#ffd125]":
                              tier.buttonVariant !== "flat",
                            "font-medium shadow-sm": tier.mostPopular,
                          })}
                          href={tier.href}
                          variant={tier.buttonVariant}
                        >
                          {tier.buttonText}
                        </Button>
                      </motion.div>
                    </td>
                  ))}
                </motion.tr>
              </thead>
              <tbody>
                {features.map((feat, featIndex) => (
                  <React.Fragment key={feat.title}>
                    <motion.tr variants={rowVariants}>
                      <th
                        className={cn(
                          "px-8 pb-6 pt-16 text-xl font-poppins font-semibold text-white relative",
                          {
                            "pt-16": featIndex === 0,
                          }
                        )}
                        colSpan={3}
                        scope="colgroup"
                      >
                        {feat.title}
                        <Divider className="absolute left-0 right-0 mt-6 bg-white/30" />
                      </th>
                    </motion.tr>
                    {feat.items.map((tierFeature, itemIndex) => (
                      <motion.tr
                        key={tierFeature.title}
                        variants={rowVariants}
                        custom={itemIndex}
                      >
                        <th
                          className="px-8 py-6 text-medium font-normal text-white/80"
                          scope="row"
                        >
                          {tierFeature.helpText ? (
                            <div className="flex items-center gap-2">
                              <span>{tierFeature.title}</span>
                              <Tooltip
                                className="max-w-[240px] !text-white"
                                content={tierFeature.helpText}
                                placement="right"
                                color="primary"
                              >
                                <Icon
                                  className="text-white/60"
                                  icon="solar:info-circle-line-duotone"
                                  width={20}
                                />
                              </Tooltip>
                            </div>
                          ) : (
                            tierFeature.title
                          )}
                        </th>

                        {tiers.map((tier) => (
                          <td key={tier.key} className="px-8 py-6">
                            {typeof tierFeature.tiers[tier.key as TiersEnum] ===
                            "string" ? (
                              <motion.div
                                className="text-center text-medium text-white/80"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                  duration: 0.3,
                                  delay: 0.1 * itemIndex,
                                }}
                              >
                                {tierFeature.tiers[tier.key as TiersEnum]}
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                  duration: 0.3,
                                  delay: 0.1 * itemIndex,
                                }}
                                className="flex justify-center"
                              >
                                {tierFeature.tiers[tier.key as TiersEnum] ===
                                true ? (
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#ffd125]/20 flex items-center justify-center">
                                    <Icon
                                      className="text-[#ffd125]"
                                      icon="tabler:check"
                                      width={20}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <Icon
                                      className="text-white/40"
                                      icon="tabler:x"
                                      width={20}
                                    />
                                  </div>
                                )}
                                <span className="sr-only">
                                  {tierFeature.tiers[tier.key as TiersEnum] ===
                                  true
                                    ? "Included"
                                    : "Not included"}
                                  &nbsp;in&nbsp;{tier.title}
                                </span>
                              </motion.div>
                            )}
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </motion.table>
          </motion.div>
        </div>

        <Spacer y={12} />
        <div className="flex py-2">
          <p className="text-white/60">
            {customSolutionText}&nbsp;
            <Link
              color="foreground"
              href="/contact"
              underline="always"
              className="text-[#ffd125]"
            >
              {contactUs}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

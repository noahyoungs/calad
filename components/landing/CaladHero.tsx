"use client";

import React, { useState } from "react";
import {
  Button,
  Link,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify-icon/react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useFeatureFlagVariantKey } from "posthog-js/react"; // Corrected import to useFeatureFlagVariantKey
import { createClientSideClient } from "@/utils/supabase/client";
import {
  landingPageCopy,
  POSTHOG_FLAGS,
  type HeroCopyVariantKey,
  type HeroCopy,
} from "@/constants/landingPageCopy";
import LandingChatInput from "./LandingChatInput";

const { watchDemoText, consentText } = landingPageCopy.hero; // removed tagline since it's no longer needed

export default function CaladHero() {
  const supabase = createClientSideClient();
  const heroCopyVariant = useFeatureFlagVariantKey(
    POSTHOG_FLAGS.LANDING_HERO_COPY_EXPERIMENT
  ) as HeroCopyVariantKey | string | boolean | undefined;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  let currentHeroCopy: HeroCopy;

  // Ensure heroCopyVariant is one of the expected keys before trying to access heroVariants
  if (
    typeof heroCopyVariant === "string" &&
    (heroCopyVariant === "variant-a" || heroCopyVariant === "variant-b") &&
    landingPageCopy.heroVariants[heroCopyVariant as HeroCopyVariantKey]
  ) {
    currentHeroCopy =
      landingPageCopy.heroVariants[heroCopyVariant as HeroCopyVariantKey];
  } else {
    // Default to control if variant is not one of the expected strings, or is false/undefined
    currentHeroCopy = {
      headingLine1: landingPageCopy.hero.headingLine1,
      headingLine2: landingPageCopy.hero.headingLine2,
      line1: landingPageCopy.hero.line1,
      line2: landingPageCopy.hero.line2,
    };
  }

  const { headingLine1, headingLine2, line1, line2 } = currentHeroCopy;

  return (
    <main className="flex flex-col items-center px-3 md:px-0 pb-12 md:pb-24">
      <section className="z-20 mb-6 md:my-14 flex flex-col items-center justify-center gap-[18px] sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-24 h-24 rounded-full overflow-hidden  border-3 border-[#ffd125]">
            <Image
              src="/calad_avatar.png"
              alt="Cal.ad Avatar"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-t-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        </motion.div>

        <motion.div
          className="text-center text-[clamp(40px,10vw,64px)] font-bold leading-[1.2] tracking-tighter"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {heroCopyVariant === "variant-a" ? (
            <h1
              className="font-poppins font-medium whitespace-nowrap flex flex-wrap items-center justify-center gap-3 sm:gap-4"
              style={{
                background:
                  "linear-gradient(to right, white, white, rgba(255, 255, 255, 0.7))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <span className="text-white">Hi, I'm</span>
              <Image
                src="/calad_logo_white.svg"
                alt="cal.ad"
                width={200}
                height={54}
                className="w-auto h-[clamp(30px,8vw,53px)] -mt-1.5 sm:-mt-2.5"
                style={{
                  filter: "brightness(1) contrast(1)",
                  opacity: 0.85,
                }}
                priority
              />
              <span className="text-white w-full sm:w-auto text-center sm:text-left">
                👋
              </span>
            </h1>
          ) : (
            <h1 className="font-poppins font-medium whitespace-normal lg:whitespace-nowrap">
              <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent inline-block pb-2 px-1 hidden sm:block">
                {headingLine1} {headingLine2}
              </span>
              <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent inline-block pb-2 px-1 block sm:hidden">
                {headingLine1}
                <br />
                {headingLine2}
              </span>
            </h1>
          )}
        </motion.div>

        <motion.p
          className="text-center font-normal leading-7 text-white/80  sm:text-[18px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="hidden sm:block">
            {line1}
            <br />
            {line2}
          </span>
          <span className="block sm:hidden mx-2">
            {line1} {line2}
          </span>
        </motion.p>

        <motion.div
          className="flex flex-col items-center justify-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full flex flex-col items-center justify-center px-4"
          ></motion.div>
        </motion.div>

        <motion.div 
          className="w-full max-w-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <LandingChatInput className="w-full" />
        </motion.div>

        <motion.p
          className="text-xs text-white/40 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {consentText}
        </motion.p>
      </section>

      {/* Demo Video Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        classNames={{
          base: "bg-black/90 border border-white/20",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent className="!bg-white">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-black">
                How cal.ad Works
              </ModalHeader>
              <ModalBody className="pb-6">
                <div
                  className="relative w-full"
                  style={{ aspectRatio: "16/9" }}
                >
                  <iframe
                    src="https://www.youtube.com/embed/JGI8a2-SIus"
                    title="Calendar AI Demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                  />
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Desktop and Tablet Embed */}
      <motion.div
        id="desktop-demo"
        className="z-20 mt-auto w-[calc(100%-calc(theme(spacing.4)*2))] max-w-6xl overflow-hidden md:rounded-tl-2xl md:rounded-tr-2xl glass-dark p-4 hidden md:block"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
      >
        <div
          className="relative w-full overflow-hidden rounded-lg glass"
          style={{ aspectRatio: "1.67" }}
        >
          <div
            style={{
              position: "relative",
              boxSizing: "content-box",
              height: "100%",
              width: "100%",
              aspectRatio: "1.778",
              padding: "0 0 0 0",
            }}
          >
            <iframe
              src="https://app.supademo.com/embed/cma6lfolo4ztt13m0utq1cw8n?embed_v=2"
              loading="lazy"
              title="Create a calendar event by just typing it"
              allow="clipboard-write"
              frameBorder="0"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Mobile Embed */}
      <motion.div
        id="mobile-demo"
        className="z-20 relative h-[calc(80vh+2rem)] w-[calc(80vh*0.4408795987) + 2rem] overflow-hidden p-[1rem] overflow-hidden rounded-[2.5rem] glass-dark block md:hidden"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
      >
        <div className="relative w-full overflow-hidden bg-white md:hidden rounded-[1.6rem] px-0 mx-0">
          <div
            // phone demo container
            style={{
              position: "relative",
              width: "calc(80vh * 0.4408795987)",
              height: "80vh",
              overflow: "hidden",
              margin: 0,
              padding: 0,
              border: "1px solid white",
              borderRadius: "1.7rem",
            }}
          >
            <iframe
              src="https://app.supademo.com/embed/cmac7p5t901pmxt0iamxpi7k6?embed_v=2"
              loading="lazy"
              title="Create calendar events with natural language (Mobile)"
              allow="clipboard-write"
              frameBorder="0"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
            />
          </div>
        </div>
      </motion.div>
    </main>
  );
}

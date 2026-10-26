"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { landingPageCopy } from "@/constants/landingPageCopy";

const { sectionTitle, mobileSectionTitle, questions } = landingPageCopy.faq;

export default function CaladFAQ() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const renderContent = (content: string) => {
    if (content.includes("hello@cal.ad")) {
      return (
        <span>
          {content.split("hello@cal.ad").map((part, i, arr) => (
            <React.Fragment key={i}>
              {part}
              {i < arr.length - 1 && (
                <a href="mailto:hello@cal.ad" className="text-[#ffd125]">hello@cal.ad</a>
              )}
            </React.Fragment>
          ))}
        </span>
      );
    }
    
    if (content.includes("here")) {
      return (
        <span>
          Contact us <Link href="/contact" className="text-[#ffd125]">here</Link>.
        </span>
      );
    }
    
    if (content.includes("email settings")) {
      return (
        <span>
          Please make sure that the email address you've used to send the email is verified in your <Link href="/app/chat/settings?tab=email" className="text-[#ffd125]">email settings</Link>. If you've already verified your email address, please check your spam folder and make sure you've sent the email to <a href="mailto:hello@cal.ad" className="text-[#ffd125]">hello@cal.ad</a>. Please also note that for security reasons, cal.ad only processes emails sent with DMARC authentication, which is supported by most major email providers.
        </span>
      );
    }
    
    return content;
  };

  return (
    <section id="faq" className="mx-auto w-full max-w-6xl py-12 md:py-24 px-4 sm:px-6 lg:px-8 relative z-10">
      <motion.div 
        className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 lg:flex-row lg:items-start lg:gap-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="px-2 text-3xl leading-7 text-white"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="inline-block lg:hidden">{mobileSectionTitle}</span>
          <div className="hidden bg-gradient-to-br from-white to-white/70 bg-clip-text pt-4 text-5xl font-poppins font-medium tracking-tight text-transparent lg:inline-block">
            {sectionTitle.split(' ').map((word, i) => (
              <React.Fragment key={i}>
                {word}
                <br />
              </React.Fragment>
            ))}
          </div>
        </motion.div>
        
        <motion.div
          className="w-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="space-y-4">
            {questions.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 * i }}
                className="glass rounded-xl overflow-hidden shadow-md"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center"
                >
                  <span className="font-medium text-white">{item.title}</span>
                  <motion.span
                    animate={{ rotate: openIndex === i ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[#ffd125] text-2xl"
                  >
                    +
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openIndex === i ? "auto" : 0,
                    opacity: openIndex === i ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-white/80">
                    {renderContent(item.content)}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

"use client";

import React from "react";
import { Divider, Link } from "@heroui/react";
import { Icon } from "@iconify-icon/react";
import Image from "next/image";
import { motion } from "framer-motion";
import NextLink from "next/link";
import { landingPageCopy } from "@/constants/landingPageCopy";

const { copyright, links, socialLinks } = landingPageCopy.footer;

export default function CaladFooter() {
  const currentYear = new Date().getFullYear();
  const formattedCopyright = copyright.replace("{YEAR}", currentYear.toString());
  
  return (
    <footer id="contact" className="flex w-full flex-col border-t border-white/10">
      <div className="mx-auto w-full max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <motion.div 
          className="flex flex-col items-center justify-center gap-2 md:order-2 md:items-end"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex space-x-6">
            {socialLinks.map((social, index) => (
              <motion.div 
                key={social.platform}
                whileHover={{ scale: 1.1, y: -3 }} 
                transition={{ duration: 0.2 }}
              >
                <Link 
                  href={social.href} 
                  className="text-white/70 hover:text-white"
                  isExternal
                  aria-label={`Follow us on ${social.platform}`}
                >
                  <Icon icon={social.icon} width={24} />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        <motion.div 
          className="mt-8 md:order-1 md:mt-0"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <motion.div 
              className="flex items-center"
            >
              <Image 
                src="/calad_logo_white.svg" 
                alt="cal.ad Logo" 
                width={80} 
                height={28} 
                style={{ height: 'auto' }}
                unoptimized
              />
            </motion.div>
          </div>
          
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:gap-x-8">
            <p className="text-center text-tiny text-white/60 md:text-start">
              {formattedCopyright}
            </p>
            <div className="mt-4 flex justify-center space-x-6 md:mt-0">
              {links.map((link) => (
                <NextLink key={link.label} href={link.href} className="text-tiny text-white/60 hover:text-white">
                  {link.label}
                </NextLink>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

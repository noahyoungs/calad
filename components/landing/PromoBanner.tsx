"use client";

import React from "react";
import { Button, Link } from "@heroui/react";
import { Icon } from "@iconify-icon/react";
import { motion, AnimatePresence } from "framer-motion";
import { landingPageCopy } from "@/constants/landingPageCopy";

const { text, buttonText } = landingPageCopy.promoBanner;

export default function PromoBanner() {
  const [isVisible, setIsVisible] = React.useState(true);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed top-[66px] z-[100] flex w-full items-center gap-x-3 border-b-1 border-white/20 glass-dark px-6 py-2 sm:px-3.5 sm:before:flex-1"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-small text-white">
            <Link className="text-inherit" href="#">
              {text}&nbsp;
            </Link>
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              as={Link}
              className="group relative h-9 overflow-hidden text-small font-normal !text-[#7f8ee2] !rounded-full"
              endContent={
                <Icon
                  className=" flex-none outline-none transition-transform group-data-[hover=true]:translate-x-0.5 [&>path]:stroke-[2]"
                  icon="solar:arrow-right-linear"
                  width={16}
                />
              }              href="#"
              style={{
                border: "solid 2px transparent",
                backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), linear-gradient(to right, #ffd125, #ffd125)`,
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
              }}
              variant="bordered"
            >
              {buttonText}
            </Button>
          </motion.div>
          <div className="flex flex-1 justify-end">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Button 
                isIconOnly 
                className="-m-1" 
                size="sm" 
                variant="light"
                onClick={() => setIsVisible(false)}
              >
                <span className="sr-only">Close Banner</span>
                <Icon className="text-white" icon="lucide:x" width={20} />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

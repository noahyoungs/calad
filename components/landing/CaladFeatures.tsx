"use client";

import React from "react";
import { Button, Card, CardBody, CardFooter, CardHeader, Chip, Divider, Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { Icon } from "@iconify-icon/react";
import { motion } from "framer-motion";
import { landingPageCopy } from "@/constants/landingPageCopy";

const { sectionTitle, sectionDescription, featureItems, seeDemo } = landingPageCopy.features;

export default function CaladFeatures() {
  const [selectedFeature, setSelectedFeature] = React.useState<number | null>(null);
  const isModalOpen = selectedFeature !== null;

  const handleOpenModal = (index: number) => {
    setSelectedFeature(index);
  };

  const handleCloseModal = () => {
    setSelectedFeature(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <section id="features" className="py-12 md:py-24 px-4 md:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-poppins font-medium mb-4 text-white">{sectionTitle}</h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            {sectionDescription}
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {featureItems.map((feature, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              whileHover={{ 
                y: -5,
                transition: { duration: 0.2 }
              }}
              className="mx-2"
            >
              <Card 
                className="glass shadow-lg h-full border-white/10 relative"
              >
                {feature.isPro && (
                  <Chip 
                    className="absolute right-4 top-4 bg-[#ffd125]/20 text-[#ffd125]" 
                    size="sm"
                    variant="flat"
                  >
                    cal.ad Plus
                  </Chip>
                )}
                <CardHeader className="pb-2 pt-6 px-6 flex flex-col items-start">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                    style={{ backgroundColor: `rgba(255, 209, 37, 0.15)` }}
                  >
                    <Icon 
                      icon={feature.icon} 
                      width={35} 
                      style={{ color: feature.color }} 
                    />
                  </div>
                  <h3 className="text-xl font-poppins font-medium text-white">{feature.title}</h3>
                </CardHeader>
                <CardBody className="px-6 pt-4 pb-6">
                  <p className="text-white/70">{feature.description}</p>
                </CardBody>
                <CardFooter className="px-6 pb-6 pt-2">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    <Button
                      fullWidth
                      className="bg-[#ffd125] text-[#7f8ee2]"
                      variant="flat"
                      onPress={() => handleOpenModal(index)}
                    >
                      {seeDemo}
                    </Button>
                  </motion.div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Modal for displaying demos */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal}
          size="5xl"
          backdrop="blur"
          classNames={{
            base: "!bg-white !text-[#7f8ee2]",
          }}
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Demo: {selectedFeature !== null && featureItems[selectedFeature].demoTitle}
                </ModalHeader>
                <ModalBody>
                  {selectedFeature !== null && (
                    <div style={{ position: "relative", boxSizing: "content-box", maxHeight: "80vh", width: "100%", aspectRatio: featureItems[selectedFeature].aspectRatio, padding: "0" }}>
                      <iframe 
                        src={featureItems[selectedFeature].demoUrl}
                        loading="lazy" 
                        title={featureItems[selectedFeature].demoTitle}
                        allow="clipboard-write" 
                        frameBorder="0" 
                        allowFullScreen 
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                      />
                    </div>
                  )}
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </section>
  );
}

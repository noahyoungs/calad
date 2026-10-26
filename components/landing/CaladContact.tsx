"use client";

import React, { useState, useRef, useEffect } from "react";
import { Form, Input, Textarea, Button } from "@heroui/react";
import { Icon } from "@iconify-icon/react";
import { motion } from "framer-motion";
import { Turnstile } from '@marsidev/react-turnstile';
import { createClientSideClient } from "@/utils/supabase/client";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  token: string;
}

export default function CaladContact() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "Contact Form Submission",  // Default subject
    message: "",
    token: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const turnstileRef = useRef<any>(null);

  // Get user data from Supabase if logged in
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClientSideClient();
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        const user = data.session.user;
        
        setFormData(prev => ({
          ...prev,
          name: user.user_metadata?.full_name || "",
          email: user.email || "",
        }));
      }
    };
    
    fetchUserData();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear form status when user starts typing again
    if (formStatus.type) {
      setFormStatus({ type: null, message: "" });
    }
  };

  const handleTurnstileVerify = (token: string) => {
    setFormData((prev) => ({ ...prev, token }));
  };

  const handleTurnstileError = () => {
    setFormStatus({
      type: "error",
      message: "Turnstile verification failed. Please try again.",
    });
  };

  const handleTurnstileExpire = () => {
    setFormData((prev) => ({ ...prev, token: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setFormStatus({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    if (!formData.token) {
      setFormStatus({
        type: "error",
        message: "Please complete the verification.",
      });
      return;
    }

    setIsSubmitting(true);
    setFormStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFormStatus({
          type: "success",
          message: "Your message has been sent successfully!",
        });
        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          token: "",
        });
        // Reset Turnstile
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
      } else {
        setFormStatus({
          type: "error",
          message: data.error || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      setFormStatus({
        type: "error",
        message: "An error occurred. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact-form" className="py-4 px-4 md:px-8">
      <div className="mx-auto max-w-4xl w-full">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-poppins font-medium mb-4 text-white">Get in Touch</h2>
          <p className="text-white/80 max-w-2xl mx-auto">
            Have questions about cal.ad? Send us a message and we'll get back to you as soon as possible.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-xl p-8 shadow-lg border border-white/10 w-full"
        >
          <Form 
            onSubmit={handleSubmit}
            className="space-y-6 w-full"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="w-full"
            >
              <Input
                label="Name"
                placeholder="Your name"
                value={formData.name}
                onValueChange={(value) => handleInputChange("name", value)}
                isRequired
                variant="bordered"
                classNames={{
                  base: "w-full",
                  inputWrapper: "bg-white/10 backdrop-blur-md border-white/20 data-[hover=true]:border-white/40 group-data-[focus=true]:border-[#ffd125]",
                  input: "text-white placeholder:text-white/50",
                  label: "!text-white/90"
                }}
                size="lg"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="w-full"
            >
              <Input
                type="email"
                label="Email"
                placeholder="your.email@example.com"
                value={formData.email}
                onValueChange={(value) => handleInputChange("email", value)}
                isRequired
                variant="bordered"
                classNames={{
                  base: "w-full",
                  inputWrapper: "bg-white/10 backdrop-blur-md border-white/20 data-[hover=true]:border-white/40 group-data-[focus=true]:border-[#ffd125]",
                  input: "text-white placeholder:text-white/50",
                  label: "!text-white/90"
                }}
                size="lg"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="w-full"
            >
              <Input
                label="Subject"
                placeholder="What's this about?"
                value={formData.subject}
                onValueChange={(value) => handleInputChange("subject", value)}
                isRequired
                variant="bordered"
                classNames={{
                  base: "w-full",
                  inputWrapper: "bg-white/10 backdrop-blur-md border-white/20 data-[hover=true]:border-white/40 group-data-[focus=true]:border-[#ffd125]",
                  input: "text-white placeholder:text-white/50",
                  label: "!text-white/90"
                }}
                size="lg"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="w-full"
            >
              <Textarea
                label="Message"
                placeholder="Your message here..."
                value={formData.message}
                onValueChange={(value) => handleInputChange("message", value)}
                isRequired
                minRows={5}
                variant="bordered"
                classNames={{
                  base: "w-full",
                  inputWrapper: "bg-white/10 backdrop-blur-md border-white/20 data-[hover=true]:border-white/40 group-data-[focus=true]:border-[#ffd125]",
                  input: "text-white placeholder:text-white/50",
                  label: "!text-white/90"
                }}
                size="lg"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="flex justify-center"
            >
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={handleTurnstileVerify}
                onError={handleTurnstileError}
                onExpire={handleTurnstileExpire}
              />
            </motion.div>
            
            {formStatus.type && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-lg ${
                  formStatus.type === "success" 
                    ? "bg-green-500/20 text-green-200" 
                    : "bg-red-500/20 text-red-200"
                }`}
              >
                <p className="flex items-center gap-2">
                  {formStatus.type === "success" ? (
                    <Icon icon="tabler:check-circle" width={20} />
                  ) : (
                    <Icon icon="tabler:alert-circle" width={20} />
                  )}
                  {formStatus.message}
                </p>
              </motion.div>
            )}
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="flex justify-center pt-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  type="submit"
                  className="bg-[#ffd125] text-[#7f8ee2] font-medium px-8 py-6"
                  size="lg"
                  radius="full"
                  isLoading={isSubmitting}
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </motion.div>
            </motion.div>
          </Form>
        </motion.div>
      </div>
    </section>
  );
}

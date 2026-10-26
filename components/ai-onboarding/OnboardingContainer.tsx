"use client";

import useAIOnboarding from "@/components/ai-onboarding/AIOnboardingComponent";
import { SaveAction } from "@/utils/ai-onboarding";
import { generateId } from "@/utils/id-generator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Progress, Textarea, Button, Link } from "@heroui/react";
import { SpecksAnimation } from "@/components/SpecksAnimation";
import { Icon } from "@iconify-icon/react";
import dynamic from "next/dynamic";
import calAdLogo from "../../public/calad_logo_lottie.json";
import { LottieRefCurrentProps } from "lottie-react";
import { Message } from "ai";

// Dynamically import Lottie with SSR disabled
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function OnboardingContainer({
  firstName,
}: {
  firstName: string;
}) {
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const totalQuestions = 5;
  const messageEndRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const chatOptions = useMemo(
    () => ({
      api: "/api/onboarding",
      initialMessages: [
        {
          id: generateId(),
          role: "assistant" as const,
          content: `
# Hey there! 👋  
I'm **cal.ad**, your personal AI assistant for creating events in your calendar.

Before we get started, I need to collect a few pieces of information to personalize your experience. It'll only take a minute!

---
**First, is your name ${firstName}?**  
I want to make sure I get it right so I can refer to you correctly! 😊`,
        },
      ],
      body: {
        localTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    }),
    []
  ); // Empty dependency array since these options never change

  const onCompleteCallback = useCallback(() => {
    console.log("Onboarding complete");
    setOnboardingComplete(true);
    
    // Fire Twitter conversion tracking for completed signup
    if (typeof window !== 'undefined' && window.twq) {
      try {
        window.twq('event', 'tw-q8a3p-q8a3r', {
          status: 'completed'
        });
        console.log("Twitter conversion tracking fired for signup completion");
      } catch (error) {
        console.error("Error firing Twitter conversion tracking:", error);
      }
    }
  }, []);

  const onSaveCallback = useCallback(
    async (action: SaveAction) => {
      setQuestionsCompleted((prev) => Math.min(prev + 1, totalQuestions));
    },
    [totalQuestions]
  );

  const { messages, input, handleInputChange, handleSubmit, status, error } =
    useAIOnboarding({
      useChatOptions: chatOptions,
      onComplete: onCompleteCallback,
      onSave: onSaveCallback,
    });

  // Memoize the last assistant message
  const lastAssistantMessage = useMemo(() => {
    return messages.findLast((m: Message) => m.role === "assistant")?.content;
  }, [messages]);

  // Scroll to the bottom when messages change, with debounce
  useEffect(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages]);

  // Handle value change for HeroUI Textarea
  const handleTextareaValueChange = (value: string) => {
    // Create a synthetic event object that mimics what handleInputChange expects
    const syntheticEvent = {
      target: { value },
    } as React.ChangeEvent<HTMLTextAreaElement>;

    handleInputChange(syntheticEvent);
  };

  // Handle form submission with enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      input.trim() &&
      status !== "submitted" &&
      lastAssistantMessage
    ) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(1.5);
    }
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] w-full">
      {/* Background Animation */}
      <SpecksAnimation />
      <div className="z-20">
        {/* Progress Bar */}
        <Progress
          aria-label="Onboarding progress"
          value={
            onboardingComplete
              ? 100
              : (questionsCompleted / totalQuestions) * 100
          }
          classNames={{
            base: "h-1",
            track: "bg-transparent",
            indicator: "bg-white",
            label: "tracking-wider font-medium text-default-600",
            value: "text-foreground/60",
          }}
          color="default"
        />

        {/* Main Content Container */}
        <div className="flex flex-col justify-center h-[calc(100vh-1rem)] max-w-3xl mx-auto w-full px-8 md:px-4 py-6">
          {/* Message Display Section */}
          <div className="flex overflow-y-auto rounded-lg w-full">
            <div className="w-full">
              {!onboardingComplete && error ? (
                <div className="text-red-500">
                  <p>Error: {error.message}</p>
                </div>
              ) : status === "submitted" && lastAssistantMessage ? (
                <div className="flex justify-center items-center w-full">
                  <Lottie
                    animationData={calAdLogo}
                    style={{ width: 240, height: 96 }}
                    className="text-white"
                    lottieRef={lottieRef}
                  />
                </div>
              ) : (
                <div
                  className="prose md:prose-xl prose-invert  [text-shadow:_0_4px_4px_rgb(119_129_224_/_1.0)] prose-hr:border-white/70 max-w-none"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {lastAssistantMessage}
                  </ReactMarkdown>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>
          </div>

          {/* Input or Complete Button */}
          <div className="mt-8 flex-none flex justify-center">
            {onboardingComplete ? (
              <Button
                as={Link}
                href="/app/chat"
                variant="flat"
                className="mt-2 !text-white mx-auto"
                startContent={
                  <Icon icon="tabler:message-chatbot" width={20} height={20} />
                }
                endContent={
                  <Icon icon="tabler:arrow-right" width={20} height={20} />
                }
              >
                Continue to Chat
              </Button>
            ) : (
              status !== "submitted" &&
              lastAssistantMessage && (
                <form onSubmit={handleSubmit} className="text-2xl w-full">
                  <Textarea
                    value={input}
                    onValueChange={handleTextareaValueChange}
                    onKeyDown={(e) => handleKeyPress(e as any)}
                    placeholder="Type your response..."
                    disabled={status !== "ready"}
                    classNames={{
                      base: "w-full",
                      inputWrapper:
                        "w-full bg-transparent shadow-none group-data-[focus=true]:bg-transparent data-[hover=true]:bg-transparent group-data-[focus-visible=true]:ring-none p-0",
                      input:
                        "w-full !text-2xl !text-white py-3 bg-transparent transition-colors placeholder:text-gray-300 focus:placeholder:text-white focus:text-white [text-shadow:_0_4px_4px_rgb(119_129_224_/_1.0)]",
                    }}
                    autoFocus
                    minRows={1}
                    maxRows={5}
                    disableAutosize={false}
                    disableAnimation
                  />
                </form>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

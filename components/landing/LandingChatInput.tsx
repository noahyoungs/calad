'use client';

import React, { useState } from 'react';
import { Button, Input } from '@heroui/react';
import { Icon } from '@iconify-icon/react';
import { motion } from 'framer-motion';
import { createClientSideClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { createConversation } from '@/actions/actions';

interface LandingChatInputProps {
  className?: string;
}

export default function LandingChatInput({ className }: LandingChatInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientSideClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    if (prompt.length > 4000) {
      setError("Your message is too long. Please submit something shorter");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Store the prompt in localStorage before redirecting to auth
        localStorage.setItem('pendingChatPrompt', prompt);
        
        // Trigger Google OAuth
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            scopes: `openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly`,
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/app/chat/new-from-landing')}`,
            queryParams: {
              access_type: "offline",
            },
          },
        });
        return;
      }

      // User is authenticated, create conversation directly
      const result = await createConversation();
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create conversation");
      }

      // Navigate to the new chat with the prompt
      router.push(`/app/chat/conversation/${result.data.id}?prompt=${encodeURIComponent(prompt)}&isNewChat=true`);
    } catch (error) {
      console.error('Error in landing chat submission:', error);
      setError("Failed to start chat. Please try again.");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className={`w-full ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="relative">
        <Input
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Try: 'Coffee with Sarah this Friday at 2pm'"
          size="lg"
          radius="full"
          disabled={isLoading}
          classNames={{
            base: "h-16 w-full",
            mainWrapper: "h-16 w-full",
            input: "text-lg font-normal !text-black placeholder:text-gray-500 pl-6 pr-16",
            inputWrapper: "h-16 w-full !bg-white/95 border-2 border-white/30 shadow-xl backdrop-blur-sm hover:!shadow-2xl hover:!shadow-white/20 hover:!border-white/50 hover:!bg-white focus-within:!border-white/80 focus-within:!shadow-2xl focus-within:!shadow-white/25 transition-all duration-300 pr-14 data-[hover=true]:!bg-white data-[focus=true]:!bg-white",
          }}
          endContent={
            <Button
              type="submit"
              isDisabled={!prompt.trim() || isLoading}
              isLoading={isLoading}
              isIconOnly
              radius="full"
              size="md"
              color="primary"
              className="min-w-10 w-10 h-10 bg-primary hover:bg-primary/90 shadow-lg"
            >
              <Icon
                icon="tabler:arrow-up"
                className="text-white"
                width={18}
                height={18}
              />
            </Button>
          }
        />
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-400 mt-3 text-center"
        >
          {error}
        </motion.p>
      )}
    </motion.form>
  );
}
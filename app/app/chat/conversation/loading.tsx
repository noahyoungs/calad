"use client";

import { Skeleton, ScrollShadow } from "@heroui/react";

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-full relative pt-4 px-4">
      {/* Chat header skeleton */}
      <div className="-mt-0.5 ml-[72px]">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-60 h-6 rounded-lg" />
        </div>
      </div>

      {/* Chat messages skeleton */}
      <ScrollShadow className="flex-1 p-4 md:p-6 mb-[96px]">
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Use the shared skeleton component */}
          <ChatLoadingSkeleton />
        </div>
      </ScrollShadow>

      {/* Input form skeleton - full height at bottom with rounded top */}
      <Skeleton 
        className="absolute bottom-0 left-0 right-0 h-[96px] max-w-[768px] rounded-t-xl rounded-b-none mx-auto" 
        disableAnimation={false}
      />
    </div>
  );
}

// SkeletonMessage component - can be reused in other components
function SkeletonMessage({ isUser = false, isLong = false }: { isUser?: boolean; isLong?: boolean }) {
  return (
    <div className="flex flex-col md:flex-row items-start gap-3 w-full">
      {/* Avatar skeleton - circular */}
      <Skeleton className="flex-shrink-0 w-8 h-8 rounded-full" />

      {/* Content */}
      <div className="w-full">
        {/* Name skeleton - desktop */}
        <div className="hidden md:flex items-center mb-1">
          <Skeleton className="w-16 h-4 rounded-lg" />
        </div>

        {/* Message content skeleton */}
        <div className="w-full">
          <Skeleton className="w-full rounded-lg" disableAnimation={false}>
            <div className={`h-${isLong ? '20' : '10'} w-full`}></div>
          </Skeleton>
          
          {isLong && (
            <>
              <Skeleton className="w-3/4 rounded-lg mt-2" disableAnimation={false}>
                <div className="h-4 w-full"></div>
              </Skeleton>
              <Skeleton className="w-5/6 rounded-lg mt-2" disableAnimation={false}>
                <div className="h-4 w-full"></div>
              </Skeleton>
              <Skeleton className="w-2/3 rounded-lg mt-2" disableAnimation={false}>
                <div className="h-4 w-full"></div>
              </Skeleton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Export a shared skeleton component that can be used in chat.tsx too
export function ChatLoadingSkeleton() {
  return (
    <>
      {/* First message - user */}
      <SkeletonMessage isUser={true} />

      {/* Second message - AI with longer content */}
      <SkeletonMessage isUser={false} isLong={true} />
    </>
  );
}

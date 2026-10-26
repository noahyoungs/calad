"use client";

import * as React from "react";
import {Button, Card, CardBody, CardFooter, CardHeader, Spacer} from "@heroui/react";
import {Icon} from "@iconify-icon/react";
import {cn} from "@heroui/react";
import { useEffect, useState } from "react";

import { fetchUserSubscription } from "@/actions/settings-actions";
import { createClientSideClient } from "@/utils/supabase/client";

interface BillingSettingCardProps {
  className?: string;
}

const BillingSetting = React.forwardRef<HTMLDivElement, BillingSettingCardProps>(
  ({className, ...props}, ref) => {
    const [subscriptionData, setSubscriptionData] = useState<{
      subscription: any;
      isPro: boolean;
      daysRemaining: number | null;
      formattedStatus: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    
    useEffect(() => {
      async function loadData() {
        setLoading(true);
        
        // Get current user ID
        const supabase = createClientSideClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
        
        const subscriptionResult = await fetchUserSubscription();
        if (subscriptionResult.success && subscriptionResult.data) {
          setSubscriptionData(subscriptionResult.data);
        }

        setLoading(false);
      }
      
      loadData();
    }, []);
    
    const handleManageSubscription = () => {
      // If the user has a subscription, open the Lemon Squeezy customer portal
      if (subscriptionData?.subscription?.lemon_squeezy_subscription_id) {
        // Use the customer portal URL from the subscription data, or fall back to environment variable
        if (subscriptionData.subscription.customer_portal_url) {
          window.open(subscriptionData.subscription.customer_portal_url, '_blank');
        } else if (process.env.NEXT_PUBLIC_LS_CUSTOMER_PORTAL_LINK) {
          window.open(process.env.NEXT_PUBLIC_LS_CUSTOMER_PORTAL_LINK, '_blank');
        } else {
          // Fallback to a generic URL if no portal URL is available
          window.open('https://app.lemonsqueezy.com/my-orders', '_blank');
        }
      }

    };
    
    return (
    <div ref={ref} className={cn("p-2", className)} {...props}>
      {/* Current Plan */}
      <div>
        <p className="text-base font-medium text-default-700">Current Plan</p>
        <p className="mt-1 text-sm font-normal text-default-400">
          {loading ? (
            "Loading subscription information..."
          ) : subscriptionData?.isPro ? (
            subscriptionData.subscription?.subscription_end_date ? (
              (() => {
                const endDate = new Date(subscriptionData.subscription.subscription_end_date);
                const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
                return (
                  <>Your cal.ad Plus plan is active until <span className="text-default-500">{endDate.toLocaleDateString(undefined, options)}</span>. It has been cancelled and will not renew.</>
                );
              })()
            ) : (
              <>You have <span className="text-default-500">cal.ad Plus</span>.</>
            )
          ) : (
            <>Current status: <span className="text-default-500">{subscriptionData?.formattedStatus || "Free Plan"}</span></>
          )}
        </p>

        {/* Plan cards */}
        <div className="mt-4 flex flex-wrap gap-4">
          {/* Free Plan Card */}
          <Card 
            className={cn(
              "flex-1 max-w-[300px]",
              loading ? "border-2 border-transparent" : (!subscriptionData?.isPro) ? "border-2 border-primary" : "border-2 border-transparent"
            )}
          >
            <CardHeader className="flex justify-between items-center pb-0">
              <p className="text-default-500 font-medium">Free Plan</p>
              {!loading && !subscriptionData?.isPro && (
                <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary" />
              )}
            </CardHeader>
            <CardBody>
              <div className="mt-2">
                <p className="pt-2">
                  <span className="text-[30px] font-semibold leading-7 text-default-foreground">
                    $0
                  </span>
                  &nbsp;<span className="text-xs font-medium text-default-400">/month</span>
                </p>
                <Spacer y={2} />
                <ul className="list-inside list-disc text-xs font-normal text-default-500">
                  <li>AI chat interface (create events only)</li>
                  <li>Email-to-calendar (10 events/30 days)</li>
                  <li>Calendar event creation only</li>
                  <li>Standard AI model</li>
                  <li>Email support</li>
                </ul>
              </div>
            </CardBody>
          </Card>

          {/* cal.ad Plus Card */}
          <Card 
            className={cn(
              "flex-1 max-w-[300px]",
              loading ? "border-2 border-transparent" : subscriptionData?.isPro ? "border-2 border-primary" : "border-2 border-transparent"
            )}
          >
            <CardHeader className="flex justify-between items-center pb-0">
              <p className="text-default-500 font-medium">cal.ad Plus</p>
              {!loading && subscriptionData?.isPro && (
                <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary" />
              )}
            </CardHeader>
            <CardBody>
              <div className="mt-2">
                <p className="pt-2">
                  <span className="text-[30px] font-semibold leading-7 text-default-foreground">
                    $4.88
                  </span>
                  &nbsp;<span className="text-xs font-medium text-default-400">/month (billed annually) <br/> or $7.38/month</span>
                </p>
                <Spacer y={2} />
                <ul className="list-inside list-disc text-xs font-normal text-default-500">
                  <li>Full AI chat interface</li>
                  <li>Unlimited email-to-calendar</li>
                  <li>View, edit & delete events</li>
                  <li>Premium AI model</li>
                  <li>Priority support</li>
                </ul>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
      <Spacer y={4} />
      
      
      {/* Manage Subscription Button */}
      <Button 
        className="mt-5 !text-white" 
        color="primary"
        onPress={handleManageSubscription}
        isDisabled={loading || !userId || !subscriptionData?.subscription?.lemon_squeezy_subscription_id}
      >
        {loading ? "Loading..." : (subscriptionData?.subscription?.lemon_squeezy_subscription_id ? "Manage Subscription" : "New purchases are closed")}
      </Button>
    </div>
  );
});

BillingSetting.displayName = "BillingSetting";

export default BillingSetting;

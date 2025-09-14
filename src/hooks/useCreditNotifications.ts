import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

export function useCreditNotifications() {
  const [lastNotifiedBalance, setLastNotifiedBalance] = useState<number | null>(null);
  
  const user = useQuery(api.users.getCurrentUser);
  const creditStatus = useQuery(api.users.getCreditStatus, 
    user ? { userId: user._id } : "skip"
  );
  
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);

  const handleUpgrade = useCallback(async (plan: string) => {
    if (!user) return;
    
    try {
      const result = await createCheckoutSession({
        userId: user._id,
        plan,
        successUrl: `${window.location.origin}/projects?success=true`,
        cancelUrl: `${window.location.origin}/projects?canceled=true`,
      });
      
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error("Failed to create checkout session");
      console.error(error);
    }
  }, [user, createCheckoutSession]);

  // Show notifications when credit balance changes
  useEffect(() => {
    if (!creditStatus || lastNotifiedBalance === null) {
      if (creditStatus) {
        setLastNotifiedBalance(creditStatus.credits);
      }
      return;
    }

    const { credits, isLowBalance, isZeroBalance, plan } = creditStatus;

    // Only notify if balance decreased (credits were used)
    if (credits < lastNotifiedBalance) {
      if (isZeroBalance) {
        toast.error("You're out of credits!", {
          description: plan === "trial" 
            ? "Upgrade your plan to continue staging images."
            : "Your monthly credits have been used up.",
          action: plan === "trial" ? {
            label: "Upgrade",
            onClick: () => handleUpgrade("agent"),
          } : undefined,
        });
      } else if (isLowBalance && credits <= 5) {
        toast.warning("Running low on credits", {
          description: `You have ${credits} credits remaining.`,
          action: plan === "trial" ? {
            label: "Upgrade",
            onClick: () => handleUpgrade("agent"),
          } : undefined,
        });
      }
    }

    setLastNotifiedBalance(credits);
  }, [creditStatus, lastNotifiedBalance, handleUpgrade]);

  const checkSufficientCredits = async (requiredCredits: number = 1) => {
    if (!user) return false;
    
    // Check if user has sufficient credits based on current credit status
    if (!creditStatus || creditStatus.credits < requiredCredits) {
      const message = creditStatus 
        ? `Insufficient credits. Required: ${requiredCredits}, Available: ${creditStatus.credits}`
        : "Unable to check credit status";
        
      toast.error("Insufficient credits", {
        description: message,
        action: creditStatus?.plan === "trial" ? {
          label: "Upgrade",
          onClick: () => handleUpgrade("agent"),
        } : undefined,
      });
      return false;
    }
    
    return true;
  };

  return {
    creditStatus,
    checkSufficientCredits,
    handleUpgrade,
  };
}
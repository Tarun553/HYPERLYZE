"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export function SyncFeedback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "true") {
      toast.success("GitHub Installation Synced!", {
        description: "Your repositories have been successfully imported.",
      });
      // Clean up URL
      router.replace("/dashboard/repos");
    }

    if (error === "sync_failed") {
      toast.error("Sync Failed", {
        description: "We couldn't import your repositories. Please try again.",
      });
      router.replace("/dashboard/repos");
    }
  }, [searchParams, router]);

  return null;
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LoadingButton = ({
  children,
  onClick,
  disabled = false,
  variant = "default",
  size = "default",
  className,
  showErrorToast = true,
  errorMessage = "An error occurred. Please try again.",
  loading: externalLoading = false, // Accept external loading prop
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use external loading state if provided, otherwise use internal state
  const currentLoading = externalLoading || isLoading;

  const handleClick = async (e) => {
    if (!onClick || currentLoading || disabled) return;

    // Only manage internal loading state if no external loading is provided
    if (!externalLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      await onClick(e);
    } catch (err) {
      console.error("Button action failed:", err);
      const errorMsg = err.message || errorMessage;
      setError(errorMsg);

      if (showErrorToast) {
        // You can integrate with your toast system here
        // For now, we'll use a simple alert
        alert(errorMsg);
      }
    } finally {
      // Only reset internal loading state if no external loading is provided
      if (!externalLoading) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-2">
      <Button
        {...props}
        variant={variant}
        size={size}
        className={cn(className)}
        disabled={disabled || currentLoading}
        loading={currentLoading}
        onClick={handleClick}
      >
        {children}
      </Button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default LoadingButton;

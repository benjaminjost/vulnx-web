"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import React from "react";

interface ErrorBannerProps {
  title?: string;
  message: string | null | undefined;
  className?: string;
}

export default function ErrorBanner({
  title = "Error",
  message,
  className = "",
}: Readonly<ErrorBannerProps>) {
  if (!message) return null;
  return (
    <Card
      className={`overflow-hidden rounded-lg border border-status-critical/20 bg-gradient-to-br from-status-critical/6 to-status-critical/10 shadow-sm ${className}`}
    >
      <CardContent className="py-6 px-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="rounded-full bg-background/80 border-2 border-status-critical/10 p-2 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-status-critical" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-foreground truncate">
                {title}
              </h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed truncate">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

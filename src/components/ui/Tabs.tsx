"use client";

import React, { createContext, useContext } from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import "./Tabs.css";

export type TabsVariant = "underline" | "segmented";

const TabsContext = createContext<{ variant: TabsVariant }>({ variant: "underline" });

export interface TabsProps extends React.ComponentPropsWithoutRef<typeof RadixTabs.Root> {
  variant?: TabsVariant;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ variant = "underline", className = "", children, ...props }, ref) => {
    const rootClassNames = [
      "ws-tabs-root",
      `ws-tabs-root-${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <TabsContext.Provider value={{ variant }}>
        <RadixTabs.Root ref={ref} className={rootClassNames} {...props}>
          {children}
        </RadixTabs.Root>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

export type TabsListProps = React.ComponentPropsWithoutRef<typeof RadixTabs.List>;

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className = "", children, ...props }, ref) => {
    const { variant } = useContext(TabsContext);
    const listClassNames = [
      "ws-tabs-list",
      `ws-tabs-list-${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <RadixTabs.List ref={ref} className={listClassNames} {...props}>
        {children}
      </RadixTabs.List>
    );
  }
);
TabsList.displayName = "TabsList";

export interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger> {
  count?: number;
  countAriaLabel?: string;
  countVariant?: "error" | "warning" | "info" | "neutral";
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className = "", children, count, countAriaLabel, countVariant = "neutral", ...props }, ref) => {
    const { variant } = useContext(TabsContext);
    const triggerClassNames = [
      "ws-tabs-trigger",
      `ws-tabs-trigger-${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Count badge color mapping
    const badgeClassNames = [
      "ws-tabs-count-badge",
      `ws-tabs-count-badge-${countVariant}`,
    ].join(" ");

    return (
      <RadixTabs.Trigger ref={ref} className={triggerClassNames} {...props}>
        <span className="ws-tabs-trigger-label">{children}</span>
        {count !== undefined && count > 0 && (
          <span
            className={badgeClassNames}
            aria-label={countAriaLabel || `${count} mục`}
          >
            {count}
          </span>
        )}
      </RadixTabs.Trigger>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

export type TabsContentProps = React.ComponentPropsWithoutRef<typeof RadixTabs.Content>;

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className = "", ...props }, ref) => (
    <RadixTabs.Content
      ref={ref}
      className={`ws-tabs-content ${className}`}
      {...props}
    />
  )
)
;
TabsContent.displayName = "TabsContent";

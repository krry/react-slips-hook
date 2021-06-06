import React from "react";

export type ScrollState = {
  [slug: string]: {
    obstructed: boolean;
    overlay: boolean;
    highlighted: boolean;
    active: boolean;
  };
};

export const SlipContext = React.createContext<{
  slip: { slug: string; data: any }[];
  slipStates: ScrollState;
  navigateToSlip: (to: string, index?: number) => void;
  highlightSlip: (slug: string, highlighted?: boolean) => void;
}>({
  slip: [],
  slipStates: {},
  navigateToSlip: () => {},
  highlightSlip: () => {},
});

export const SlipIndexContext = React.createContext<number>(0);

export const SlipProvider = SlipContext.Provider;
export const PageIndexProvider = SlipIndexContext.Provider;

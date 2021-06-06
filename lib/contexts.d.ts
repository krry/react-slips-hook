import React from "react";
export declare type ScrollState = {
    [slug: string]: {
        obstructed: boolean;
        overlay: boolean;
        highlighted: boolean;
        active: boolean;
    };
};
export declare const SlipContext: React.Context<{
    slip: {
        slug: string;
        data: any;
    }[];
    slipStates: ScrollState;
    navigateToSlip: (to: string, index?: number | undefined) => void;
    highlightSlip: (slug: string, highlighted?: boolean | undefined) => void;
}>;
export declare const SlipIndexContext: React.Context<number>;
export declare const SlipProvider: React.Provider<{
    slip: {
        slug: string;
        data: any;
    }[];
    slipStates: ScrollState;
    navigateToSlip: (to: string, index?: number | undefined) => void;
    highlightSlip: (slug: string, highlighted?: boolean | undefined) => void;
}>;
export declare const PageIndexProvider: React.Provider<number>;

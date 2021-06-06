import { ScrollState } from "./contexts";
declare global {
    interface Window {
        ___loader: {
            loadPage: (slug: string) => Promise<any>;
        };
    }
}
export declare function useSlipsProvider<T>({ location, processPageQuery, firstPage, pageWidth, obstructedPageWidth, }: {
    location: Location;
    processPageQuery?: (queryResult: any, slug: string) => T | null;
    firstPage?: {
        data: any;
        slug: string;
    };
    pageWidth?: number;
    obstructedPageWidth?: number;
}): (((node: HTMLDivElement) => void) | {
    slip: {
        slug: string;
        data: T;
    }[];
    navigateToSlip: (to: string, index?: number) => void;
    highlightSlip: (slug: string, highlighted?: boolean | undefined) => void;
    slipStates: ScrollState;
})[];
export declare function useSlips(): readonly [{
    slug: string;
    data: any;
}[], ScrollState, (to: string) => void, (slug: string, highlighted?: boolean | undefined) => void];
export declare function useSlip(): readonly [{
    slug: string;
    data: any;
}, {}, number, (to: string) => void, (slug: string, highlighted?: boolean | undefined) => void];

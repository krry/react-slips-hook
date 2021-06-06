import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
  useRef,
} from "react";
import { navigate, withPrefix } from "gatsby";
import qs from "querystring";
import throttle from "lodash.throttle";
import equal from "lodash.isequal";
import {
  SlipContext,
  SlipIndexContext,
  ScrollState,
} from "./contexts";

declare global {
  interface Window {
    // provided by Gatsby
    ___loader: {
      loadPage: (slug: string) => Promise<any>;
    };
  }
}

const throttleTime = 16;
const obstructedOffset = 120;

function useScroll() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scroll, setScroll] = useState(0);
  const [width, setWidth] = useState(0);

  const scrollObserver = useCallback(() => {
    if (!containerRef.current) {
      return;
    }
    setScroll(containerRef.current.scrollLeft);
    setWidth(containerRef.current.getBoundingClientRect().width);
  }, [setScroll, setWidth, containerRef]);

  const throttledScrollObserver = throttle(scrollObserver, throttleTime);

  const setRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      // When the ref is first set (after mounting)
      node.addEventListener("scroll", throttledScrollObserver);
      containerRef.current = node;
      window.addEventListener("resize", throttledScrollObserver);
      throttledScrollObserver(); // initialization
    } else if (containerRef.current) {
      // When unmounting
      containerRef.current.removeEventListener(
        "scroll",
        throttledScrollObserver
      );
      window.removeEventListener("resize", throttledScrollObserver);
    }
  }, []);

  return [scroll, width, setRef, containerRef] as const;
}

function getRoot<T>(
  firstPage?: { data: any; slug: string },
  processPageQuery?: (queryResult: any, slug: string) => T | null
): { slug: string; data: T }[] {
  return firstPage
    ? [
        processPageQuery
          ? {
              data: processPageQuery(firstPage.data, firstPage.slug),
              slug: firstPage.slug,
            }
          : firstPage,
      ]
    : [];
}

export function useSlipsProvider<T>({
  location,
  processPageQuery,
  firstPage,
  pageWidth = 625,
  obstructedPageWidth = 40,
}: {
  location: Location;
  processPageQuery?: (queryResult: any, slug: string) => T | null;
  firstPage?: { data: any; slug: string };
  pageWidth?: number;
  obstructedPageWidth?: number;
}) {
  const previousFirstPage = useRef(firstPage);
  const [scroll, containerWidth, setRef, containerRef] = useScroll();
  const [slip, setSlip] = useState<{ slug: string; data: T }[]>(
    getRoot(firstPage, processPageQuery)
  );
  const [slipStates, setSlipStates] = useState<ScrollState>(
    firstPage
      ? {
          [firstPage.slug]: {
            obstructed: false,
            highlighted: false,
            overlay: scroll > pageWidth - obstructedOffset,
            active: true,
          },
        }
      : {}
  );

  const slipSlugs = useMemo(() => {
    const res = qs.parse(location.search.replace(/^\?/, "")).slip || [];
    if (typeof res === "string") {
      return [res];
    }
    return res;
  }, [location]);

  useEffect(() => {
    if (equal(firstPage, previousFirstPage.current)) {
      return;
    }
    setSlip((pages) => {
      return getRoot(firstPage, processPageQuery).concat(
        previousFirstPage.current ? pages.slice(1) : pages
      );
    });
    previousFirstPage.current = firstPage;
  }, [firstPage, processPageQuery, setSlip]);

  useEffect(() => {
    if (!window.___loader) {
      throw new Error(
        "`react-slips-hook` can only be used with Gatsby"
      );
    }

    Promise.all(
      // hook into the internals of Gatsby to dynamically fetch the notes
      slipSlugs.map((slug) => window.___loader.loadPage(slug))
    ).then((data) =>
      setSlip(
        getRoot(firstPage, processPageQuery).concat(
          // filter out 404s
          data
            .map((x, i) => ({
              slug: slipSlugs[i],
              data: processPageQuery
                ? processPageQuery(x.json.data, slipSlugs[i])
                : x,
            }))
            .filter((x) => x.data)
        )
      )
    );
  }, [slipSlugs]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        left: pageWidth * (slip.length + 1),
        behavior: "smooth",
      });
    }
  }, [slip, containerRef]);

  // on scroll or on new page
  useEffect(() => {
    const acc: ScrollState = {};

    if (!containerRef.current) {
      setSlipStates(
        slip.reduce((prev, x, i, a) => {
          prev[x.slug] = {
            overlay: true,
            obstructed: false,
            highlighted: false,
            active: i === a.length - 1,
          };
          return prev;
        }, acc)
      );
      return;
    }

    setSlipStates(
      slip.reduce((prev, x, i, a) => {
        prev[x.slug] = {
          highlighted: false,
          overlay:
            scroll >
              Math.max(
                pageWidth * (i - 1) - (obstructedPageWidth * i - 2),
                0
              ) || scroll < Math.max(0, pageWidth * (i - 2)),
          obstructed:
            scroll >
              Math.max(
                pageWidth * (i + 1) -
                  obstructedOffset -
                  obstructedPageWidth * (i - 1),
                0
              ) || scroll + containerWidth < pageWidth * i + obstructedOffset,
          active: i === a.length - 1,
        };
        return prev;
      }, acc)
    );
  }, [slip, containerRef, scroll, setSlipStates]);

  const navigateToSlip = useCallback(
    (to: string, index: number = 0) => {
      const existingPage = slip.findIndex((x) => x.slug === to);
      if (existingPage !== -1 && containerRef && containerRef.current) {
        setSlipStates((slipStates) => {
          if (!slipStates[to]) {
            return slipStates;
          }
          return Object.keys(slipStates).reduce((prev, slug) => {
            prev[slug] = {
              ...slipStates[slug],
              highlighted: false,
              active: slug === to,
            };
            return prev;
          }, {} as ScrollState);
        });
        containerRef.current.scrollTo({
          top: 0,
          left:
            pageWidth * existingPage - (obstructedPageWidth * existingPage - 1),
          behavior: "smooth",
        });
        return;
      }
      const search = qs.parse(window.location.search.replace(/^\?/, ""));
      search.slip = slip
        .slice(1, index + 1)
        .map((x) => x.slug)
        .concat(to);
      navigate(
        `${window.location.pathname.replace(
          withPrefix("/"),
          "/"
        )}?${qs.stringify(search)}`.replace(/^\/\//, "/")
      );
    },
    [slip, setSlipStates]
  );

  const highlightSlip = useCallback(
    (slug: string, highlighted?: boolean) => {
      setSlipStates((slipStates) => {
        if (!slipStates[slug]) {
          return slipStates;
        }
        return {
          ...slipStates,
          [slug]: {
            ...slipStates[slug],
            highlighted:
              typeof highlighted !== "undefined"
                ? highlighted
                : !slipStates[slug].highlighted,
          },
        };
      });
    },
    [setSlipStates]
  );

  const contextValue = useMemo(
    () => ({
      slip,
      navigateToSlip,
      highlightSlip,
      slipStates,
    }),
    [
      slip,
      navigateToSlip,
      highlightSlip,
      slipStates,
    ]
  );

  return [contextValue, setRef];
}

export function useSlips() {
  const {
    slip,
    slipStates,
    navigateToSlip,
    highlightSlip,
  } = useContext(SlipContext);
  const index = useContext(SlipIndexContext);

  const hookedNavigateToSlip = useCallback(
    (to: string) => navigateToSlip(to, index),
    [navigateToSlip, index]
  );

  return [
    slip,
    slipStates,
    hookedNavigateToSlip,
    highlightSlip,
  ] as const;
}

export function useSlip() {
  const {
    slip,
    slipStates,
    navigateToSlip,
    highlightSlip,
  } = useContext(SlipContext);
  const index = useContext(SlipIndexContext);

  const hookedNavigateToSlip = useCallback(
    (to: string) => navigateToSlip(to, index),
    [navigateToSlip, index]
  );

  const currentPage = slip[index];

  return [
    currentPage,
    currentPage ? slipStates[currentPage.slug] : {},
    index,
    hookedNavigateToSlip,
    highlightSlip,
  ] as const;
}

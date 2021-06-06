"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSlip = exports.useSlips = exports.useSlipsProvider = void 0;
const react_1 = require("react");
const gatsby_1 = require("gatsby");
const querystring_1 = __importDefault(require("querystring"));
const lodash_throttle_1 = __importDefault(require("lodash.throttle"));
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
const contexts_1 = require("./contexts");
const throttleTime = 16;
const obstructedOffset = 120;
function useScroll() {
    const containerRef = react_1.useRef(null);
    const [scroll, setScroll] = react_1.useState(0);
    const [width, setWidth] = react_1.useState(0);
    const scrollObserver = react_1.useCallback(() => {
        if (!containerRef.current) {
            return;
        }
        setScroll(containerRef.current.scrollLeft);
        setWidth(containerRef.current.getBoundingClientRect().width);
    }, [setScroll, setWidth, containerRef]);
    const throttledScrollObserver = lodash_throttle_1.default(scrollObserver, throttleTime);
    const setRef = react_1.useCallback((node) => {
        if (node) {
            // When the ref is first set (after mounting)
            node.addEventListener("scroll", throttledScrollObserver);
            containerRef.current = node;
            window.addEventListener("resize", throttledScrollObserver);
            throttledScrollObserver(); // initialization
        }
        else if (containerRef.current) {
            // When unmounting
            containerRef.current.removeEventListener("scroll", throttledScrollObserver);
            window.removeEventListener("resize", throttledScrollObserver);
        }
    }, []);
    return [scroll, width, setRef, containerRef];
}
function getRoot(firstPage, processPageQuery) {
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
function useSlipsProvider({ location, processPageQuery, firstPage, pageWidth = 625, obstructedPageWidth = 40, }) {
    const previousFirstPage = react_1.useRef(firstPage);
    const [scroll, containerWidth, setRef, containerRef] = useScroll();
    const [slips, setSlips] = react_1.useState(getRoot(firstPage, processPageQuery));
    const [slipStates, setSlipStates] = react_1.useState(firstPage
        ? {
            [firstPage.slug]: {
                obstructed: false,
                highlighted: false,
                overlay: scroll > pageWidth - obstructedOffset,
                active: true,
            },
        }
        : {});
    const slipSlugs = react_1.useMemo(() => {
        const res = querystring_1.default.parse(location.search.replace(/^\?/, "")).slips || [];
        if (typeof res === "string") {
            return [res];
        }
        return res;
    }, [location]);
    react_1.useEffect(() => {
        if (lodash_isequal_1.default(firstPage, previousFirstPage.current)) {
            return;
        }
        setSlips((pages) => {
            return getRoot(firstPage, processPageQuery).concat(previousFirstPage.current ? pages.slice(1) : pages);
        });
        previousFirstPage.current = firstPage;
    }, [firstPage, processPageQuery, setSlips]);
    react_1.useEffect(() => {
        if (!window.___loader) {
            throw new Error("`react-slips-hook` can only be used with Gatsby");
        }
        Promise.all(
        // hook into the internals of Gatsby to dynamically fetch the notes
        slipSlugs.map((slug) => window.___loader.loadPage(slug))).then((data) => setSlips(getRoot(firstPage, processPageQuery).concat(
        // filter out 404s
        data
            .map((x, i) => ({
            slug: slipSlugs[i],
            data: processPageQuery
                ? processPageQuery(x.json.data, slipSlugs[i])
                : x,
        }))
            .filter((x) => x.data))));
    }, [slipSlugs]);
    react_1.useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: 0,
                left: pageWidth * (slips.length + 1),
                behavior: "smooth",
            });
        }
    }, [slips, containerRef]);
    // on scroll or on new page
    react_1.useEffect(() => {
        const acc = {};
        if (!containerRef.current) {
            setSlipStates(slips.reduce((prev, x, i, a) => {
                prev[x.slug] = {
                    overlay: true,
                    obstructed: false,
                    highlighted: false,
                    active: i === a.length - 1,
                };
                return prev;
            }, acc));
            return;
        }
        setSlipStates(slips.reduce((prev, x, i, a) => {
            prev[x.slug] = {
                highlighted: false,
                overlay: scroll >
                    Math.max(pageWidth * (i - 1) - (obstructedPageWidth * i - 2), 0) || scroll < Math.max(0, pageWidth * (i - 2)),
                obstructed: scroll >
                    Math.max(pageWidth * (i + 1) -
                        obstructedOffset -
                        obstructedPageWidth * (i - 1), 0) || scroll + containerWidth < pageWidth * i + obstructedOffset,
                active: i === a.length - 1,
            };
            return prev;
        }, acc));
    }, [slips, containerRef, scroll, setSlipStates]);
    const navigateToSlip = react_1.useCallback((to, index = 0) => {
        const existingPage = slips.findIndex((x) => x.slug === to);
        if (existingPage !== -1 && containerRef && containerRef.current) {
            setSlipStates((slipStates) => {
                if (!slipStates[to]) {
                    return slipStates;
                }
                return Object.keys(slipStates).reduce((prev, slug) => {
                    prev[slug] = Object.assign(Object.assign({}, slipStates[slug]), { highlighted: false, active: slug === to });
                    return prev;
                }, {});
            });
            containerRef.current.scrollTo({
                top: 0,
                left: pageWidth * existingPage - (obstructedPageWidth * existingPage - 1),
                behavior: "smooth",
            });
            return;
        }
        const search = querystring_1.default.parse(window.location.search.replace(/^\?/, ""));
        search.slips = slips
            .slice(1, index + 1)
            .map((x) => x.slug)
            .concat(to);
        gatsby_1.navigate(`${window.location.pathname.replace(gatsby_1.withPrefix("/"), "/")}?${querystring_1.default.stringify(search)}`.replace(/^\/\//, "/"));
    }, [slips, setSlipStates]);
    const highlightSlip = react_1.useCallback((slug, highlighted) => {
        setSlipStates((slipStates) => {
            if (!slipStates[slug]) {
                return slipStates;
            }
            return Object.assign(Object.assign({}, slipStates), { [slug]: Object.assign(Object.assign({}, slipStates[slug]), { highlighted: typeof highlighted !== "undefined"
                        ? highlighted
                        : !slipStates[slug].highlighted }) });
        });
    }, [setSlipStates]);
    const contextValue = react_1.useMemo(() => ({
        slips,
        navigateToSlip,
        highlightSlip,
        slipStates,
    }), [
        slips,
        navigateToSlip,
        highlightSlip,
        slipStates,
    ]);
    return [contextValue, setRef];
}
exports.useSlipsProvider = useSlipsProvider;
function useSlips() {
    const { slips, slipStates, navigateToSlip, highlightSlip, } = react_1.useContext(contexts_1.SlipContext);
    const index = react_1.useContext(contexts_1.SlipIndexContext);
    const hookedNavigateToSlip = react_1.useCallback((to) => navigateToSlip(to, index), [navigateToSlip, index]);
    return [
        slips,
        slipStates,
        hookedNavigateToSlip,
        highlightSlip,
    ];
}
exports.useSlips = useSlips;
function useSlip() {
    const { slips, slipStates, navigateToSlip, highlightSlip, } = react_1.useContext(contexts_1.SlipContext);
    const index = react_1.useContext(contexts_1.SlipIndexContext);
    const hookedNavigateToSlip = react_1.useCallback((to) => navigateToSlip(to, index), [navigateToSlip, index]);
    const currentPage = slips[index];
    return [
        currentPage,
        currentPage ? slipStates[currentPage.slug] : {},
        index,
        hookedNavigateToSlip,
        highlightSlip,
    ];
}
exports.useSlip = useSlip;

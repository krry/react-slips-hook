# react-slips-hook

Treats pages as slips in Gatsby, allowing multiple pages to slip over and under each other in the viewport.

Incidentally "[zettel](https://www.wikiwand.com/en/Zettel_(Wittgenstein_book))" as in zettelkasten can refer to slips of paper.

## Installation

```bash
npm install react-slips-hook
```

## Usage

In your layout component:

```js
import React, { useEffect, useRef, useCallback } from "react";
import Page from "../components/Page";
import {
  useSlipProvider,
  LinkToSlip,
  useSlip,
  PageIndexProvider,
  SlipProvider,
} from "react-slips-hook";

const PageContainer = ({ children, slug }) => {
  const [, { overlay, obstructed, highlighted }, i] = useSlip();

  return (
    <div
      className={`page-container ${overlay ? "page-container-overlay" : ""} ${
        obstructed ? "page-container-obstructed" : ""
      }  ${highlighted ? "page-container-highlighted" : ""}`}
      style={{ left: 40 * i, right: -585 }}
    >
      <div className="page-content">{children}</div>
      <LinkToSlip to={slug} className="obstructed-label">
        {slug}
      </LinkToSlip>
    </div>
  );
};

// A wrapper component to render the content of layered slips
const SlipWrapper = ({ children, slug, i }) => (
  <PageIndexProvider value={i}>
    <PageContainer slug={slug}>{children}</PageContainer>
  </PageIndexProvider>
);

const SlipLayout = ({ data, location, slug }) => {
  // Use this callback to update what you want to stack.
  // `pageQuery` will be similar to the data prop you get in a Page component.
  // You can return `null` to filter out the page
  const processPageQuery = useCallback((pageQuery) => pageQuery, []);

  const [state, scrollContainer] = useSlipNotesProvider({
    firstPage: { data, slug },
    location,
    processPageQuery,
    pageWidth: 625,
  });

  return (
    <div className="layout">
      <div className="page-columns-scrolling-container" ref={scrollContainer}>
        <div
          className="page-columns-container"
          style={{ width: 625 * (state.slip.length + 1) }}
        >
          <SlipProvider value={state}>
            {/* Render the layered slips */}
            {state.slip.map((page, i) => (
              <SlipWrapper i={i} key={page.slug} slug={page.slug}>
                <Page {...page} />
              </SlipWrapper>
            ))}
          </SlipProvider>
        </div>
      </div>
    </div>
  );
};

export default SlipLayout;
```

Somewhere in your slip, you can use

```js
import {
  useSlips,
  useSlip,
  LinkToSlip,
} from "react-slips-hook";

const Component = () => {
  const [
    slip,
    slipStates,
    hookedNavigateToSlip,
    highlightSlip,
  ] = useSlips();

  const [
    currentPage,
    currentPageState,
    pageIndex,
    navigateToSlip,
    highlightSlip,
  ] = useSlip();

  return null;
};

const AnotherComponent = () => {
  return (
    <LinkToSlip to={"/slip"}>
      Magic link that will stack a page
    </LinkToSlip>
  );
};
```

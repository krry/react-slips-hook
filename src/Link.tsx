import React, { useCallback } from "react";
import { GatsbyLinkProps, Link, withPrefix } from "gatsby";
import { useSlip } from "./hooks";

export const LinkToSlip = React.forwardRef(
  (
    {
      to,
      onClick,
      onMouseLeave,
      onMouseEnter,
      ...restProps
    }: GatsbyLinkProps<any>,
    ref
  ) => {
    const [
      ,
      ,
      ,
      navigateToSlip,
      highlightSlip,
    ] = useSlip();
    const onClickHandler = useCallback(
      (ev: React.MouseEvent<HTMLAnchorElement>) => {
        ev.preventDefault();
        if (onClick) {
          onClick(ev);
        }
        if (ev.metaKey || ev.ctrlKey) {
          window.open(withPrefix(to), "_blank");
        } else {
          navigateToSlip(to);
        }
      },
      [navigateToSlip, to, onClick]
    );

    const onMouseEnterHandler = useCallback(
      (ev: React.MouseEvent<HTMLAnchorElement>) => {
        highlightSlip(to, true);
        if (onMouseEnter) {
          onMouseEnter(ev);
        }
      },
      [to, onMouseEnter, highlightSlip]
    );

    const onMouseLeaveHandler = useCallback(
      (ev: React.MouseEvent<HTMLAnchorElement>) => {
        highlightSlip(to, false);
        if (onMouseLeave) {
          onMouseLeave(ev);
        }
      },
      [to, onMouseLeave, highlightSlip]
    );

    return (
      <Link
        {...restProps}
        to={to /*
        // @ts-ignore */}
        ref={ref}
        onClick={onClickHandler}
        onMouseEnter={onMouseEnterHandler}
        onMouseLeave={onMouseLeaveHandler}
      />
    );
  }
);

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Reset window scroll on real route changes.
 * - First mount: scroll to top unless opening `/` with `state.scrollToId` (Home handles section).
 * - Same pathname + new location.key (e.g. replace clearing `scrollToId`): do not scroll — avoids
 *   jumping back to the hero after Home scrolls to About/Menu/Contact.
 * - Different pathname: scroll to top.
 */
function ScrollToTop() {
  const location = useLocation();
  const prevPathRef = useRef(null);

  useEffect(() => {
    const pathname = location.pathname;
    const sectionIntent =
      pathname === "/" &&
      location.state != null &&
      typeof location.state.scrollToId === "string";

    const prevPath = prevPathRef.current;

    if (prevPath === null) {
      prevPathRef.current = pathname;
      if (pathname === "/" && sectionIntent) {
        return;
      }
      window.scrollTo(0, 0);
      return;
    }

    if (sectionIntent) {
      prevPathRef.current = pathname;
      return;
    }

    if (prevPath === pathname) {
      prevPathRef.current = pathname;
      return;
    }

    prevPathRef.current = pathname;
    window.scrollTo(0, 0);
  }, [location.pathname, location.key, location.state]);

  return null;
}

export default ScrollToTop;

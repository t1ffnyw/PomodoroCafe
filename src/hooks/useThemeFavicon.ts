import { useEffect } from "react";

export function useThemeFavicon(iconHref: string) {
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      document.head.appendChild(link);
    }
    link.href = iconHref;
  }, [iconHref]);
}

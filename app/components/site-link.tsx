import type { AnchorHTMLAttributes } from "react";

// Use a normal browser anchor for reliable full-page navigation on the hosted Worker.
export function Link({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a href={href} {...props} />;
}

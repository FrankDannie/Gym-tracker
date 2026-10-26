import { useEffect, useSyncExternalStore } from "react";

export type RouteName = "today" | "plan" | "progress" | "fuel" | "guide";
export interface Route {
  name: RouteName;
  param?: string;
}

const NAMES: RouteName[] = ["today", "plan", "progress", "fuel", "guide"];

export function parseHash(hash: string): Route {
  const [, name, param] = hash.replace(/^#/, "").split("/");
  return { name: NAMES.includes(name as RouteName) ? (name as RouteName) : "today", param: param || undefined };
}

function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

const getHash = () => window.location.hash;

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash, () => "");
  const route = parseHash(hash);

  // New screen, new scroll position.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route.name, route.param]);

  return route;
}

export function href(name: RouteName, param?: string): string {
  return `#/${name}${param ? `/${param}` : ""}`;
}

export function navigate(name: RouteName, param?: string) {
  window.location.hash = href(name, param);
}

import { PREFIX } from "../interface/const";

export function prefix(...classNames: string[]) {
  return classNames
    .map((name) => (name ? `${PREFIX}-${name}` : ""))
    .join(" ");
}
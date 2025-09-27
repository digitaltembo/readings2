import { Router } from "./lib/router.mjs";

export const ROUTES = [
  "/",
  "/blog/:book",
  "/connections/:connectionType/:id",
  "/authors/:author",
];

export function setupRouter() {
  return new Router(...ROUTES);
}

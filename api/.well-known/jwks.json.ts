/**
 * Legacy path kept for discovery docs. Prefer /api/jwks — on Vercel this dotted
 * route is unreliable; vercel.json rewrites /api/.well-known/jwks.json → /api/jwks.
 * This file re-exports the same handler so local `vercel dev` still works if the
 * rewrite is not applied.
 */

export { default } from "../jwks";

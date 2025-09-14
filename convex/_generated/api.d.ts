/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as creditTransactions from "../creditTransactions.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as images from "../images.js";
import type * as lib_gemini from "../lib/gemini.js";
import type * as lib_mlsCompliance from "../lib/mlsCompliance.js";
import type * as lib_staging_demo from "../lib/staging_demo.js";
import type * as mlsCompliance from "../mlsCompliance.js";
import type * as projects from "../projects.js";
import type * as stagingJobs from "../stagingJobs.js";
import type * as stagingJobsSimple from "../stagingJobsSimple.js";
import type * as users from "../users.js";
import type * as waitlist from "../waitlist.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  creditTransactions: typeof creditTransactions;
  crons: typeof crons;
  debug: typeof debug;
  images: typeof images;
  "lib/gemini": typeof lib_gemini;
  "lib/mlsCompliance": typeof lib_mlsCompliance;
  "lib/staging_demo": typeof lib_staging_demo;
  mlsCompliance: typeof mlsCompliance;
  projects: typeof projects;
  stagingJobs: typeof stagingJobs;
  stagingJobsSimple: typeof stagingJobsSimple;
  users: typeof users;
  waitlist: typeof waitlist;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

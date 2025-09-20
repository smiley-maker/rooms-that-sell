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
import type * as beforeAfterVideos from "../beforeAfterVideos.js";
import type * as creditTransactions from "../creditTransactions.js";
import type * as crons from "../crons.js";
import type * as health from "../health.js";
import type * as imageUpload from "../imageUpload.js";
import type * as images from "../images.js";
import type * as lib_gemini from "../lib/gemini.js";
import type * as lib_logger from "../lib/logger.js";
import type * as lib_staging_demo from "../lib/staging_demo.js";
import type * as lib_stripeConfig from "../lib/stripeConfig.js";
import type * as lib_stripeEvents from "../lib/stripeEvents.js";
import type * as lib_stripeInternal from "../lib/stripeInternal.js";
import type * as lib_stripeService from "../lib/stripeService.js";
import type * as lib_subscriptionService from "../lib/subscriptionService.js";
import type * as mlsCompliance from "../mlsCompliance.js";
import type * as projects from "../projects.js";
import type * as stagingJobs from "../stagingJobs.js";
import type * as stripe from "../stripe.js";
import type * as toolUsage from "../toolUsage.js";
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
  beforeAfterVideos: typeof beforeAfterVideos;
  creditTransactions: typeof creditTransactions;
  crons: typeof crons;
  health: typeof health;
  imageUpload: typeof imageUpload;
  images: typeof images;
  "lib/gemini": typeof lib_gemini;
  "lib/logger": typeof lib_logger;
  "lib/staging_demo": typeof lib_staging_demo;
  "lib/stripeConfig": typeof lib_stripeConfig;
  "lib/stripeEvents": typeof lib_stripeEvents;
  "lib/stripeInternal": typeof lib_stripeInternal;
  "lib/stripeService": typeof lib_stripeService;
  "lib/subscriptionService": typeof lib_subscriptionService;
  mlsCompliance: typeof mlsCompliance;
  projects: typeof projects;
  stagingJobs: typeof stagingJobs;
  stripe: typeof stripe;
  toolUsage: typeof toolUsage;
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

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as actions_sms from "../actions/sms.js";
import type * as actions_staffAuth from "../actions/staffAuth.js";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as auth_otpProvider from "../auth/otpProvider.js";
import type * as auth_staffLogin from "../auth/staffLogin.js";
import type * as http from "../http.js";
import type * as mutations from "../mutations.js";
import type * as queries from "../queries.js";
import type * as queries_clients from "../queries/clients.js";
import type * as queries_staff from "../queries/staff.js";
import type * as setupCheck from "../setupCheck.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  "actions/sms": typeof actions_sms;
  "actions/staffAuth": typeof actions_staffAuth;
  admin: typeof admin;
  auth: typeof auth;
  "auth/otpProvider": typeof auth_otpProvider;
  "auth/staffLogin": typeof auth_staffLogin;
  http: typeof http;
  mutations: typeof mutations;
  queries: typeof queries;
  "queries/clients": typeof queries_clients;
  "queries/staff": typeof queries_staff;
  setupCheck: typeof setupCheck;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

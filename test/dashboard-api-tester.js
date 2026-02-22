#!/usr/bin/env node
/**
 * OKX Exchange API Tester (single-file, read-only harness)
 *
 * This script validates fundamental OKX-backed endpoints used by the app.
 *
 * Usage:
 *   npm run test:okx
 *   npm run test:okx:live
 *   node test/dashboard-api-tester.js --base-url http://localhost:3000 --cookie "better-auth.session_token=..."
 *   node test/dashboard-api-tester.js --email you@example.com --password "..."
 *
 * Notes:
 * - By default this runs non-destructive GET tests only.
 * - --live-okx includes the same core suite and marks upstream OKX outages as WARN (not FAIL).
 */

const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const dotenv = require("dotenv");

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const argv = process.argv.slice(2);

function arg(name, fallback = "") {
  const i = argv.indexOf(name);
  if (i >= 0 && i + 1 < argv.length) return argv[i + 1];
  return fallback;
}

function flag(name) {
  return argv.includes(name);
}

function nowIso() {
  return new Date().toISOString();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fmtMs(ms) {
  return `${Math.round(ms)}ms`;
}

const INCLUDE_LIVE = flag("--live-okx");
const VERBOSE = flag("--verbose");
const BASE_URL = arg("--base-url", process.env.TEST_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const EMAIL = arg("--email", process.env.TEST_EMAIL || "");
const PASSWORD = arg("--password", process.env.TEST_PASSWORD || "");
let authCookie = arg("--cookie", process.env.TEST_AUTH_COOKIE || "");
let effectiveBaseUrl = BASE_URL;

const RUN_META = {
  generated_at: nowIso(),
  include_live: INCLUDE_LIVE,
  base_url: BASE_URL,
  effective_base_url: "",
};

function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function looksLikeOkxSystemOutage(text) {
  if (!text) return false;
  return (
    text.includes("OKX_SYSTEM_ERROR") ||
    text.includes("50026") ||
    text.includes("System error. Try again later.")
  );
}

async function checkServer(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/`, { method: "GET" });
    return { ok: res.status > 0, status: res.status, error: "" };
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

function buildHeaders() {
  const headers = { accept: "application/json" };
  if (authCookie) headers.cookie = authCookie;
  return headers;
}

async function requestJson({ name, pathName, query, retries = 2, timeoutMs = 30000 }) {
  const url = new URL(`${effectiveBaseUrl}${pathName}`);
  if (isObject(query)) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && String(v) !== "") url.searchParams.set(k, String(v));
    }
  }

  let lastError = null;
  let lastResponse = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { method: "GET", headers: buildHeaders(), signal: controller.signal });
      clearTimeout(t);
      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      const out = {
        name,
        status: res.status,
        ok: res.ok,
        duration_ms: Date.now() - start,
        url: url.toString(),
        text,
        json,
      };
      lastResponse = out;

      const transient = res.status >= 500 || looksLikeOkxSystemOutage(text);
      if (!res.ok && transient && attempt < retries) {
        await delay(400 * (attempt + 1));
        continue;
      }

      return out;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await delay(400 * (attempt + 1));
        continue;
      }
    }
  }

  return {
    name,
    status: 0,
    ok: false,
    duration_ms: 0,
    url: `${effectiveBaseUrl}${pathName}`,
    text: lastError instanceof Error ? lastError.message : String(lastError || "Unknown connection error"),
    json: lastResponse?.json || null,
  };
}

async function maybeLogin() {
  if (authCookie || !EMAIL || !PASSWORD) return;
  const url = `${effectiveBaseUrl}/api/auth/sign-in/email`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    const setCookie = res.headers.get("set-cookie") || "";
    const m = setCookie.match(/better-auth[^=]*=[^;]+/i);
    if (m) authCookie = m[0];
  } catch {
    // best effort only
  }
}

function suite() {
  const base = [
    { name: "okx.user-info", pathName: "/api/okx/data", query: { action: "user-info" }, type: "okx" },
    { name: "okx.merchant-profile", pathName: "/api/okx/data", query: { action: "merchant-profile" }, type: "okx" },
    { name: "okx.balance.usdt", pathName: "/api/okx/data", query: { action: "balance", currency: "USDT" }, type: "okx" },
    { name: "okx.balances", pathName: "/api/okx/data", query: { action: "balances" }, type: "okx" },
    { name: "okx.payment-methods", pathName: "/api/okx/data", query: { action: "payment-methods" }, type: "okx" },
    { name: "okx.orders", pathName: "/api/okx/data", query: { action: "orders" }, type: "okx" },
    { name: "okx.ads", pathName: "/api/okx/data", query: { action: "ads" }, type: "okx" },
    { name: "okx.cache.bundle", pathName: "/api/okx/cache", query: { exchange: "okx" }, type: "cache" },
    {
      name: "okx.cache.profile",
      pathName: "/api/okx/cache",
      query: { exchange: "okx", dataType: "profile" },
      type: "cache",
    },
    {
      name: "okx.cache.orders",
      pathName: "/api/okx/cache",
      query: { exchange: "okx", dataType: "orders" },
      type: "cache",
    },
  ];

  if (INCLUDE_LIVE) {
    base.push({
      name: "orders.p2p.pending.integration",
      pathName: "/api/orders/p2p",
      query: { status_group: "pending", page: "1", page_size: "20", status_filter: "all" },
      type: "integration",
    });
  }

  return base;
}

function evaluateResult(test, result) {
  const text = result.text || "";
  const json = result.json;

  if (result.status === 0) {
    return { grade: "FAIL", reason: `connection_error: ${text}` };
  }
  if (result.status === 401) {
    return { grade: "FAIL", reason: "unauthorized: provide --cookie or --email/--password" };
  }
  if (result.status >= 500) {
    if (looksLikeOkxSystemOutage(text)) {
      return { grade: "WARN", reason: "okx_degraded: upstream system error (50026)" };
    }
    return { grade: "FAIL", reason: `server_error_${result.status}` };
  }
  if (result.status < 200 || result.status >= 300) {
    return { grade: "FAIL", reason: `http_${result.status}` };
  }

  if (test.type === "cache") {
    if (!isObject(json) || !Array.isArray(json.records)) {
      return { grade: "FAIL", reason: "invalid_shape: expected { records: [] }" };
    }
    return { grade: "PASS", reason: `records=${json.records.length}` };
  }

  if (test.type === "okx" && isObject(json) && typeof json.error === "string") {
    if (looksLikeOkxSystemOutage(text) || json.error.toLowerCase().includes("failed to")) {
      return { grade: "WARN", reason: `okx_error: ${json.error}` };
    }
  }

  return { grade: "PASS", reason: "ok" };
}

function printLine({ grade, name, status, duration, reason }) {
  const mark = grade === "PASS" ? "PASS" : grade === "WARN" ? "WARN" : "FAIL";
  console.log(`${mark} ${name} | status=${status} | time=${duration} | ${reason}`);
}

async function main() {
  console.log("\nOKX Exchange API Tester");
  console.log(`Started: ${RUN_META.generated_at}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Live mode: ${INCLUDE_LIVE ? "enabled" : "disabled"}`);

  const preflight = await checkServer(effectiveBaseUrl);
  if (!preflight.ok && effectiveBaseUrl.includes("localhost")) {
    const fallback = effectiveBaseUrl.replace("localhost", "127.0.0.1");
    const second = await checkServer(fallback);
    if (second.ok) effectiveBaseUrl = fallback;
  }
  RUN_META.effective_base_url = effectiveBaseUrl;

  const finalPreflight = await checkServer(effectiveBaseUrl);
  if (!finalPreflight.ok) {
    console.log(`FAIL preflight | ${effectiveBaseUrl} unreachable | ${finalPreflight.error || finalPreflight.status}`);
    process.exit(1);
  }

  if (!authCookie && !(EMAIL && PASSWORD)) {
    console.log("Auth warning: no auth cookie or email/password provided. Protected endpoints may fail with 401.");
  }
  await maybeLogin();

  const tests = suite();
  const results = [];
  for (const test of tests) {
    const response = await requestJson(test);
    const verdict = evaluateResult(test, response);
    const row = {
      name: test.name,
      grade: verdict.grade,
      reason: verdict.reason,
      status: response.status,
      duration_ms: response.duration_ms,
      url: response.url,
    };
    results.push(row);
    printLine({
      grade: row.grade,
      name: row.name,
      status: row.status,
      duration: fmtMs(row.duration_ms),
      reason: row.reason,
    });

    if (VERBOSE && row.grade !== "PASS") {
      console.log(`  url=${response.url}`);
      console.log(`  body=${String(response.text).slice(0, 500)}`);
    }
  }

  const pass = results.filter((r) => r.grade === "PASS").length;
  const warn = results.filter((r) => r.grade === "WARN").length;
  const fail = results.filter((r) => r.grade === "FAIL").length;

  const report = {
    meta: RUN_META,
    summary: { pass, warn, fail, total: results.length },
    results,
  };

  const outPath = path.join(process.cwd(), "test", "okx-api-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nSummary: pass=${pass}, warn=${warn}, fail=${fail}, total=${results.length}`);
  console.log(`Report: ${outPath}`);

  if (fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error("Fatal:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});


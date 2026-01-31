/**
 * OpenClaw Plan Attestation Helper
 * Computes canonical plan hash and writes it back to attestation.plan_hash
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Deterministic stringify (stable key ordering, recursive)
function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }

  const keys = Object.keys(value).sort();
  const props = keys.map(k => JSON.stringify(k) + ":" + stableStringify(value[k]));
  return "{" + props.join(",") + "}";
}

function sha256String(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function computeCanonicalPlanHash(plan) {
  const clone = JSON.parse(JSON.stringify(plan));
  if (!clone.attestation) clone.attestation = {};
  clone.attestation.plan_hash = "";
  const canonical = stableStringify(clone);
  return sha256String(canonical);
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function writeJsonFile(filePath, data) {
  const json = JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync(filePath, json, { encoding: "utf8" });
}

function exitWithError(message) {
  console.error(message);
  process.exit(1);
}

function run(planPath) {
  const absPath = path.resolve(planPath);
  if (!fs.existsSync(absPath)) {
    exitWithError(`Plan file not found: ${planPath}`);
  }

  let plan;
  try {
    plan = readJsonFile(absPath);
  } catch (err) {
    exitWithError(`Invalid JSON in plan file: ${planPath}`);
  }

  if (!plan.attestation) plan.attestation = {};
  const hash = computeCanonicalPlanHash(plan);
  plan.attestation.plan_hash = hash;
  writeJsonFile(absPath, plan);
  console.log(`updated plan_hash: ${hash}`);
}

const planArg = process.argv[2];
if (!planArg) {
  console.error("Usage: node core/attest-plan.js plans/PLAN-0002.json");
  process.exit(1);
}

run(planArg);

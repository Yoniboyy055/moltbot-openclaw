const fs = require("fs");
const crypto = require("crypto");

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

const planPath = process.argv[2];
if (!planPath) {
  console.error("Usage: node core/canonical-hash.js plans/PLAN-0001.json");
  process.exit(1);
}

const raw = fs.readFileSync(planPath, "utf8").replace(/^\uFEFF/, "");
const plan = JSON.parse(raw);

// ✅ must match run-plan.js whitelist payload
const payload = {
  plan_id: plan.plan_id,
  skill_id: plan.skill_id,
  skill_version: plan.skill_version,
  inputs: plan.inputs,
  constraints: plan.constraints,
  steps: plan.steps
};

const canonical = stableStringify(payload);
console.log(sha256String(canonical));

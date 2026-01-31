/**
 * OpenClaw Sandbox Runner (v0.1)
 * Fix: canonical plan hashing (prevents self-referential hash failure)
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function nowIso() {
  return new Date().toISOString();
}

function appendLog(line) {
  const logPath = path.join(process.cwd(), "logs", "audit.log");
  fs.appendFileSync(logPath, line + "\n", { encoding: "utf8" });
}

function requireDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

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

function loadPlan(planPath) {
  const raw = fs.readFileSync(planPath, "utf8");
  return JSON.parse(raw);
}

// Canonical hash: hash plan content with plan_hash blanked
function computeCanonicalPlanHash(plan) {
  const clone = JSON.parse(JSON.stringify(plan));
  if (!clone.attestation) clone.attestation = {};
  clone.attestation.plan_hash = "";
  const canonical = stableStringify(clone);
  return sha256String(canonical);
}

function verifyAttestation(planPath, plan) {
  assert(plan.attestation && typeof plan.attestation.plan_hash === "string", "Missing plan_hash in attestation");
  const expected = computeCanonicalPlanHash(plan);
  const actual = plan.attestation.plan_hash.toLowerCase();

  if (actual !== expected) {
    appendLog(`[${nowIso()}] ATTEST fail plan_id=${plan.plan_id} expected=${expected} actual=${actual}`);
    throw new Error("Plan hash mismatch (attestation failed)");
  }
  return expected;
}

function writeArtifact(planId, filename, content) {
  const outDir = path.join(process.cwd(), "artifacts", planId);
  requireDir(outDir);
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, content, { encoding: "utf8" });
  const hash = sha256String(fs.readFileSync(outPath, "utf8"));
  return { outPath, hash };
}

/**
 * Minimal generators (v0): safe placeholders only.
 */
function generateSitemap() {
  return `# Sitemap (DEMO / DRAFT)

- Home
  - Hero
  - Trust Strip (placeholders)
  - Services Snapshot
  - Featured Work (placeholders)
  - Process
  - Safety & Compliance (generic)
  - FAQ
  - Contact (placeholder)

- Services
  - Trenching & Excavation
  - Underground Utilities Support
  - Site Servicing

- Projects (placeholders)
- About
- Trust & Compliance
- Contact
`;
}

function generateCopy(plan) {
  const b = plan.inputs.business_name;
  const r = plan.inputs.city_region;

  return `# Copy (DEMO / DRAFT — NOT FOR PUBLIC USE)

## HOME

**Hero:** Built for the jobs that can’t fail.

**Subhead:** Civil excavation and underground utility support for contractors and public-sector work across ${r}.

**Note:** Replace all placeholders with verified proof before public use.

**CTA:** Request a Demo Walkthrough (draft)

### Trust Strip (placeholders only)
- Serving ${r}
- Safety-first crews
- Documented process
- [CERTIFICATION / PREQUALIFICATION]

## SERVICES (draft)
- Trenching & Excavation — clean execution, controlled site discipline.
- Underground Utilities Support — inspection-ready coordination.
- Site Servicing — staged work to reduce rework and delays.

## ABOUT (draft)
${b} operates like a serious partner on serious sites — clear communication and predictable process.

## CONTACT (draft)
Form fields only. No real phone/email/address in demo.
`;
}

function generateTokens() {
  return JSON.stringify({
    typography: { h1: "2.25rem", h2: "1.5rem", body: "1rem" },
    spacing: [4, 8, 12, 16, 24, 32],
    radius: [8, 16, 24],
    shadows: ["sm", "md", "lg"]
  }, null, 2);
}

function generateScaffoldTree() {
  return `/site
  /pages
    index
    services
    projects
    about
    trust-compliance
    contact
  /components
    Hero
    ProofStrip
    ServicesGrid
    CaseStudyCard
    ProcessSteps
    FAQ
    FooterLegalCluster
  /content
    sitemap.md
    copy.md
    content-map.json
  /styles
    tokens.json
`;
}

function generateContentMap() {
  return JSON.stringify({
    home: ["hero", "trust_strip", "services_snapshot", "featured_work", "process", "faq", "contact"],
    services: ["trenching", "utilities_support", "site_servicing"],
    about: ["story", "values"],
    contact: ["form"]
  }, null, 2);
}

function integrityChecks(planId) {
  const dir = path.join(process.cwd(), "artifacts", planId);
  const required = ["sitemap.md","copy.md","tokens.json","scaffold-tree.txt","content-map.json"];
  const missing = required.filter(f => !fs.existsSync(path.join(dir, f)));
  return { ok: missing.length === 0, missing };
}

function generateSummary(plan, canonicalHash) {
  return `# Summary (DEMO / DRAFT)

Plan: ${plan.plan_id}
Skill: ${plan.skill_id} v${plan.skill_version}
Canonical Attestation Hash: ${canonicalHash}

Outputs generated:
- sitemap.md
- copy.md
- tokens.json
- scaffold-tree.txt
- content-map.json
- integrity-report.md
- summary.md

Limits:
- No outreach
- No deployment
- No real contact data
- No proof claims (certs/awards/metrics)
`;
}

function run(planPath) {
  requireDir(path.join(process.cwd(), "logs"));

  const plan = loadPlan(planPath);
  appendLog(`[${nowIso()}] START plan_id=${plan.plan_id} plan_path=${planPath}`);

  const canonicalHash = verifyAttestation(planPath, plan);
  appendLog(`[${nowIso()}] ATTEST ok plan_id=${plan.plan_id} hash=${canonicalHash}`);

  const planId = plan.plan_id;

  const s1 = writeArtifact(planId, "sitemap.md", generateSitemap());
  appendLog(`[${nowIso()}] STEP 01 output=${s1.outPath} hash=${s1.hash}`);

  const s2 = writeArtifact(planId, "copy.md", generateCopy(plan));
  appendLog(`[${nowIso()}] STEP 02 output=${s2.outPath} hash=${s2.hash}`);

  const s3 = writeArtifact(planId, "tokens.json", generateTokens());
  appendLog(`[${nowIso()}] STEP 03 output=${s3.outPath} hash=${s3.hash}`);

  const s4 = writeArtifact(planId, "scaffold-tree.txt", generateScaffoldTree());
  appendLog(`[${nowIso()}] STEP 04 output=${s4.outPath} hash=${s4.hash}`);

  const s5 = writeArtifact(planId, "content-map.json", generateContentMap());
  appendLog(`[${nowIso()}] STEP 05 output=${s5.outPath} hash=${s5.hash}`);

  const integ = integrityChecks(planId);
  const s6 = writeArtifact(planId, "integrity-report.md", `# Integrity Report\nok=${integ.ok}\nmissing=${JSON.stringify(integ.missing)}\n`);
  appendLog(`[${nowIso()}] STEP 06 output=${s6.outPath} hash=${s6.hash}`);

  const s7 = writeArtifact(planId, "summary.md", generateSummary(plan, canonicalHash));
  appendLog(`[${nowIso()}] STEP 07 output=${s7.outPath} hash=${s7.hash}`);

  appendLog(`[${nowIso()}] END plan_id=${plan.plan_id} status=success`);
  console.log("✅ Completed:", plan.plan_id);
  console.log("Artifacts:", path.join("artifacts", plan.plan_id));
  console.log("Audit log:", path.join("logs", "audit.log"));
}

const planArg = process.argv[2];
if (!planArg) {
  console.error("Usage: node core/run-plan.js plans/PLAN-0001.json");
  process.exit(1);
}

run(planArg);
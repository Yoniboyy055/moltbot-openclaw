/**
 * OpenClaw Sandbox Runner (v0)
 * - Executes attested plans in sandbox-only mode
 * - Produces artifacts/* outputs
 * - Writes append-only logs/* metadata
 *
 * No external tools. No network. No GitHub. No deploy.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function sha256File(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

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

function writeArtifact(planId, filename, content) {
  const outDir = path.join(process.cwd(), "artifacts", planId);
  requireDir(outDir);
  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, content, { encoding: "utf8" });
  const hash = sha256File(outPath);
  return { outPath, hash };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadPlan(planPath) {
  const raw = fs.readFileSync(planPath, "utf8");
  const plan = JSON.parse(raw);
  return plan;
}

function verifyAttestation(planPath, plan) {
  const computed = sha256File(planPath);
  assert(plan.attestation && plan.attestation.plan_hash, "Missing plan_hash in attestation");
  assert(plan.attestation.plan_hash === computed, "Plan hash mismatch (attestation failed)");
  return computed;
}

/**
 * Minimal generators (v0): safe placeholders only.
 * Later we can upgrade these generators — but for now we prove end-to-end flow.
 */
function generateSitemap(plan) {
  return `# Sitemap (DEMO / DRAFT)\n
- Home\n  - Hero\n  - Trust Strip (placeholders)\n  - Services Snapshot\n  - Featured Work (placeholders)\n  - Process\n  - Safety & Compliance (generic)\n  - FAQ\n  - Contact (placeholder)\n
- Services\n  - Trenching & Excavation\n  - Underground Utilities Support\n  - Site Servicing\n
- Projects (placeholders)\n- About\n- Trust & Compliance\n- Contact\n`;
}

function generateCopy(plan) {
  const b = plan.inputs.business_name;
  const r = plan.inputs.city_region;
  return `# Copy (DEMO / DRAFT — NOT FOR PUBLIC USE)\n
## HOME\n
**Hero:** Built for the jobs that can’t fail.\n
**Subhead:** Civil excavation and underground utility support for contractors and public-sector work across ${r}.\n
**Note:** Replace all placeholders with verified proof before public use.\n
**CTA:** Request a Demo Walkthrough (draft)\n
### Trust Strip (placeholders only)\n- Serving ${r}\n- Safety-first crews\n- Documented process\n- [CERTIFICATION / PREQUALIFICATION]\n
## SERVICES (draft)\n- Trenching & Excavation — clean execution, controlled site discipline.\n- Underground Utilities Support — inspection-ready coordination.\n- Site Servicing — staged work to reduce rework and delays.\n
## ABOUT (draft)\n${b} operates like a serious partner on serious sites — clear communication and predictable process.\n
## CONTACT (draft)\nForm fields only. No real phone/email/address in demo.\n`;
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

function generateSummary(plan, attestedHash) {
  return `# Summary (DEMO / DRAFT)\n
Plan: ${plan.plan_id}\nSkill: ${plan.skill_id} v${plan.skill_version}\nAttested Hash: ${attestedHash}\n
Outputs generated:\n- sitemap.md\n- copy.md\n- tokens.json\n- scaffold-tree.txt\n- content-map.json\n- integrity-report.md\n- summary.md\n
Limits:\n- No outreach\n- No deployment\n- No real contact data\n- No proof claims (certs/awards/metrics)\n`;
}

function run(planPath) {
  requireDir(path.join(process.cwd(), "logs"));
  const plan = loadPlan(planPath);

  const started = nowIso();
  appendLog(`[${started}] START plan_id=${plan.plan_id} plan_path=${planPath}`);

  // Attestation
  const computedHash = verifyAttestation(planPath, plan);
  appendLog(`[${nowIso()}] ATTEST ok plan_id=${plan.plan_id} hash=${computedHash}`);

  // Execute steps (sandbox-only, internal outputs)
  const planId = plan.plan_id;

  const s1 = writeArtifact(planId, "sitemap.md", generateSitemap(plan));
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

  const s7 = writeArtifact(planId, "summary.md", generateSummary(plan, computedHash));
  appendLog(`[${nowIso()}] STEP 07 output=${s7.outPath} hash=${s7.hash}`);

  const ended = nowIso();
  appendLog(`[${ended}] END plan_id=${plan.plan_id} status=success`);
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

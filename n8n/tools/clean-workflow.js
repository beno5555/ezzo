// Runs inside the n8n container (export-workflow.ps1): turns one exported workflow into the file committed under
// n8n/workflows/. Keeps what defines the workflow and drops what must not be committed: pinned test data (a payload
// pinned while building a workflow would be committed with it) and what n8n stamps per instance (version ids,
// publish state, dates, sharing, static data).
// Usage: node clean-workflow.js <exported.json> <clean.json>
const fs = require('fs');

const [, , inputPath, outputPath] = process.argv;
const exported = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const workflow = Array.isArray(exported) ? exported[0] : exported;

const hasWorkflowId = Boolean(workflow) && typeof workflow.id === 'string' && workflow.id.length > 0;
if (!hasWorkflowId) {
  console.error(`${inputPath} holds no workflow with an id.`);
  process.exit(1);
}

const clean = {
  id: workflow.id,
  name: workflow.name,
  nodes: workflow.nodes,
  connections: workflow.connections,
  settings: workflow.settings ?? {},
  pinData: {},
};

fs.writeFileSync(outputPath, `${JSON.stringify(clean, null, 2)}\n`);

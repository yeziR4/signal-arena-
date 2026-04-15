import { spawn } from 'child_process';
import readline from 'readline';
import path from 'path';

const projectPath = process.cwd();
const apiKey = process.env.TESTSPRITE_API_KEY || "";

console.log(`Starting TestSprite Prep (Steps 1 & 2)...`);

const child = spawn('npx', ['-y', '@testsprite/testsprite-mcp@latest', 'server'], {
  env: { ...process.env, API_KEY: apiKey },
  shell: true,
  stdio: ['pipe', 'pipe', 'pipe']
});

const rl = readline.createInterface({ input: child.stdout });

async function callTool(id: number, name: string, args: any) {
  console.log(`[CALL] ${name}...`);
  child.stdin.write(JSON.stringify({
    jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args }
  }) + '\n');
}

rl.on('line', async (line) => {
  if (line.trim().startsWith('{')) {
    try {
      const msg = JSON.parse(line);
      
      if (msg.id === 1) { // Init response
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
        await callTool(2, "testsprite_generate_code_summary", { projectPath });
      }
      
      if (msg.id === 2) {
        console.log("Step 1 Complete.");
        await callTool(3, "testsprite_generate_standardized_prd", { projectPath });
      }
      
      if (msg.id === 3) {
        console.log("Step 2 Complete. Preparation finished.");
        process.exit(0);
      }
    } catch (e) {}
  }
});

// Start Handshake
child.stdin.write(JSON.stringify({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'sequencer', version: '1.0.0' }
  }
}) + '\n');

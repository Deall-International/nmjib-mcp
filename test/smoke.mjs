// stdio 브리지 스모크 — 자식 프로세스로 띄워 initialize → tools/list → tools/call 을 왕복한다.
// 기본은 프로덕션(https://nmjib.com/api/mcp); NMJIB_MCP_URL 로 프리뷰 URL 을 줄 수 있다.
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { createInterface } from 'node:readline';

const child = spawn(process.execPath, [new URL('../bin/nmjib-mcp.js', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')], { stdio: ['pipe', 'pipe', 'inherit'], env: process.env });
const rl = createInterface({ input: child.stdout });
const pending = new Map();
rl.on('line', (line) => {
  const msg = JSON.parse(line);
  const p = pending.get(msg.id);
  if (p) { pending.delete(msg.id); p(msg); }
});
const send = (msg) => new Promise((resolve, reject) => {
  if (msg.id !== undefined) { pending.set(msg.id, resolve); setTimeout(() => reject(new Error('timeout ' + msg.method)), 30000); }
  child.stdin.write(JSON.stringify(msg) + '\n');
  if (msg.id === undefined) resolve(null);
});

const init = await send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'smoke', version: '1' } } });
assert.equal(init.result.serverInfo.name, 'nmjib');
await send({ jsonrpc: '2.0', method: 'notifications/initialized' });
const tools = await send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
assert.equal(tools.result.tools.length, 6);
const call = await send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'nmjib_process_guide', arguments: { pyeong: 30 } } });
assert.ok(call.result.structuredContent.schedule.totalBusinessDays > 10);
console.log('nmjib-mcp stdio bridge OK —', tools.result.tools.map((t) => t.name).join(', '), '| 30py', call.result.structuredContent.schedule.totalBusinessDays, 'business days');
child.stdin.end();

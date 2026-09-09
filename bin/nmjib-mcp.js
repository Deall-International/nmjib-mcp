#!/usr/bin/env node
// nmjib-mcp — stdio ↔ Streamable HTTP bridge for the 내만집 (nmjib.com) MCP server.
//
// Why a bridge: some MCP hosts (older Claude Desktop configs, Windsurf, custom agents) only speak stdio.
// The real server is stateless HTTP at https://nmjib.com/api/mcp, so each JSON-RPC line from stdin is
// POSTed as-is and the JSON reply is written back as one line. Notifications get no reply (HTTP 202).
//
// Usage:  npx nmjib-mcp            (env NMJIB_MCP_URL overrides the endpoint, e.g. a preview deployment)
// Zero dependencies — Node 18+ (global fetch).

import { createInterface } from 'node:readline';

const URL = process.env.NMJIB_MCP_URL || 'https://nmjib.com/api/mcp';
const TIMEOUT_MS = 30000;
let protocolVersion = '2025-06-18';

const write = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');

async function forward(msg) {
  const isNotification = msg && typeof msg === 'object' && !Array.isArray(msg) && msg.id === undefined;
  if (msg && msg.method === 'initialize' && msg.params && typeof msg.params.protocolVersion === 'string') protocolVersion = msg.params.protocolVersion;
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': protocolVersion, 'user-agent': 'nmjib-mcp/1.0 (stdio bridge)' },
    body: JSON.stringify(msg),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 202 || isNotification) return;
  const text = await res.text();
  if (!res.ok) {
    if (msg && msg.id !== undefined) write({ jsonrpc: '2.0', id: msg.id, error: { code: -32000, message: `nmjib upstream HTTP ${res.status}`, data: text.slice(0, 400) } });
    return;
  }
  const negotiated = res.headers.get('mcp-protocol-version');
  if (negotiated) protocolVersion = negotiated;
  process.stdout.write(text.trim() + '\n');
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    write({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    return;
  }
  forward(msg).catch((e) => {
    if (msg && msg.id !== undefined) write({ jsonrpc: '2.0', id: msg.id, error: { code: -32000, message: `nmjib upstream unreachable: ${e && e.message ? e.message : e}` } });
  });
});
rl.on('close', () => process.exit(0));

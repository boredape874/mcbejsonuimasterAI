#!/usr/bin/env node
import { createLocalBackend } from "./mcp-backend.mjs";
import { createMcbeUiService } from "./_lib/mcp-service.mjs";

async function main() {
  let sdk;
  try {
    sdk = await Promise.all([
      import("@modelcontextprotocol/sdk/server/index.js"),
      import("@modelcontextprotocol/sdk/server/stdio.js"),
      import("@modelcontextprotocol/sdk/types.js"),
    ]);
  } catch (error) {
    process.stderr.write("mcbe-json-ui MCP could not start: @modelcontextprotocol/sdk is missing. Run the repository's normal npm install after package.json has been updated.\n");
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
    return;
  }

  const [{ Server }, { StdioServerTransport }, { CallToolRequestSchema, ListToolsRequestSchema }] = sdk;
  const service = createMcbeUiService(await createLocalBackend());
  const server = new Server(
    { name: "mcbe-json-ui-local", version: "0.2.0" },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: service.tools }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const result = await service.dispatch(request.params.name, request.params.arguments ?? {});
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
      isError: result.ok === false,
    };
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});

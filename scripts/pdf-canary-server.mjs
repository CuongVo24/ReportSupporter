// W25-K (S3): local canary listener for the PDF integration probe. Any HTTP
// request that reaches this server means an outbound request from the PDF
// renderer's sandboxed page was NOT blocked by Puppeteer's request
// interception (server.mjs `page.setRequestInterception(true)` + abort-all
// policy). Kept deliberately dumb: count hits, expose the count, never fail
// on its own.
import { createServer } from "node:http";

const PORT = Number(process.env.CANARY_PORT || "9000");
let hits = 0;

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/hits") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ hits }));
    return;
  }
  if (request.method === "POST" && request.url === "/reset") {
    hits = 0;
    response.writeHead(204).end();
    return;
  }
  // Any other path is a canary hit — the renderer sandbox reached us.
  hits += 1;
  response.writeHead(200, { "Content-Type": "image/png" }).end();
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(JSON.stringify({ evt: "canary-listening", port: PORT }));
});

/**
 * Payload's @payloadcms/db-sqlite uses `import '@libsql/client'`, which resolves to the Node
 * entry on Vercel. Turso documents `@libsql/client/web` for serverless (HTTP-only), which
 * avoids auth failures (e.g. HTTP 401) in some deployments.
 *
 * Idempotent; runs from `postinstall` after `npm install`.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const connectPath = path.join(
  __dirname,
  "../node_modules/@payloadcms/db-sqlite/dist/connect.js",
);

if (!fs.existsSync(connectPath)) {
  console.warn(
    "[ensure-libsql-web-driver] skip: @payloadcms/db-sqlite/dist/connect.js not found",
  );
  process.exit(0);
}

let src = fs.readFileSync(connectPath, "utf8");
const needle = "from '@libsql/client'";
const wanted = "from '@libsql/client/web'";

if (src.includes(wanted)) {
  process.exit(0);
}
if (!src.includes(needle)) {
  console.warn(
    "[ensure-libsql-web-driver] skip: connect.js import line changed; update this script",
  );
  process.exit(0);
}

src = src.replace(needle, wanted);
fs.writeFileSync(connectPath, src);
console.log(
  "[ensure-libsql-web-driver] patched @payloadcms/db-sqlite to use @libsql/client/web",
);

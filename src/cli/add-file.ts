// src/cli/add-file.ts
/**
 * CLI: add-file
 *
 * This command adds a file by calling
 * the internal API via internal client.
 */

import { addFile } from "./internal-client";

async function main() {
  const filename = process.argv[2];
  const sizeArg = process.argv[3];

  if (!filename || !sizeArg) {
    console.error("Usage: add-file <filename> <size>");
    process.exit(1);
  }

  const size = Number(sizeArg);
  if (Number.isNaN(size)) {
    console.error("size must be a number");
    process.exit(1);
  }

  const result = await addFile({ filename, size });

  console.log("✅ file added");
  console.log("fileId:", result.fileId);
}

main().catch((err) => {
  console.error("❌ add-file failed");
  console.error(err);
  process.exit(1);
});

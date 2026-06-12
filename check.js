const { spawnSync } = require("child_process");

const files = ["app.js", "server.js"];

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}

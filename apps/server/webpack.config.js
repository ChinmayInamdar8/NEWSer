const fs = require("fs");
const path = require("path");
const nodeExternals = require("webpack-node-externals");
const dotenv = require("dotenv");

const envFile = path.resolve(__dirname, ".env");
const parsed = dotenv.config({ path: envFile }).parsed ?? {};

fs.writeFileSync(
  path.resolve(__dirname, "src/compiled-env.ts"),
  `export const compiledEnv: Record<string, string> = ${JSON.stringify(parsed, null, 2)};\n`
);

module.exports = function (options) {
  return {
    ...options,
    node: {
      __dirname: true,
      __filename: true,
    },
    externals: [
      nodeExternals({
        allowlist: [/^@workspace\//],
      }),
    ],
    resolve: {
      ...options.resolve,
      alias: {
        ...(options.resolve?.alias ?? {}),
        "@workspace/db": path.resolve(
          __dirname,
          "../../packages/database/src/index.ts"
        ),
        "@workspace/auth": path.resolve(
          __dirname,
          "../../packages/auth/src/index.ts"
        ),
        "@workspace/types": path.resolve(
          __dirname,
          "../../packages/types/src/index.ts"
        ),
      },
      extensionAlias: {
        ...(options.resolve?.extensionAlias ?? {}),
        ".js": [".ts", ".js"],
      },
    },
  };
};

import { readFileSync, writeFileSync } from "node:fs";

const dockerfile = "upstream-project/Dockerfile";
const source = readFileSync(dockerfile, "utf8");

const stage = `
FROM rust:1.88-bookworm AS buzz_cli_build
ARG BUZZ_CLI_REF=main
RUN apt-get -o Acquire::Retries=3 update && \\
    apt-get -o Acquire::Retries=3 install -y --no-install-recommends \\
        ca-certificates git pkg-config build-essential && \\
    rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 --branch "\${BUZZ_CLI_REF}" https://github.com/block/buzz.git /tmp/buzz && \\
    cd /tmp/buzz && \\
    cargo build --release -p buzz-cli && \\
    strip target/release/buzz || true
`;

if (!source.includes(" AS buzz_cli_build")) {
  const anchor =
    "FROM node:26-bookworm-slim@sha256:9e6f9357d371591e32ab6f2d8a26d63bdd0d17c29eee3f4f3e7e454d9634bf73 AS node_source\n";
  if (!source.includes(anchor)) {
    throw new Error("Unable to locate node_source stage anchor in Dockerfile");
  }
  writeFileSync(dockerfile, source.replace(anchor, `${anchor}${stage}`));
}

const updated = readFileSync(dockerfile, "utf8");
if (
  !updated.includes(
    "COPY --from=buzz_cli_build /tmp/buzz/target/release/buzz /usr/local/bin/buzz",
  )
) {
  const anchor =
    "COPY --chmod=0755 --from=uv_source /usr/local/bin/uv /usr/local/bin/uvx /usr/local/bin/\n";
  if (!updated.includes(anchor)) {
    throw new Error("Unable to locate uv binary copy anchor in Dockerfile");
  }
  writeFileSync(
    dockerfile,
    updated.replace(
      anchor,
      `${anchor}COPY --from=buzz_cli_build /tmp/buzz/target/release/buzz /usr/local/bin/buzz\nRUN chmod 0755 /usr/local/bin/buzz && /usr/local/bin/buzz --help >/dev/null\n`,
    ),
  );
}

console.log("Patched upstream Dockerfile to include /usr/local/bin/buzz");

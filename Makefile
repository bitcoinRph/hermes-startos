ARCHES := x86_64 aarch64
# The SDK s9pk.mk extracts PACKAGE_ID with a single-quote awk; this repo is
# formatted with double quotes, so pin the id here to match the manifest.
PACKAGE_ID := hermes-agent-startos
# overrides to s9pk.mk must precede the include statement
include node_modules/@start9labs/start-sdk/s9pk.mk

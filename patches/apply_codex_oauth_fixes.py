#!/usr/bin/env python3
"""
Apply Codex OAuth bug fix cherry-picked from NousResearch/hermes-agent.

Fix applied:
  - PR #33424: drop dead model slugs that HTTP 400 on ChatGPT Pro OAuth

Note: PR #33168 (classify Codex 429 as rate-limit) is already present in
the upstream-project submodule at 136cb05c.

Run from the upstream-project directory:
    python3 ../patches/apply_codex_oauth_fixes.py
"""

import sys
from pathlib import Path


def replace_exact(path: Path, old: str, new: str, label: str) -> None:
    src = path.read_text(encoding="utf-8")
    if old not in src:
        print(f"ERROR: anchor not found in {path}: {label}", file=sys.stderr)
        sys.exit(1)
    if src.count(old) > 1:
        print(f"ERROR: anchor is not unique in {path}: {label}", file=sys.stderr)
        sys.exit(1)
    path.write_text(src.replace(old, new, 1), encoding="utf-8")
    print(f"  patched {path}: {label}")


# ---------------------------------------------------------------------------
# hermes_cli/codex_models.py — PR #33424
# ---------------------------------------------------------------------------
codex_models_py = Path("hermes_cli/codex_models.py")

replace_exact(
    codex_models_py,
    '    "gpt-5.3-codex-spark",\n'
    '    "gpt-5.2-codex",\n'
    '    "gpt-5.1-codex-max",\n'
    '    "gpt-5.1-codex-mini",\n'
    "]\n"
    "\n"
    "_FORWARD_COMPAT_TEMPLATE_MODELS: List[tuple[str, tuple[str, ...]]] = [\n"
    '    ("gpt-5.5", ("gpt-5.4", "gpt-5.4-mini", "gpt-5.3-codex")),\n'
    '    ("gpt-5.4-mini", ("gpt-5.3-codex", "gpt-5.2-codex")),\n'
    '    ("gpt-5.4", ("gpt-5.3-codex", "gpt-5.2-codex")),\n'
    '    ("gpt-5.3-codex", ("gpt-5.2-codex",)),\n'
    "    # Surface Spark whenever any compatible Codex template is present so\n"
    "    # accounts hitting the live endpoint with an older lineup still see\n"
    "    # Spark in the picker. Backend gates real availability by ChatGPT Pro\n"
    "    # entitlement; Hermes does not.\n"
    '    ("gpt-5.3-codex-spark", ("gpt-5.3-codex", "gpt-5.2-codex")),\n'
    "]",
    '    "gpt-5.3-codex-spark",\n'
    "    # NOTE: gpt-5.2-codex / gpt-5.1-codex-max / gpt-5.1-codex-mini were\n"
    "    # previously listed here but the chatgpt.com Codex backend returns\n"
    '    # HTTP 400 "The \'<model>\' model is not supported when using Codex with\n'
    "    # a ChatGPT account.\" for all three on every ChatGPT Pro account we've\n"
    "    # tested (verified live 2026-05-27). Keeping them in the fallback list\n"
    "    # leaked dead slugs into /model when live discovery was unavailable\n"
    "    # (transient API failure, first-run before refresh) and surfaced HTTP 400\n"
    "    # crashes on selection. The Codex CLI public catalog still references\n"
    "    # these slugs, which is why they survived previously — but those entries\n"
    "    # describe the public OpenAI API, not the OAuth-backed Codex backend\n"
    "    # Hermes uses. Removed here. If OpenAI re-enables them on Codex backend,\n"
    "    # live discovery will pick them up automatically via _fetch_models_from_api.\n"
    "]\n"
    "\n"
    "_FORWARD_COMPAT_TEMPLATE_MODELS: List[tuple[str, tuple[str, ...]]] = [\n"
    '    ("gpt-5.5", ("gpt-5.4", "gpt-5.4-mini", "gpt-5.3-codex")),\n'
    '    ("gpt-5.4-mini", ("gpt-5.3-codex",)),\n'
    '    ("gpt-5.4", ("gpt-5.3-codex",)),\n'
    "    # Surface Spark whenever any compatible Codex template is present so\n"
    "    # accounts hitting the live endpoint with an older lineup still see\n"
    "    # Spark in the picker. Backend gates real availability by ChatGPT Pro\n"
    "    # entitlement; Hermes does not.\n"
    '    ("gpt-5.3-codex-spark", ("gpt-5.3-codex",)),\n'
    "]",
    "remove dead Codex model slugs from DEFAULT_CODEX_MODELS and forward-compat table",
)

print("\nAll Codex OAuth fixes applied successfully.")

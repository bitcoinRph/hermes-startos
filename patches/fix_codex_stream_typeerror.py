#!/usr/bin/env python3
"""
Patch codex_runtime.py to recover from TypeError when the ChatGPT Codex backend
returns output: null in the terminal SSE event.

The openai SDK 2.24.x propagates this as:
    TypeError: 'NoneType' object is not iterable
from within stream.__iter__, before Hermes can inspect the response.

The fix catches TypeError inside run_codex_stream and synthesizes a response
from collected stream items or text deltas, matching the existing empty-output
backfill logic.

Run from the upstream-project directory:
    python3 ../patches/fix_codex_stream_typeerror.py
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


codex_runtime_py = Path("agent/codex_runtime.py")

replace_exact(
    codex_runtime_py,
    '        except (_httpx.RemoteProtocolError, _httpx.ReadTimeout, _httpx.ConnectError, ConnectionError) as exc:\n'
    '            if attempt < max_stream_retries:\n'
    '                logger.debug(\n'
    '                    "Codex Responses stream transport failed (attempt %s/%s); retrying. %s error=%s",\n'
    '                    attempt + 1,\n'
    '                    max_stream_retries + 1,\n'
    '                    agent._client_log_context(),\n'
    '                    exc,\n'
    '                )\n'
    '                continue\n'
    '            logger.debug(\n'
    '                "Codex Responses stream transport failed; falling back to create(stream=True). %s error=%s",\n'
    '                agent._client_log_context(),\n'
    '                exc,\n'
    '            )\n'
    '            return agent._run_codex_create_stream_fallback(api_kwargs, client=active_client)',
    '        except TypeError as exc:\n'
    '            # The ChatGPT Codex backend occasionally returns `output: null` (or\n'
    '            # null on another field the SDK iterates over internally) in the\n'
    '            # terminal SSE event.  The openai SDK 2.24.x propagates this as\n'
    '            # ``TypeError: \'NoneType\' object is not iterable`` from within\n'
    '            # ``stream.__iter__`` before we can inspect the response.\n'
    '            # Recover by synthesizing a response from the deltas/items we\n'
    '            # already collected during the stream, exactly as the empty-output\n'
    '            # backfill code path does above.  If neither source has content,\n'
    '            # fall through to the create(stream=True) fallback.\n'
    '            logger.warning(\n'
    '                "Codex stream TypeError (likely null output field from backend): %s — "\n'
    '                "attempting recovery from %d collected items / %d streamed chars. %s",\n'
    '                exc,\n'
    '                len(collected_output_items),\n'
    '                sum(len(p) for p in agent._codex_streamed_text_parts),\n'
    '                agent._client_log_context(),\n'
    '            )\n'
    '            if collected_output_items:\n'
    '                recovered = SimpleNamespace(\n'
    '                    output=list(collected_output_items),\n'
    '                    status="completed",\n'
    '                )\n'
    '                logger.debug(\n'
    '                    "Codex stream TypeError recovery: backfilled %d output items",\n'
    '                    len(collected_output_items),\n'
    '                )\n'
    '                return recovered\n'
    '            if agent._codex_streamed_text_parts and not has_tool_calls:\n'
    '                assembled = "".join(agent._codex_streamed_text_parts)\n'
    '                recovered = SimpleNamespace(\n'
    '                    output=[SimpleNamespace(\n'
    '                        type="message",\n'
    '                        role="assistant",\n'
    '                        status="completed",\n'
    '                        content=[SimpleNamespace(type="output_text", text=assembled)],\n'
    '                    )],\n'
    '                    status="completed",\n'
    '                )\n'
    '                logger.debug(\n'
    '                    "Codex stream TypeError recovery: synthesized from %d text deltas (%d chars)",\n'
    '                    len(agent._codex_streamed_text_parts), len(assembled),\n'
    '                )\n'
    '                return recovered\n'
    '            logger.debug(\n'
    '                "Codex stream TypeError recovery: no content available, falling back to create(stream=True)"\n'
    '            )\n'
    '            return agent._run_codex_create_stream_fallback(api_kwargs, client=active_client)\n'
    '        except (_httpx.RemoteProtocolError, _httpx.ReadTimeout, _httpx.ConnectError, ConnectionError) as exc:\n'
    '            if attempt < max_stream_retries:\n'
    '                logger.debug(\n'
    '                    "Codex Responses stream transport failed (attempt %s/%s); retrying. %s error=%s",\n'
    '                    attempt + 1,\n'
    '                    max_stream_retries + 1,\n'
    '                    agent._client_log_context(),\n'
    '                    exc,\n'
    '                )\n'
    '                continue\n'
    '            logger.debug(\n'
    '                "Codex Responses stream transport failed; falling back to create(stream=True). %s error=%s",\n'
    '                agent._client_log_context(),\n'
    '                exc,\n'
    '            )\n'
    '            return agent._run_codex_create_stream_fallback(api_kwargs, client=active_client)',
    "catch TypeError from null output field in Codex stream and recover gracefully",
)

print("\nCodex stream TypeError fix applied successfully.")

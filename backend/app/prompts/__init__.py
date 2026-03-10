import re


def select_system_prompt(mode: str) -> str:
    from .check import CHECK_PROMPT
    from .specz import SPECZ_PROMPT

    return CHECK_PROMPT if mode == "speczcheck" else SPECZ_PROMPT


def format_conversation_text(
    messages: list[dict[str, str]],
) -> str:
    return "\n\n".join(f"{m['role'].upper()}: {m['content']}" for m in messages)


def extract_title(markdown: str) -> str:
    match = re.search(r"^#\s+(.+?)(?:\s*—.*)?$", markdown, re.MULTILINE)
    return match.group(1).strip() if match else "Untitled Spec"

import re
from typing import Dict, Any

INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+|previous\s+|the\s+above\s+)*instructions",
    r"(?i)system\s*prompt",
    r"(?i)you\s+are\s+now\s+a",
    r"(?i)disregard\s+(previous|all)",
    r"(?i)repeat\s+after\s+me",
    r"(?i)new\s+system\s+directive",
    r"(?i)override\s+(system|rules)",
]

def sanitize_text(text: str) -> str:
    """Removes non-printable characters and controls string length."""
    if not text:
        return ""
    # Remove NULL and control characters except whitespace
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    # Truncate to reasonable maximum length to prevent token overflow
    return cleaned.strip()[:4000]

def contains_prompt_injection_signals(text: str) -> bool:
    """Checks if text contains common prompt injection attack signatures."""
    if not text:
        return False
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, text):
            return True
    return False

def format_safe_challenge_xml(
    title: str,
    description: str,
    citizen_category: str = "",
    severity: str = "",
    affected_population: str = "",
    existing_attempts: str = "",
    expected_outcome: str = "",
    location_context: Dict[str, Any] = None
) -> str:
    """
    Wraps untrusted citizen-submitted text strictly inside XML delimiters.
    Any instructions inside these tags must be interpreted purely as problem content.
    """
    loc_str = ""
    if location_context:
        district = location_context.get("district") or "Unknown"
        block = location_context.get("block") or "Unknown"
        village = location_context.get("village_city") or "Unknown"
        loc_str = f"District: {district}, Block: {block}, Village/City: {village}"

    return f"""<challenge_content>
  <title>{sanitize_text(title)}</title>
  <description>{sanitize_text(description)}</description>
  <citizen_category>{sanitize_text(citizen_category)}</citizen_category>
  <citizen_severity>{sanitize_text(severity)}</citizen_severity>
  <affected_population>{sanitize_text(affected_population)}</affected_population>
  <existing_attempts>{sanitize_text(existing_attempts)}</existing_attempts>
  <expected_outcome>{sanitize_text(expected_outcome)}</expected_outcome>
  <location_summary>{loc_str}</location_summary>
</challenge_content>"""

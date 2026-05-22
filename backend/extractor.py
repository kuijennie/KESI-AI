"""
NLP extraction engine using spaCy en_core_web_sm.

spaCy gives us:
  - Named Entity Recognition (PERSON, ORG, DATE, MONEY, GPE)
  - Dependency-parse-based sentence segmentation
  - Token-level POS tags for proximity logic

Regex is kept only for Kenya-specific structured patterns
(case numbers, court headers) where the format is rigid.
"""
import re
import spacy

nlp = spacy.load("en_core_web_sm")


# ── Structured / regex extractions (format is rigid) ─────────────────────────

def extract_case_number(text: str) -> str:
    patterns = [
        r'(?:CIVIL|CRIMINAL)\s+CASE\s+NO\.?\s+\d+\s+OF\s+\d{4}',
        r'CASE\s+NO\.?\s+\d+\s+OF\s+\d{4}',
        r'PETITION\s+NO\.?\s+\d+\s+OF\s+\d{4}',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return m.group(0).strip()
    return ""


def extract_court(text: str) -> str:
    m = re.search(
        r'IN\s+THE\s+([\w\s]+COURT[\w\s]*)\s+OF\s+KENYA\s+AT\s+([\w\s]+)',
        text, re.IGNORECASE
    )
    if m:
        location = m.group(2).strip().split("\n")[0].strip()
        return f"IN THE {m.group(1).strip()} OF KENYA AT {location}"
    return ""


# ── NER-powered extractions ────────────────────────────────────────────────────

def extract_parties(text: str, doc) -> tuple[str, str]:
    """
    Try structured header parsing first (most reliable for Kenyan rulings).
    Fall back to spaCy PERSON/ORG entities in the BETWEEN block.
    """
    plaintiff = _regex_party(text, "PLAINTIFF")
    defendant = _regex_party(text, "DEFENDANT")

    if not plaintiff or not defendant:
        between_block = _get_between_block(text)
        if between_block:
            block_doc = nlp(between_block)
            ner_names = [
                ent.text.strip()
                for ent in block_doc.ents
                if ent.label_ in ("PERSON", "ORG")
            ]
            if not plaintiff and len(ner_names) >= 1:
                plaintiff = ner_names[0]
            if not defendant and len(ner_names) >= 2:
                defendant = ner_names[1]

    return plaintiff, defendant


def extract_judge(text: str, doc) -> str:
    """
    Prefer regex for the structured 'BEFORE HON. JUSTICE X' line.
    Fall back to: find a PERSON entity whose left context contains 'JUSTICE'.
    """
    m = re.search(r'BEFORE\s+(HON\.?\s+JUSTICE\s+[\w\s.]+)', text, re.IGNORECASE)
    if m:
        return m.group(1).strip().split("\n")[0].strip()

    for ent in doc.ents:
        if ent.label_ == "PERSON":
            ctx_start = max(0, ent.start_char - 40)
            ctx = text[ctx_start: ent.start_char]
            if re.search(r'HON\.?|JUSTICE|CORAM', ctx, re.IGNORECASE):
                return f"HON. JUSTICE {ent.text.strip()}"

    return ""


def extract_date(text: str, doc) -> str:
    """
    Prefer Kenyan legal date patterns, then fall back to spaCy DATE entities.
    """
    patterns = [
        r'(?:JUDGMENT\s+)?DELIVERED\s+ON\s+([\w\s,]+\d{4})',
        r'Dated\s+at\s+[\w\s]+\s+this\s+([\w\s,]+\d{4})',
        r'(\d{1,2}(?:ST|ND|RD|TH)?\s+\w+\s+\d{4})',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()

    # spaCy fallback: first DATE entity that contains a 4-digit year
    for ent in doc.ents:
        if ent.label_ == "DATE" and re.search(r'\d{4}', ent.text):
            return ent.text.strip()

    return ""


def extract_damages(text: str, doc) -> list[str]:
    """
    Use spaCy MONEY entities for amounts; look at the left-context window
    (up to 80 chars) to find the label (special damages, general damages, etc.).
    Fall back to regex when spaCy MONEY misses Kshs. amounts.
    """
    seen: set[str] = set()
    results: list[str] = []

    for ent in doc.ents:
        if ent.label_ != "MONEY":
            continue
        ctx_start = max(0, ent.start_char - 80)
        ctx = text[ctx_start: ent.start_char]
        label_m = re.search(
            r'([\w\s]+?(?:damages?|costs?|compensation|award))\s+of\s*$',
            ctx, re.IGNORECASE
        )
        label = label_m.group(1).strip() if label_m else "Amount"
        entry = f"{label}: {ent.text.strip()}"
        if entry not in seen:
            seen.add(entry)
            results.append(entry)

    # Regex fallback for "Kshs. X" patterns spaCy may have missed
    if not results:
        for m in re.finditer(
            r'([\w\s]+?(?:damages?|costs?|award))\s+of\s+(?:Kshs?\.?|KES)\s*([\d,]+)',
            text, re.IGNORECASE
        ):
            entry = f"{m.group(1).strip()}: Kshs. {m.group(2)}"
            if entry not in seen:
                seen.add(entry)
                results.append(entry)

    return results


def extract_total_award(text: str, doc) -> str:
    m = re.search(r'[Tt]otal\s+award\s+is\s+(?:Kshs?\.?|KES)\s*([\d,]+)', text)
    if m:
        return f"Kshs. {m.group(1)}"
    m = re.search(r'[Tt]otal\s+(?:Kshs?\.?|KES)\s*([\d,]+)', text)
    if m:
        return f"Kshs. {m.group(1)}"
    return ""


# ── Sentence-level NLP extractions ────────────────────────────────────────────

def extract_facts(text: str, doc) -> str:
    """
    Look for a BACKGROUND/FACTS section heading first.
    Otherwise use spaCy sentence segmentation: return first 3 long body sentences.
    """
    bg = re.search(
        r'(?:BACKGROUND|FACTS?)[:\s]*\n([\s\S]{50,800}?)(?:\n\n|\n[A-Z]{4,})',
        text, re.IGNORECASE
    )
    if bg:
        return re.sub(r'\s+', ' ', bg.group(1)).strip()

    body_sents: list[str] = []
    for sent in doc.sents:
        t = sent.text.strip()
        if len(t) > 60 and re.match(r'^(The |This |It |On |In |A )', t):
            body_sents.append(t)
        if len(body_sents) >= 3:
            break

    return " ".join(body_sents)


def extract_by_keywords(doc, keywords: list[str], max_sents: int = 2) -> str:
    """
    Use spaCy's sentence segmentation (dependency-parse based, not period-split)
    to find sentences that contain any of the given keyword phrases.
    """
    matched: list[str] = []
    for sent in doc.sents:
        lower = sent.text.lower()
        if any(kw.lower() in lower for kw in keywords):
            matched.append(sent.text.strip())
        if len(matched) >= max_sents:
            break
    return " ".join(matched)


def extract_issue(doc) -> str:
    """
    Look for explicit issue-framing language first.
    Fall back to the sentence describing the plaintiff's claim ('claiming X').
    """
    explicit_keywords = [
        "whether", "issue is", "question is", "court must determine",
        "issue before", "question before", "matter for determination",
        "question for consideration", "point of law",
    ]
    result = extract_by_keywords(doc, explicit_keywords, max_sents=2)
    if result:
        return result

    # Fallback: sentence containing the plaintiff's claim
    claim_keywords = ["claiming", "claim for", "seeks", "prays for", "contend"]
    return extract_by_keywords(doc, claim_keywords, max_sents=1)


def extract_outcome(text: str) -> str:
    plaintiff_signals = [
        r'judgment.*in\s+favour\s+of\s+the\s+plaintiff',
        r'finds?\s+in\s+favour\s+of\s+the\s+plaintiff',
        r'judgment\s+for\s+the\s+plaintiff',
        r'suit\s+(?:is\s+)?allowed',
    ]
    defendant_signals = [
        r'judgment.*in\s+favour\s+of\s+the\s+defendant',
        r'suit\s+(?:is\s+)?dismissed',
        r"plaintiff[''s]*\s+(?:case|claim|suit)\s+dismissed",
    ]
    for p in plaintiff_signals:
        if re.search(p, text, re.IGNORECASE):
            return "plaintiff"
    for p in defendant_signals:
        if re.search(p, text, re.IGNORECASE):
            return "defendant"
    return "unclear"


# ── Main entry point ──────────────────────────────────────────────────────────

def generate_brief(text: str) -> dict:
    doc = nlp(text)

    plaintiff, defendant = extract_parties(text, doc)
    case_name = (
        f"{plaintiff} v {defendant}" if plaintiff and defendant
        else plaintiff or defendant or "Unknown Parties"
    )

    return {
        "caseName": case_name,
        "caseNumber": extract_case_number(text),
        "court": extract_court(text),
        "date": extract_date(text, doc),
        "judge": extract_judge(text, doc),
        "plaintiff": plaintiff,
        "defendant": defendant,
        "facts": extract_facts(text, doc),
        "issue": extract_issue(doc),
        "holding": extract_by_keywords(
            doc,
            ["judgment is entered", "court finds", "court holds",
             "finds in favour", "judgment in favour", "orders as follows"],
        ),
        "reasoning": extract_by_keywords(
            doc,
            ["court notes", "court is satisfied", "court finds that",
             "this court is of the view", "court observes", "court agrees"],
            max_sents=3,
        ),
        "damages": extract_damages(text, doc),
        "totalAward": extract_total_award(text, doc),
        "outcome": extract_outcome(text),
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _regex_party(text: str, role: str) -> str:
    # Search line by line so we never match across newlines
    for line in text.split("\n"):
        m = re.search(rf'([A-Z][A-Z \.]+?)\s*[.\-]+\s*{role}\s*$', line.strip(), re.IGNORECASE)
        if m:
            return re.sub(r'\s+', ' ', m.group(1)).strip()
    return ""


def _get_between_block(text: str) -> str:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    try:
        idx = next(i for i, l in enumerate(lines) if re.match(r'^BETWEEN$', l, re.IGNORECASE))
        return "\n".join(lines[idx + 1: idx + 10])
    except StopIteration:
        return ""

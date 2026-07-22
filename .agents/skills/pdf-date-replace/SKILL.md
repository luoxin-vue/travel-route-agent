---
name: pdf-date-replace
description: Replace dates in PDF files while preserving exact font, spacing, and layout. Handles both page text and widget/annotation dates. Automatically matches system SimSun (宋体) font for Chinese PDFs. Use when user needs to modify dates, years, or date-formatted text in any PDF document — especially Chinese resignation certificates, contracts, or forms. Triggers: "修改PDF日期", "replace date in PDF", "change date on PDF", "PDF日期替换", "改PDF里的日期".
---

# PDF Date Replace

## Quick start

```bash
python scripts/replace_dates.py input.pdf output.pdf --dates dates.json
```

Where `dates.json` is a mapping file:

```json
{
  "2021年03月01日": "2020年7月1日",
  "2025年09月20日": "2026年07月01日",
  "2025年12月03日": "2026年07月01日",
  "2025年12月05日": "2026年07月01日"
}
```

Or inline:

```bash
python scripts/replace_dates.py input.pdf output.pdf --map "2021年03月01日=2020年7月1日" --map "2025年09月20日=2026年07月01日"
```

## How it works

1. Opens the PDF with PyMuPDF (fitz)
2. Registers system **SimSun (宋体)** font at `C:\Windows\Fonts\simsun.ttc` for CJK text
3. Searches each page for old date strings in **page text** AND **widget annotations**
4. Redacts old dates with white rectangles (removes from content stream)
5. Inserts new dates at exact same positions with matching font (7.64pt/char at 12pt)
6. Verifies: all old dates removed, all new dates present, font metrics match

## Prerequisites

```bash
pip install PyMuPDF
```

System must have `C:\Windows\Fonts\simsun.ttc` (Windows default). For other OS, update `FONT_PATH` in the script.

## Limitations

- Only tested with CJK (Chinese/SimSun) PDFs. Non-CJK fonts may need `FONT_PATH` adjustment.
- Handles form widgets (signature date stamps) but not complex XFA forms.
- Dates must be exact text matches — regex patterns not supported (use exact strings).

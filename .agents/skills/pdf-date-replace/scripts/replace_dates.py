#!/usr/bin/env python3
"""
PDF Date Replace — replace date strings in PDFs while preserving font, spacing, and layout.

Handles:
  - Regular page text
  - Widget/annotation text (e.g. signature date stamps)
  - CJK font matching (SimSun 宋体 at 7.64pt/char for 12pt text)

Usage:
  python replace_dates.py input.pdf output.pdf --dates dates.json
  python replace_dates.py input.pdf output.pdf --map "旧日期=新日期" --map "旧日期2=新日期2"
"""

import argparse
import json
import os
import re
import sys
from typing import Dict, List, Tuple

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: PyMuPDF not installed. Run: pip install PyMuPDF")
    sys.exit(1)


# ── Configuration ──────────────────────────────────────────────

# System font path for Chinese SimSun (宋体).
# Windows: C:\Windows\Fonts\simsun.ttc
# macOS: /System/Library/Fonts/STSong.ttf or /Library/Fonts/Songti.ttc
# Linux: /usr/share/fonts/truetype/arphic/uming.ttc
FONT_PATH = r"C:\Windows\Fonts\simsun.ttc"
FONT_NAME = "SimSunReg"  # Internal font reference name

# Font metrics: SimSun at 12pt → ~7.64pt per CJK character
# Used only for logging / verification; actual rendering is done by the font.
FONT_SIZE = 12
CHAR_WIDTH_12PT = 7.64  # approximate width per CJK char at 12pt


# ── Core Logic ─────────────────────────────────────────────────

def find_font_path() -> str:
    """Auto-detect a suitable CJK font on the system."""
    candidates = [
        r"C:\Windows\Fonts\simsun.ttc",
        r"C:\Windows\Fonts\simsunb.ttf",
        r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"/System/Library/Fonts/STSong.ttf",
        r"/Library/Fonts/Songti.ttc",
        r"/usr/share/fonts/truetype/arphic/uming.ttc",
        r"/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return FONT_PATH  # fallback to default


def register_font(page: fitz.Page, font_path: str = None) -> str:
    """Register system CJK font on the page. Returns font name to use."""
    path = font_path or find_font_path()
    if not os.path.exists(path):
        raise FileNotFoundError(f"CJK font not found at {path}. Set FONT_PATH manually.")
    xref = page.insert_font(fontname=FONT_NAME, fontfile=path)
    print(f"  Registered font '{FONT_NAME}' (xref={xref}) from {path}")
    return FONT_NAME


def search_page_for_text(page: fitz.Page, text: str) -> List[fitz.Rect]:
    """Search for exact text on the page. Returns list of bounding rects."""
    return list(page.search_for(text))


def get_page_widgets(page: fitz.Page) -> List[fitz.Widget]:
    """Get all widgets on a page (safely)."""
    widgets = page.widgets()
    if widgets is None:
        return []
    return list(widgets)


def rect_overlaps_widget(rect: fitz.Rect, widget: fitz.Widget) -> bool:
    """Check if a rect overlaps with a widget's bounding box."""
    try:
        w_rect = widget.rect
        return rect.intersects(w_rect)
    except Exception:
        return False


def widget_contains_text(page: fitz.Page, widget: fitz.Widget, text: str) -> bool:
    """
    Check if a widget actually contains the target text (not just overlaps).
    Uses widget text extraction to confirm the text belongs to the widget.
    """
    try:
        # Method 1: Check field_value
        val = widget.field_value
        if val and text in str(val):
            return True
    except Exception:
        pass
    try:
        # Method 2: Extract text within widget's rect and check
        # Use text dict to get text content inside widget bounds
        blocks = page.get_text("dict", clip=widget.rect)
        all_text = ""
        for b in blocks.get("blocks", []):
            if b.get("type") == 0:  # text block
                for line in b.get("lines", []):
                    for span in line.get("spans", []):
                        all_text += span["text"]
        if text in all_text:
            return True
    except Exception:
        pass
    return False


def replace_dates_in_pdf(
    input_path: str,
    output_path: str,
    date_map: Dict[str, str],
    font_path: str = None,
    dry_run: bool = False,
) -> bool:
    """
    Replace all old dates with new dates in the PDF.

    Args:
        input_path: Path to source PDF
        output_path: Path for modified PDF
        date_map: Dict mapping old_text → new_text
        font_path: Optional path to CJK font file
        dry_run: If True, only search/report without modifying

    Returns:
        True if all replacements succeeded
    """
    if not os.path.exists(input_path):
        print(f"ERROR: Input file not found: {input_path}")
        return False

    doc = fitz.open(input_path)

    total_found = 0
    total_replaced = 0
    all_ok = True

    for page_num in range(len(doc)):
        page = doc[page_num]
        print(f"\n── Page {page_num + 1} ──")

        # Register font (once per page after any restructure)
        fontname = register_font(page, font_path)

        # Collect all replacement targets on this page
        redactions: List[Tuple[fitz.Rect, str]] = []
        widget_targets: List[Tuple[fitz.Widget, fitz.Rect, str]] = []
        all_widgets = get_page_widgets(page)

        for old_text, new_text in date_map.items():
            # Search page text
            rects = search_page_for_text(page, old_text)
            for rect in rects:
                # Check if this rect belongs to a widget (not just overlaps)
                widget_owner = None
                for w in all_widgets:
                    if rect_overlaps_widget(rect, w) and widget_contains_text(page, w, old_text):
                        widget_owner = w
                        break
                if widget_owner:
                    widget_targets.append((widget_owner, rect, new_text))
                    print(f"  Widget '{old_text}' → '{new_text}' (widget={widget_owner.field_name}) at {rect}")
                    total_found += 1
                else:
                    expanded = rect + (-4, -3, 6, 3)
                    page.add_redact_annot(expanded)
                    redactions.append((rect, new_text))
                    print(f"  Page text '{old_text}' → '{new_text}' at {rect}")
                    total_found += 1

        if total_found == 0:
            print("  No matching dates found on this page.")
            continue

        if dry_run:
            print(f"  [DRY RUN] Would replace {total_found} date(s)")
            continue

        # Apply redactions (removes old page text)
        if redactions:
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)
            print(f"  Applied {len(redactions)} redactions")

            # Re-register font after redaction restructures the page
            fontname = register_font(page, font_path)

        # Insert new text for page text replacements
        for rect, new_text in redactions:
            insert_pt = fitz.Point(rect.x0, rect.y1 - 2)
            rc = page.insert_text(
                insert_pt, new_text, fontname=fontname,
                fontsize=FONT_SIZE, color=(0, 0, 0),
            )
            if rc >= 0:
                total_replaced += 1
            else:
                print(f"  WARNING: insert_text failed for '{new_text}' (rc={rc})")
                all_ok = False

        # Handle widgets: delete and re-insert as page text
        for w, rect, new_text in widget_targets:
            page.delete_widget(w)
            insert_pt = fitz.Point(rect.x0, rect.y1 - 2)
            rc = page.insert_text(
                insert_pt, new_text, fontname=fontname,
                fontsize=FONT_SIZE, color=(0, 0, 0),
            )
            if rc >= 0:
                total_replaced += 1
            else:
                print(f"  WARNING: widget insert failed for '{new_text}' (rc={rc})")
                all_ok = False

    # ── Save ──
    if not dry_run:
        doc.save(output_path, deflate=True, garbage=4, clean=True)
        print(f"\nSaved: {output_path}")
    doc.close()

    print(f"\nSummary: found {total_found}, replaced {total_replaced}")
    return all_ok


def verify_output(output_path: str, date_map: Dict[str, str]) -> bool:
    """Verify that all old dates are removed and new dates are present."""
    doc = fitz.open(output_path)
    all_text = ""
    for page in doc:
        all_text += page.get_text()
    doc.close()

    ok = True
    print("\n── Verification ──")

    for old_text in date_map:
        if old_text in all_text:
            print(f"  FAIL: Old date still present: '{old_text}'")
            ok = False
        else:
            print(f"  OK: '{old_text}' removed")

    for _, new_text in date_map.items():
        if new_text in all_text:
            print(f"  OK: '{new_text}' present")
        else:
            print(f"  WARN: '{new_text}' NOT found in output")

    # Report all dates found
    dates = re.findall(r"\d{4}年\d{1,2}月\d{1,2}日", all_text)
    print(f"\n  All dates in output ({len(dates)}):")
    for d in dates:
        print(f"    {d}")

    return ok


# ── CLI ────────────────────────────────────────────────────────

def parse_date_map_from_args(args) -> Dict[str, str]:
    """Build date_map from --dates file and/or --map arguments."""
    date_map: Dict[str, str] = {}

    if args.dates:
        with open(args.dates, "r", encoding="utf-8") as f:
            data = json.load(f)
            date_map.update(data)

    if args.map:
        for m in args.map:
            if "=" in m:
                old, new = m.split("=", 1)
                date_map[old] = new
            else:
                print(f"WARNING: Invalid --map format (use 'old=new'): {m}")

    return date_map


def main():
    parser = argparse.ArgumentParser(
        description="Replace dates in PDF files while preserving font and layout.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s input.pdf output.pdf --dates mapping.json
  %(prog)s input.pdf output.pdf --map "2021年03月01日=2020年7月1日" --map "2025年09月20日=2026年07月01日"
  %(prog)s input.pdf output.pdf --dates mapping.json --dry-run
        """,
    )
    parser.add_argument("input", help="Input PDF file path")
    parser.add_argument("output", help="Output PDF file path")
    parser.add_argument("--dates", help="JSON file with old→new date mappings")
    parser.add_argument("--map", action="append", help="Single mapping: 'old=new' (repeatable)")
    parser.add_argument("--font", help="Path to CJK font file (default: auto-detect)")
    parser.add_argument("--dry-run", action="store_true", help="Search only, don't modify")
    parser.add_argument("--no-verify", action="store_true", help="Skip output verification")

    args = parser.parse_args()

    date_map = parse_date_map_from_args(args)
    if not date_map:
        print("ERROR: No date mappings provided. Use --dates or --map.")
        sys.exit(1)

    print("Date mappings:")
    for old, new in date_map.items():
        print(f"  {old}  →  {new}")

    success = replace_dates_in_pdf(
        input_path=args.input,
        output_path=args.output,
        date_map=date_map,
        font_path=args.font,
        dry_run=args.dry_run,
    )

    if success and not args.dry_run and not args.no_verify:
        verify_output(args.output, date_map)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

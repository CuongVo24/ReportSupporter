# FLOW — Smart Import Review

1. Pick/drop Markdown, DOCX, PDF, XLSX or PPTX; conversion stays local.
2. Review source/result columns, OCR confidence and guessed headings.
3. Resolve ambiguous assets explicitly; exact normalized relative path wins and unique basename is only a fallback.
4. Persist review decisions in `ImportDraft`; choose append or replace.
5. Take a snapshot, commit the complete transaction, then show Undo restoring project/assets/evidence.

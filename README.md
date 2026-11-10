# GST Reconciliation Tool

A browser-based GST invoice reconciliation utility for comparing **Books** and **Portal** Excel/CSV files.

## Features

- Upload Books and Portal Excel/CSV files.
- Auto-detect Party, Invoice No., Invoice Date and Taxable Value columns.
- Normalize party names and invoice numbers.
- One-to-one invoice matching.
- Configurable taxable-value tolerance (default ₹2).
- Separate:
  - Matched
  - Books - Not in Portal
  - Portal - Not in Books
- Shows Books vs Portal taxable-value totals and difference.
- Exports an Excel workbook with exactly three sheets:
  1. Books
  2. Portal
  3. Reconciliation
- Processing is performed in the browser; files are not sent to a server.

## GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md`.
3. Open **Settings → Pages**.
4. Select **Deploy from a branch**.
5. Select `main` and `/ (root)`.
6. Save.

The application will then be available through your GitHub Pages URL.

## Matching logic

A Books row is matched to one unused Portal row when:

- normalized Party Name is the same;
- if both invoice numbers are available, normalized invoice number is the same;
- taxable value difference is within the configured tolerance.

Matching is one-to-one: a Portal invoice cannot be matched to multiple Books invoices.

## Important

This is a reconciliation aid, not a substitute for review. Before filing GST returns or responding to a notice, verify exceptions manually and retain the underlying source files.

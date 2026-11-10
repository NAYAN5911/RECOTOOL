What it does
- Upload Books Excel + Portal Excel
- Auto-detects:
  - Party Name
  - Invoice No.
  - Invoice Date
  - Taxable Value
- Normalizes party/invoice names
- Performs one-to-one matching
- Allows taxable-value tolerance, default ₹2
- Separates:
  - ✅ Matched
  - ❌ Books – Not in Portal
  - ⚠️ Portal – Not in Books
- Calculates Books vs Portal taxable totals and difference
- Exports exactly 3 Excel sheets:
  - Books
  - Portal
  - Reconciliation
- Runs completely in the browser; the Excel files aren't uploaded to a server.
GitHub-ready project
gst-reconciliation-tool-github.zip

Project structure:
gst-reconciliation-tool/
├── index.html
├── styles.css
├── app.js
├── README.md
└── .gitignore

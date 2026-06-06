# 📦 Shiprocket Invoice Entry Form

A self-contained vendor bill entry system for **Shiprocket Limited** — built as a single HTML file with Google Sheets & Drive integration, AI auto-extract, bulk import, approval workflow, and a live Data Manager.

---

## 🚀 Live Demo (GitHub Pages)

After deploying, your form will be available at:
```
https://<your-username>.github.io/<your-repo-name>/
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 4-step wizard | Vendor → Invoice → Tax & Values → Review & Submit |
| AI auto-extract | Upload invoice PDF/image → Claude reads and fills all fields |
| 2,900+ vendors | Searchable dropdown with PAN auto-fill |
| GST validation | 18 approved Shiprocket GSTINs across 12 states |
| Google Sheets sync | Submits 33 columns to your Sheet + Drive attachments |
| Bulk import | Upload `.xlsx` / `.csv` to submit multiple bills at once |
| Approval workflow | Auto-emails approver based on Grand Total (Director / AVP / HOD) |
| Data Manager | Add new vendors, BUs, departments, locations, GL codes via Excel — add-only, no deletions |

---

## 📁 Repository Structure

```
├── index.html          ← The complete form (self-contained, single file)
├── Code.gs             ← Google Apps Script backend (Sheets + Drive + Email)
├── Deployment_Guide.html ← Step-by-step setup instructions
└── README.md
```

---

## 🛠️ Setup in 3 Steps

### Step 1 — Deploy to GitHub Pages

1. Create a new GitHub repository (public)
2. Upload `index.html`, `Code.gs`, `Deployment_Guide.html`, `README.md`
3. Go to **Settings → Pages → Source: main branch / root**
4. Your form is live at `https://<username>.github.io/<repo>/`

### Step 2 — Set Up Google Apps Script

1. Go to [script.google.com](https://script.google.com) → **New Project**
2. Paste the contents of `Code.gs`
3. Run `setupSheetAndFolder()` once (creates Sheet + Drive folder)
4. **Deploy → New Deployment → Web App**
   - Execute as: **Me**
   - Access: **Anyone**
5. Copy the deployment URL

### Step 3 — Connect the Form

Open `index.html`, find this line (~line 30):
```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```
Replace with your actual Apps Script URL, re-upload to GitHub.

---

## 📊 Google Sheet Columns (33 total)

| # | Column |
|---|---|
| 1 | Timestamp |
| 2 | Submission ID |
| 3 | Vendor Name |
| 4 | Vendor Code |
| 5 | Vendor PAN |
| 6 | Vendor State |
| 7 | Vendor GSTIN |
| 8 | Invoice Number |
| 9 | Invoice Date |
| 10 | IRN Number |
| 11 | RCM Applicable |
| 12 | Product/Service (GL Code) |
| 13 | Product/Service (Label) |
| 14 | HSN/SAC Code |
| 15 | Legal Name |
| 16 | Customer GSTIN |
| 17 | Place of Supply |
| 18 | Customer State Code |
| 19 | Business Unit |
| 20 | Department |
| 21 | Location |
| 22 | Taxable Value (₹) |
| 23 | Others (₹) |
| 24 | Tax Type |
| 25 | Tax Amount (₹) |
| 26 | TDS Section |
| 27 | TDS Section Label |
| 28 | TDS Rate (%) |
| 29 | TDS Value (₹) |
| 30 | Grand Total (₹) |
| 31 | Amount in Words |
| 32 | Attachments (Drive Links) |
| 33 | GST Validation Status |

---

## 💰 Approval Workflow

| Grand Total | Approver Level | Badge |
|---|---|---|
| Below ₹5 Lakh | Director | 🟢 |
| ₹5L – ₹20L | AVP | 🟡 |
| Above ₹20L | Head of Department | 🔴 |

Approval email sent via **Gmail (GmailApp)** through Apps Script, with **mailto fallback** if not configured.

---

## ⚙️ Data Manager

Click **⚙️ Data Manager** (top of page) to:
- View current counts of all master lists
- Import new Vendors, Business Units, Departments, Locations, GL Codes via Excel
- All updates are **add-only** — no existing data can be deleted
- Download a 5-sheet template for bulk updates

---

## 📥 Bulk Invoice Import

Click **📥 Bulk Import Bills** to upload an Excel/CSV with multiple invoices:
- Supports `.xlsx`, `.xls`, `.csv`
- Reads 40+ column name variations intelligently
- Preview table with validation before submitting
- Submits all valid rows to Google Sheets in one go

Download the import template from within the form.

---

## 🔐 Security Notes

- The form is **client-side only** — no server, no database
- All data goes directly to **your** Google Sheet and Drive
- Anthropic API key for AI auto-extract is passed per-request (no storage)
- No login required — distribute the GitHub Pages URL to your team

---

## 📋 Requirements

- Modern browser (Chrome, Edge, Firefox, Safari)
- Google account (for Sheets + Drive integration)
- Anthropic API key (optional — for AI invoice auto-extract)

---

## 🏢 About

Built for **Shiprocket Limited** Finance team — vendor bill entry, GST validation, and approval routing.

Version: **v35**

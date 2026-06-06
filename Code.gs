// ============================================================
//  SHIPROCKET — Tax Invoice Entry  |  Google Apps Script v2
//  Paste this entire file into your Apps Script project.
//  One-time setup: run  setupSheetAndFolder()  first.
// ============================================================

// ── CONFIG ───────────────────────────────────────────────────
var SHEET_NAME  = 'Invoice Submissions';
var FOLDER_NAME = 'Shiprocket Invoice Attachments';
// ─────────────────────────────────────────────────────────────

var HEADERS = [
  'Timestamp',
  'Submission ID',
  'Vendor Name',
  'Vendor Code',
  'Vendor PAN',
  'Vendor State',
  'Vendor GSTIN',
  'Invoice Number',
  'Invoice Date',
  'IRN Number',
  'RCM Applicable',
  'Product / Service (GL Code)',
  'Product / Service (Label)',
  'HSN / SAC Code',
  'Legal Name',
  'Customer GSTIN',
  'Place of Supply',
  'Customer State Code',
  'Business Unit',
  'Department',
  'Location',
  'Taxable Value (₹)',
  'Others (₹)',
  'Tax Type',
  'Tax Amount (₹)',
  'TDS Section',
  'TDS Section Label',
  'TDS Rate (%)',
  'TDS Value (₹)',
  'Grand Total (₹)',
  'Amount in Words',
  'Attachments (Drive Links)',
  'GST Validation Status',
];

// ── SETUP: run once ──────────────────────────────────────────
function setupSheetAndFolder() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
         .setBackground('#0f1c3f')
         .setFontColor('#ffffff')
         .setFontWeight('bold')
         .setFontSize(11);
    sheet.setFrozenRows(1);
    var widths = [160,160,220,120,120,180,200,180,110,300,80,130,280,120,220,200,160,120,180,180,200,140,100,140,140,110,280,80,120,140,260,360,140];
    for (var i = 0; i < widths.length && i < HEADERS.length; i++) {
      sheet.setColumnWidth(i + 1, widths[i]);
    }
  }

  var folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (!folders.hasNext()) DriveApp.createFolder(FOLDER_NAME);

  Logger.log('Setup complete! URL: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl());
}

// ── doPost ───────────────────────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // ── Handle approval email action ─────────────────────────────────────
    if (data._action === 'sendApprovalEmail') {
      try {
        var htmlBody = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">'
          + '<div style="background:#0f1c3f;padding:20px 24px;border-radius:10px 10px 0 0">'
          + '<h2 style="color:#fff;margin:0;font-size:18px">✉️ Invoice Approval Required</h2>'
          + '<p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Shiprocket Invoice Entry System</p>'
          + '</div>'
          + '<div style="background:#f8faff;border:1px solid #d1daf5;border-top:none;border-radius:0 0 10px 10px;padding:24px">'
          + (data.approverName ? '<p style="font-size:14px;color:#374151">Dear <strong>' + data.approverName + '</strong>,</p>' : '<p style="font-size:14px;color:#374151">Dear Approver,</p>')
          + '<p style="font-size:14px;color:#374151">An invoice has been submitted and requires your approval.</p>'
          + '<div style="background:#fff;border:1.5px solid #c7d2fe;border-radius:10px;padding:18px;margin:16px 0">'
          + '<table style="width:100%;font-size:13px;border-collapse:collapse">'
          + '<tr><td style="padding:6px 0;color:#6b7280;font-weight:600;width:160px">Invoice No.</td><td style="color:#111827;font-weight:700">' + (data.invNo||'—') + '</td></tr>'
          + '<tr><td style="padding:6px 0;color:#6b7280;font-weight:600">Department</td><td>' + (data.department||'—') + '</td></tr>'
          + '<tr><td style="padding:6px 0;color:#6b7280;font-weight:600">Grand Total</td><td style="font-size:18px;font-weight:800;color:#1a3a8f">₹' + parseFloat(data.grand||0).toLocaleString('en-IN',{minimumFractionDigits:2}) + '</td></tr>'
          + '<tr><td style="padding:6px 0;color:#6b7280;font-weight:600">Approval Level</td><td><span style="background:#ede9fe;color:#6d28d9;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700">' + (data.level||'—') + '</span></td></tr>'
          + '<tr><td style="padding:6px 0;color:#6b7280;font-weight:600">Submission ID</td><td style="font-family:monospace">' + (data.submissionId||'—') + '</td></tr>'
          + '</table></div>'
          + '<pre style="background:#f1f5f9;padding:14px;border-radius:8px;font-size:12px;white-space:pre-wrap;color:#374151">' + data.body + '</pre>'
          + '<p style="font-size:12px;color:#9ca3af;margin-top:16px">This is an automated email from Shiprocket Invoice Entry System.</p>'
          + '</div></div>';

        GmailApp.sendEmail(
          data.to,
          data.subject,
          data.body,
          {
            htmlBody: htmlBody,
            name: 'Shiprocket Finance',
            replyTo: Session.getActiveUser().getEmail(),
          }
        );
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'success', message: 'Approval email sent to ' + data.to }))
          .setMimeType(ContentService.MimeType.JSON);
      } catch(mailErr) {
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'error', message: 'Email failed: ' + mailErr.toString() }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    // ────────────────────────────────────────────────────────────────────

    // Save attachments to Drive
    var driveLinks = [];
    if (data.attachments && data.attachments.length > 0) {
      var rootFolder = getDriveFolder();
      var subName = (data.invNo || 'UNKNOWN').replace(/[^a-zA-Z0-9_\-]/g,'_')
                  + '__' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd_HHmmss');
      var subFolder = rootFolder.createFolder(subName);
      subFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      data.attachments.forEach(function(att) {
        if (att.data && att.name) {
          var blob = Utilities.newBlob(Utilities.base64Decode(att.data), att.mimeType || 'application/octet-stream', att.name);
          var file = subFolder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          driveLinks.push(att.name + ': ' + file.getUrl());
        }
      });
    }

    // GST Validation
    var validGSTINs = [
      '06AAECB7131Q1ZE','06AAECB7131Q2ZD','06AAECB7131Q1CP',
      '07AAECB7131Q1ZC','07AAECB7131Q1CN','08AAECB7131Q1ZA',
      '09AAECB7131Q1Z8','18AAECB7131Q1Z9','18AAECB7131Q1CK',
      '19AAECB7131Q1Z7','20AAECB7131Q1ZO','24AAECB7131Q1ZG',
      '24AAECB7131Q1CR','27AAECB7131Q1CL','27AAECB7131Q1ZA',
      '29AAECB7131Q1Z6','33AAECB7131Q1ZH','36AAECB7131Q1ZB'
    ];
    var gstOk = validGSTINs.indexOf(data.gstin) !== -1
             && (data.legalName || '').toUpperCase() === 'SHIPROCKET LIMITED';

    var submissionId = 'INV-' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMddHHmmss')
                     + '-' + Math.floor(Math.random() * 1000);

    var row = [
      new Date(),
      submissionId,
      data.vendorName      || '',
      data.vendorCode      || '',
      data.vendorPAN       || '',
      data.vendorState     || '',
      data.vendorGSTIN     || '',
      data.invNo           || '',
      data.invDate         || '',
      data.irnNo           || '',
      data.rcm             || '',
      data.product         || '',
      data.productLabel    || '',
      data.hsn             || '',
      data.legalName       || '',
      data.gstin           || '',
      data.pos             || '',
      data.stateCode       || '',
      data.businessUnit    || '',
      data.department      || '',
      data.location        || '',
      data.taxable         || 0,
      data.others          || 0,
      data.taxLabel        || '',
      data.tax             || 0,
      data.tdsSection      || '',
      data.tdsSectionLabel || '',
      data.tdsRate         || 0,
      data.tdsValue        || 0,
      data.grand           || 0,
      data.amountWords     || '',
      driveLinks.length ? driveLinks.join('\n') : (data.attachmentNames ? data.attachmentNames.join(', ') : '—'),
      gstOk ? 'PASS ✅' : 'REVIEW ⚠️',
    ];

    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    sheet.appendRow(row);
    var lastRow = sheet.getLastRow();

    // Format currency columns
    var currFmt = '₹#,##0.00';
    ['Taxable Value (₹)','Others (₹)','Tax Amount (₹)','TDS Value (₹)','Grand Total (₹)'].forEach(function(h) {
      var col = HEADERS.indexOf(h) + 1;
      if (col > 0) sheet.getRange(lastRow, col).setNumberFormat(currFmt);
    });
    var tdrCol = HEADERS.indexOf('TDS Rate (%)') + 1;
    if (tdrCol > 0) sheet.getRange(lastRow, tdrCol).setNumberFormat('0.000"%"');

    // Colour validation cell
    var cell = sheet.getRange(lastRow, HEADERS.length);
    gstOk ? cell.setBackground('#dcfce7').setFontColor('#15803d').setFontWeight('bold')
          : cell.setBackground('#fef9c3').setFontColor('#92400e').setFontWeight('bold');

    // Colour drive links cell
    if (driveLinks.length > 0) {
      var dlCol = HEADERS.indexOf('Attachments (Drive Links)') + 1;
      if (dlCol > 0) sheet.getRange(lastRow, dlCol).setBackground('#eff6ff').setFontColor('#1d4ed8').setWrap(true);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status:'success', id:submissionId, sheetRow:lastRow, driveLinks:driveLinks }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    Logger.log('doPost error: ' + err);
    return ContentService
      .createTextOutput(JSON.stringify({ status:'error', message:err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status:'ok', message:'Shiprocket Invoice Script is live.', version:'2.0' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getDriveFolder() {
  var f = DriveApp.getFoldersByName(FOLDER_NAME);
  return f.hasNext() ? f.next() : DriveApp.createFolder(FOLDER_NAME);
}

// Run this once to authorize Gmail scope
function authorizeGmail() {
  GmailApp.getInboxThreads(0, 1);
  Logger.log('Gmail authorized for: ' + Session.getActiveUser().getEmail());
}

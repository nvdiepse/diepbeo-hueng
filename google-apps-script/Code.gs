/**
 * RSVP → Google Sheet
 *
 * BẮT BUỘC:
 * 1. Dán Spreadsheet ID vào SPREADSHEET_ID bên dưới
 * 2. Save
 * 3. Deploy → Manage deployments → ✏️ → New version → Deploy
 * 4. Mở /exec ẩn danh phải thấy "version":"v4"
 *
 * ID lấy từ:
 * https://docs.google.com/spreadsheets/d/<<<ID>>>/edit
 */

var SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_HERE'; // ← ĐIỀN ID THẬT
var SHEET_NAME = 'RSVP';

function normalizeId_(raw) {
  var s = String(raw || '').trim();
  var m = s.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : s;
}

function getSpreadsheet_() {
  var id = normalizeId_(SPREADSHEET_ID);
  if (!id || id.indexOf('PASTE_') === 0 || id.indexOf('YOUR_') === 0) {
    throw new Error('Chưa điền SPREADSHEET_ID trong Code.gs');
  }
  return SpreadsheetApp.openById(id);
}

function getRsvpSheet_() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Thoi_gian',
      'Ho_ten',
      'Xac_nhan',
      'So_nguoi',
      'Ngay_tham_du',
      'Loi_chuc'
    ]);
  }
  return { ss: ss, sheet: sheet };
}

function parseBody_(e) {
  // 1) form-urlencoded / multipart → e.parameter
  if (e && e.parameter && (e.parameter.name || e.parameter.Ho_ten || e.parameter.xac_nhan)) {
    return {
      name: e.parameter.name || e.parameter.Ho_ten || '',
      xac_nhan: e.parameter.xac_nhan || '',
      so_nguoi: e.parameter.so_nguoi || '',
      ngay_tham_du: e.parameter.ngay_tham_du || '',
      loi_chuc: e.parameter.loi_chuc || '',
      _gotcha: e.parameter._gotcha || ''
    };
  }

  // 2) JSON text/plain body
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      throw new Error('Body không phải JSON hợp lệ: ' + e.postData.contents);
    }
  }

  throw new Error('Không nhận được dữ liệu POST (e.parameter / postData trống)');
}

function doPost(e) {
  // Không bọc try/catch toàn hàm: lỗi sẽ hiện Failed trong Executions (dễ debug)
  var data = parseBody_(e);

  console.log('RSVP payload: ' + JSON.stringify(data));

  if (data._gotcha) {
    console.log('Skip honeypot');
    return jsonResponse({ result: 'success', skipped: true });
  }

  if (!data.name || !String(data.name).trim()) {
    throw new Error('Thiếu họ tên (name)');
  }

  var ref = getRsvpSheet_();
  var now = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm:ss');
  var row = [
    now,
    String(data.name || '').trim(),
    data.xac_nhan || '',
    data.so_nguoi || '',
    data.ngay_tham_du || '',
    data.loi_chuc || ''
  ];

  ref.sheet.appendRow(row);
  SpreadsheetApp.flush();

  console.log('Wrote row to spreadsheet=' + ref.ss.getName() + ' id=' + ref.ss.getId() + ' sheet=' + SHEET_NAME);

  return jsonResponse({
    result: 'success',
    version: 'v4',
    spreadsheet: ref.ss.getName(),
    spreadsheetId: ref.ss.getId(),
    sheet: SHEET_NAME,
    row: row
  });
}

function doGet() {
  try {
    var ref = getRsvpSheet_();
    return jsonResponse({
      result: 'ok',
      version: 'v4',
      spreadsheet: ref.ss.getName(),
      spreadsheetId: ref.ss.getId(),
      sheet: SHEET_NAME,
      lastRow: ref.sheet.getLastRow(),
      message: 'RSVP endpoint sẵn sàng (v4).'
    });
  } catch (err) {
    return jsonResponse({
      result: 'error',
      version: 'v4',
      error: String(err && err.message ? err.message : err)
    });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

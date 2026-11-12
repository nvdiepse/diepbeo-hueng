# RSVP → Google Sheet

## Vì sao vẫn lỗi `getSheetByName`?

URL Web App hiện tại vẫn chạy **code cũ** (doGet trả về message cũ).  
**Save trong Apps Script ≠ cập nhật Web App.** Phải **Deploy → New version**.

## Làm đúng 1 lần

1. Mở Sheet → copy ID trong URL:

   `https://docs.google.com/spreadsheets/d/`**`ID_Ở_ĐÂY`**`/edit`

2. Apps Script → dán `Code.gs` → sửa dòng:

   ```js
   var SPREADSHEET_ID = 'ID_Ở_ĐÂY';
   ```

3. Save → **Deploy → Manage deployments → ✏️**  
   - Version: **New version**  
   - Who has access: **Anyone / Bất kỳ ai**  
   - Deploy

4. Mở URL `/exec` (cửa sổ ẩn danh). Phải thấy:

   ```json
   {"result":"ok","version":"v3-openById","spreadsheet":"..."}
   ```

   Nếu **không** có `"version":"v3-openById"` → chưa Deploy bản mới.

5. Nếu URL `/exec` đổi → cập nhật `action` trong `index.html` → upload S3.

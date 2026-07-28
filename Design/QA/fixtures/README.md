# QA fixtures

Các file nhỏ và golden oracle trong `golden/` được commit và review thủ công. File boundary hoặc adversarial lớn được sinh vào `generated/` bằng:

```powershell
npm run qa:fixtures:generate
npm run qa:fixtures:verify
```

`manifest.json` là inventory chuẩn. Không thay fixture bằng dữ liệu cá nhân hoặc tự cập nhật golden expected result từ output implementation trong cùng thay đổi.

import Link from "next/link";

export default function OfflinePage() {
  return <main style={{ maxWidth: 640, margin: "12vh auto", padding: 24 }}>
    <h1>ReportSupporter đang ngoại tuyến</h1>
    <p>Bạn vẫn có thể quay lại Thư viện dự án và mở dữ liệu đã lưu trong IndexedDB. AI và tạo PDF chỉ hoạt động khi có mạng.</p>
    <Link href="/">Mở Thư viện dự án</Link>
  </main>;
}

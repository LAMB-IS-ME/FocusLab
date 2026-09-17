# StudyFlow 🌱

**Không gian học tập của bạn — từng việc nhỏ, từng bước tiến.**

StudyFlow là ứng dụng quản lý học tập dành cho sinh viên Việt Nam, được phát triển trong repository **FocusLab**. Toàn bộ ứng dụng chạy trong trình duyệt, không có máy chủ, tài khoản hay khóa API. Giao diện, dữ liệu mẫu và thông báo đều bằng tiếng Việt.

## Có gì trong ứng dụng?

- **Tổng quan:** công việc hôm nay, chuỗi ngày học, biểu đồ theo tuần, mục tiêu và lịch sắp tới.
- **Công việc:** bảng Kanban, tạo/sửa/xóa, ưu tiên, hạn nộp, tìm kiếm, lọc theo môn và thời gian. Kéo thả trên máy tính hoặc dùng ô trạng thái bằng bàn phím/cảm ứng.
- **Tập trung:** Pomodoro 25/5/15 phút, tạm dừng, tiếp tục, đặt lại, bỏ qua, chọn môn/công việc; nghỉ dài sau bốn phiên. Lịch sử và thời gian theo môn cập nhật tự động.
- **Lịch:** chuyển tháng, chọn ngày, xem hạn công việc, tạo/sửa/xóa lịch học. Dùng phím mũi tên để chuyển ngày.
- **Môn học:** tùy chỉnh màu/biểu tượng, theo dõi tiến độ và xem lịch sử từng môn. Xóa môn vẫn giữ lại các công việc và phiên học.
- **Ghi chú:** văn bản thuần, tự lưu, tìm kiếm, ghim và xóa có xác nhận.
- **Cài đặt:** giao diện sáng/tối/theo hệ thống, thời gian Pomodoro, mục tiêu tuần, xuất bản sao JSON và đặt lại dữ liệu.
- **Thao tác nhanh:** `Ctrl + K` hoặc `Cmd + K`, phím mũi tên để chọn, `Enter` để mở, `Escape` để đóng.

Thanh bên có thể thu gọn; điện thoại dùng thanh điều hướng phía dưới và menu riêng. Ứng dụng hỗ trợ bàn phím, hộp thoại giữ tiêu điểm và tùy chọn giảm chuyển động của hệ điều hành.

## Công nghệ

React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion, Recharts, Lucide React. Zod kiểm tra cấu trúc dữ liệu đã lưu. Phông Be Vietnam Pro được đóng gói cùng ứng dụng, không phụ thuộc dịch vụ phông bên ngoài. Vitest kiểm tra logic, Playwright kiểm thử trình duyệt.

## Cài đặt và chạy

Cần **Node.js 22.12 trở lên** và npm. Nên dùng Node.js 22 LTS.

```bash
git clone https://github.com/LAMB-IS-ME/FocusLab.git
cd FocusLab
npm ci
npm run dev
```

Mở địa chỉ Vite in trong terminal, thường là `http://localhost:5173`.

```bash
npm run check       # Kiểm tra TypeScript
npm run format:check # Kiểm tra định dạng mã nguồn
npm test            # Kiểm tra dữ liệu, đồng hồ và ngày
npm run build       # Kiểm tra TypeScript và tạo thư mục dist/
npm run preview     # Xem bản đã build tại http://localhost:4173
```

Kiểm thử trình duyệt:

```bash
npx playwright install chromium
npm run test:e2e
```

Trên Linux nếu thiếu thư viện hệ thống, chạy `npx playwright install --with-deps chromium`. Bộ kiểm thử tự build và mở máy chủ xem trước; kiểm tra CRUD, dữ liệu sau tải lại, Pomodoro, thao tác nhanh, giao diện tối, xác nhận xóa, dữ liệu hỏng và kích thước 320–1440 px.

Ngoài ra, bộ kiểm thử kiểm tra độ tương phản và nhãn truy cập ở cả hai giao diện, đồng bộ giữa hai thẻ, kéo thả Kanban và tài nguyên khi triển khai dưới `/studyflow/` hoặc `/FocusLab/`.

## Triển khai GitHub Pages

Workflow có sẵn trong [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Đưa toàn bộ mã nguồn và `package-lock.json` lên nhánh `main`.
2. Trong repository GitHub, mở **Settings → Pages → Build and deployment → Source**, chọn **GitHub Actions**.
3. Mở **Actions → Triển khai StudyFlow → Run workflow**, chọn `main` và chạy. Các lần đẩy mã lên `main` sau đó tự chạy lại.
4. Workflow cài thư viện, kiểm thử, build và xuất bản. Đường dẫn trang được hiển thị trong bước triển khai.

Với repo hiện tại, địa chỉ dự kiến là **https://lamb-is-me.github.io/FocusLab/**. Nếu đổi tên repo thành `studyflow`, ứng dụng chạy tại **https://<tên-người-dùng>.github.io/studyflow/**.

`vite.config.ts` dùng `base: './'`, nên tài nguyên dùng đường dẫn tương đối, hỗ trợ cả hai tên repo và tên miền riêng. Điều hướng dùng phần `#` của URL (ví dụ `/#tasks`) nên tải lại trang không gây lỗi 404 trên GitHub Pages. Với tên miền riêng, cấu hình tên miền trong GitHub Pages và thêm `public/CNAME` chứa tên miền nếu cần. Không cần sửa mã điều hướng.

Có thể triển khai thư mục `dist/` lên bất kỳ dịch vụ lưu trữ trang tĩnh nào. Tham khảo [hướng dẫn triển khai của Vite](https://vite.dev/guide/static-deploy).

## Cấu trúc chính

```text
src/
├── components/       # Bố cục, hộp thoại, biểu đồ, đồng hồ và biểu mẫu dùng chung
├── data/demo.ts      # Dữ liệu mẫu theo ngày hiện tại và trạng thái trống
├── hooks/            # Trạng thái dùng chung, thống kê và cơ chế lưu
├── lib/              # Kiểm tra dữ liệu, lưu trữ và logic chuyển phiên
├── pages/            # Bảy màn hình chính, tải riêng khi cần
├── types/            # Kiểu dữ liệu ứng dụng
├── utils/            # Ngày địa phương, định dạng tiếng Việt, mã định danh
├── App.tsx           # Điều hướng, thao tác nhanh, xử lý lỗi giao diện
├── main.tsx          # Khởi động React, phông chữ
└── styles.css        # Hệ màu, thành phần và bố cục thích ứng
tests/                # Kiểm thử trình duyệt
public/               # Biểu tượng ứng dụng
.github/workflows/    # Quy trình kiểm tra và triển khai
```

## Dữ liệu được lưu như thế nào?

- Khóa chính: **`studyflow:data:v1`** trong `localStorage`. Một tài liệu JSON có phiên bản chứa công việc, môn học, sự kiện, ghi chú, phiên tập trung, cài đặt và đồng hồ.
- `src/lib/storage.ts` là lớp lưu trữ duy nhất; Zod kiểm tra dữ liệu trước khi khôi phục. React Context quản lý trạng thái và lưu khi thay đổi. Thẻ trình duyệt khác cùng nguồn được đồng bộ bằng sự kiện `storage`; khi sửa đồng thời, thay đổi được ghi sau cùng có hiệu lực.
- Dữ liệu mẫu chỉ được tạo khi khóa chưa tồn tại. Danh sách trống đã lưu vẫn được giữ trống sau tải lại. Đặt lại ứng dụng tạo không gian trống, không nạp lại dữ liệu mẫu.
- JSON hỏng hoặc cấu trúc sai được xử lý bằng không gian trống và thông báo; ứng dụng cố giữ bản gốc trong khóa `studyflow:data:v1:recovery:<thời-gian>`. Nếu bộ nhớ bị chặn hoặc đầy, ứng dụng thông báo và vẫn cho dùng trong phiên hiện tại.
- Đồng hồ lưu **mốc kết thúc tuyệt đối**, nên chuyển trang, tải lại hoặc đưa thẻ xuống nền không làm bộ đếm chạy chậm dần. Khi mở lại, phiên đã hết giờ được ghi đúng một lần theo mã phiên. Giờ hoàn thành dùng mốc kết thúc gốc.
- Nghỉ và các phiên bị bỏ qua/đặt lại không được tính thành thời gian học. Phiên tiếp theo chờ bạn bắt đầu, không tự chạy liên tục khi bạn rời máy. Môn/công việc được cố định sau khi bắt đầu phiên; đặt lại để đổi lựa chọn.
- Tuần tính từ thứ Hai đến Chủ nhật theo giờ địa phương. Chuỗi ngày học cho phép hôm nay chưa có phiên nếu hôm qua vẫn học.

Dữ liệu chỉ ở **trình duyệt và thiết bị hiện tại**, không tự đồng bộ giữa các thiết bị. Xóa dữ liệu trang hoặc đổi tên miền sẽ không mang theo dữ liệu cũ. Có thể xuất JSON trong Cài đặt để giữ bản sao; phiên bản hiện tại chưa có giao diện nhập lại. Ghi chú hỗ trợ văn bản thuần và được lưu ngay khi thay đổi.

## Phạm vi triển khai

Không có dịch vụ mạng ở thời gian chạy, hình ảnh bên ngoài hoặc khóa bí mật. Dữ liệu ví dụ hoàn toàn hư cấu. Ứng dụng chạy từ bản build tĩnh; cần tải tài nguyên lần đầu, chưa có chế độ cài đặt ngoại tuyến bằng service worker.

Mã nguồn sử dụng giấy phép trong [LICENSE](LICENSE).

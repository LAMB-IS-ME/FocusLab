# FocusLab 🌱

**Không gian học tập của bạn — từng việc nhỏ, từng bước tiến.**

FocusLab giúp quản lý công việc, môn học, lịch học, ghi chú và Pomodoro bằng giao diện tiếng Việt. Frontend React/TypeScript chạy trên GitHub Pages; Supabase quản lý tài khoản và lưu dữ liệu PostgreSQL riêng cho từng người. Không cần chạy backend trên máy cá nhân.

## Tính năng

- Tổng quan, biểu đồ tuần, chuỗi ngày học, thời gian theo môn và mục tiêu tuần từ dữ liệu tài khoản.
- Công việc Kanban, kéo thả, tìm kiếm, lọc, ưu tiên, hạn nộp và trạng thái hoàn thành.
- Môn học có màu/biểu tượng; xóa môn vẫn giữ công việc và lịch sử ở nhóm chưa phân môn.
- Lịch học tương tác; ghi chú văn bản thuần tự lưu, tìm kiếm và ghim.
- Pomodoro tùy chỉnh, tạm dừng, tiếp tục, nghỉ dài sau bốn phiên. Chỉ phiên tập trung hoàn thành được tính vào thống kê.
- Giao diện sáng/tối/theo hệ thống, mục tiêu tuần, thanh bên thu gọn và giao diện mobile.
- Đăng ký, đăng nhập email/mật khẩu, giữ phiên và đăng xuất.
- Nhập dữ liệu trình duyệt cũ hoặc bản sao JSON; xuất JSON; tạo dữ liệu mẫu theo lựa chọn; đặt lại dữ liệu có xác nhận.
- Thao tác nhanh bằng `Ctrl + K` / `Cmd + K`, hỗ trợ bàn phím và giảm chuyển động.

## Kiến trúc và Supabase

React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide và Zod. Font Be Vietnam Pro được đóng gói cùng ứng dụng.

```text
src/components/                 Giao diện dùng chung và nhập dữ liệu
src/pages/                      Auth và bảy trang học tập hiện có
src/hooks/useAuth.tsx            Theo dõi session Supabase Auth
src/hooks/useApp.tsx             Điều hướng hash, thao tác UI và đồng hồ
src/hooks/useCloudData.ts        Tải, hàng chờ lưu, bản nháp, retry và làm mới
src/services/auth.ts            Đăng ký / đăng nhập / đăng xuất
src/services/workspace.ts       API database qua Supabase JS RPC
src/services/workspaceChanges.ts So sánh hàng thay đổi và ghép bản nháp
src/services/importData.ts      Nhập dữ liệu không ghi đè
src/lib/supabase.ts              Client dùng biến môi trường công khai
src/lib/storage.ts               Kiểm tra Zod, chỉ đọc dữ liệu trình duyệt cũ
src/types/database.ts            Hợp đồng TypeScript cho RPC
supabase/migrations/             Schema, RLS, trigger và các hàm PostgreSQL
src/lib/database.test.ts         Kiểm thử migration và RLS trên PostgreSQL nhúng
tests/                         Kiểm thử trình duyệt với API mô phỏng
```

UI giữ React Context hiện có. Service chỉ gửi những hàng đã thay đổi, không ghi lại toàn bộ database. RPC `apply_workspace_changes` ghi các thay đổi liên quan trong một transaction; lỗi một hàng sẽ rollback toàn bộ. RPC trả snapshot sau khi lưu để ghép các lần sửa mới xảy ra trong lúc request đang chạy; retry giữ nguyên payload của lần gửi chưa nhận được phản hồi. Không có Express, Firebase hoặc backend tự host.

`get_workspace` đọc snapshot nhất quán; Zod kiểm tra cấu trúc trước khi hiển thị. Đây là thiết kế cho dữ liệu cá nhân có dung lượng nhỏ; khi lịch sử tăng lớn cần phân trang và tổng hợp thống kê phía database.

## Database schema

Chạy **toàn bộ** [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql) **một lần** trong **Supabase → SQL Editor → New query → Run** trên project mới. Không cần tự tạo bảng. Migration có transaction; không chạy lại migration đã áp dụng thành công.

Nếu đã chạy bản `001` ở phiên tích hợp trước, chỉ chạy [002_sync_snapshot.sql](supabase/migrations/002_sync_snapshot.sql) để nâng cấp RPC lưu dữ liệu sang trả snapshot, bảo vệ nhập trùng ID và retry sau mất phản hồi. File `002` không xóa bảng/dữ liệu, dùng được cả sau bản `001` hiện tại. Khi dùng migration runner, áp dụng các file theo thứ tự `001` rồi `002`.

| Bảng              | Nội dung                                                                       |
| ----------------- | ------------------------------------------------------------------------------ |
| `profiles`        | `user_id`, tên hiển thị, thời điểm tạo/cập nhật                                |
| `subjects`        | Môn học, màu, biểu tượng                                                       |
| `tasks`           | Công việc, mô tả, môn, ưu tiên, hạn, trạng thái và ngày hoàn thành             |
| `notes`           | Tiêu đề, nội dung, ghim, thời điểm cập nhật                                    |
| `calendar_events` | Sự kiện, môn, ngày, giờ bắt đầu và thời lượng phút                             |
| `focus_sessions`  | Môn, công việc, thời lượng phút và thời điểm hoàn thành                        |
| `user_settings`   | Theme, thời gian tập trung/nghỉ, mục tiêu giờ mỗi tuần và trạng thái thanh bên |

Mọi bảng có `user_id` liên kết `auth.users`. Các entity dùng khóa chính ghép `(user_id, id)` với `id` dạng text để giữ mã dữ liệu cũ. Khóa ngoại ghép ngăn liên kết dữ liệu của tài khoản khác. Xóa user trong Supabase Auth sẽ cascade dữ liệu của user đó. Xóa môn/công việc chỉ bỏ liên kết tương ứng trong lịch sử.

RLS bật trên **cả bảy bảng**, có policy SELECT/INSERT/UPDATE/DELETE riêng theo `auth.uid() = user_id`. `WITH CHECK` ngăn đổi chủ sở hữu. Vai trò `anon` không được truy cập bảng hoặc RPC. RPC dùng `security invoker`; lấy chủ sở hữu từ session, không nhận `user_id` từ biểu mẫu. Tham số `expected_user_id` chỉ chặn request còn chờ của tài khoản cũ.

Trigger tạo profile và settings mặc định khi đăng ký; không seed công việc hay ghi chú. Hàm trigger dùng `security definer` với `search_path` rỗng và không cho client gọi trực tiếp. Migration cũng tạo profile/settings cho user đã tồn tại.

## Thiết lập Supabase và auth

1. Tạo project Supabase, lưu mật khẩu database ở nơi riêng. Chạy migration ở trên.
2. Trong **Authentication → Sign In / Providers**, bật **Email**, cho phép đăng ký và bật **Confirm email**. Nên đặt độ dài mật khẩu tối thiểu 8 ký tự để khớp form đăng ký.
3. Trong **Authentication → URL Configuration**, đặt:

   **Site URL**:

   ```text
   https://husterlaydrl.id.vn/
   ```

   **Redirect URLs** (mỗi URL một mục):

   ```text
   https://husterlaydrl.id.vn/
   https://lamb-is-me.github.io/FocusLab/
   http://localhost:5173/
   http://localhost:4173/
   ```

   Nếu mở local qua `127.0.0.1`, thêm `http://127.0.0.1:5173/` và `http://127.0.0.1:4173/`. Giữ dấu `/` cuối và đúng chữ hoa `FocusLab`. URL xác nhận không chứa `#tasks`; hash được Supabase dùng khi nhận session.

4. Giữ link xác nhận mặc định trong email template. Với người dùng thực tế, cấu hình SMTP của bạn trong Supabase Auth và kiểm tra giới hạn gửi email của project.
5. Lấy **Project URL** và khóa **publishable** hoặc **legacy anon** trong phần **Connect / Project Settings → API Keys**. Không dùng database password, secret key hay `service_role`.

Người dùng đăng ký rồi mở email xác nhận. Nếu Supabase trả session ngay, app mở workspace; nếu cần xác nhận email, form thông báo kiểm tra hộp thư. `onAuthStateChange` điều khiển app, SDK khôi phục/làm mới session sau reload. Thay tài khoản sẽ tháo state cũ trước khi tải dữ liệu mới. Đăng xuất chờ hàng chờ lưu hoàn tất; nếu lưu lỗi cần retry trước để tránh bỏ mất thay đổi.

## Local development và environment variables

Cần **Node.js >= 22.12.0** và npm.

```bash
npm ci
cp .env.example .env
```

Điền vào `.env` trên máy bạn:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-key-hoặc-anon-key>
```

```bash
npm run dev
```

Mở `http://localhost:5173/`. Vite đọc `.env` tại thư mục gốc; restart dev server sau khi thay biến. Đây là biến **build-time**: sửa trên GitHub rồi cần chạy workflow build lại. Khi thiếu/sai cấu hình, app hiện hướng dẫn bằng tiếng Việt, không mở workspace giả hoặc màn hình trắng.

`.gitignore` bỏ qua `.env`, `.env.*` (trừ `.env.example`), `node_modules`, `dist`, `dist-e2e`, cache, báo cáo test và coverage. Không commit `.env` thật.

## Persistence, bản nháp và nhập dữ liệu cũ

Supabase là nguồn dữ liệu chính cho tasks, subjects, notes, calendar events, focus sessions và settings. Sau khi tải lại hoặc đăng nhập thiết bị khác, app đọc lại từ cloud. Tab đang mở làm mới mỗi 30 giây hoặc khi lấy lại focus, khi không còn thay đổi chờ lưu.

Các lần sửa được gom trong khoảng 350 ms rồi gửi tuần tự. Header và ghi chú hiển thị **Đang lưu / Đã đồng bộ / Chưa đồng bộ**. Lỗi mạng giữ thay đổi trong state và bản nháp `sessionStorage` theo user của tab, có nút thử lại và tự thử khi mạng trở lại. Bản nháp không phải chế độ offline hoàn chỉnh: không thể mở lần đầu khi không tải được cloud. Không đóng tab có thay đổi chưa đồng bộ; xuất JSON trong Cài đặt nếu cần giữ riêng.

SDK giữ token auth trong localStorage. Đồng hồ và bản nháp tạm nằm ở `sessionStorage`, tách theo user; dữ liệu đã đồng bộ không được ghi vào kho dữ liệu local cũ. Đồng hồ dùng mốc kết thúc tuyệt đối, chạy qua điều hướng/reload trong cùng tab. Sau khi đóng hẳn tab, đồng hồ chưa hoàn thành không tiếp tục trên thiết bị khác. Session đã hoàn thành dùng ID cố định để retry không nhân đôi. Không cần server chạy đồng hồ.

Khi sửa cùng một hàng trên nhiều thiết bị, bản ghi đến sau cùng có hiệu lực; chưa có merge nội dung ghi chú theo từng ký tự. Các hàng không sửa không bị ghi đè.

Để chuyển dữ liệu cũ:

1. Đăng nhập trên **đúng trình duyệt và tên miền đã dùng trước đây**.
2. Mở **Cài đặt → Nhập dữ liệu cũ**, xem số lượng rồi xác nhận. Hoặc chọn bản sao JSON đã xuất từ bản cũ.
3. Chọn checkbox nếu muốn áp dụng cả cài đặt trong bản sao; mặc định giữ cài đặt cloud.
4. Chờ **Đã đồng bộ**, kiểm tra dữ liệu trên thiết bị khác.

Khóa legacy `studyflow:data:v1` được giữ nguyên chỉ để đọc/chuyển dữ liệu; đây là ngoại lệ có chủ đích của đổi thương hiệu. Nhập giữ ID ổn định, giữ mục cloud đã có và không nhân đôi khi nhập lại cùng bản sao. Không xóa bản gốc, kể cả khi JSON lỗi. Trình duyệt không đọc được localStorage từ domain khác: hãy xuất JSON trên domain cũ rồi nhập trên domain mới. Dữ liệu mẫu chỉ được tạo khi nhấn **Tạo dữ liệu mẫu**.

## Reset data

**Cài đặt → Xuất dữ liệu** để sao lưu trước. Sau đó **Xóa toàn bộ dữ liệu**, đọc và xác nhận hộp thoại. RPC `reset_workspace` xóa dữ liệu học tập và đặt settings mặc định **chỉ cho tài khoản đang đăng nhập**, giữ tài khoản/profile. Bản dữ liệu legacy trên trình duyệt vẫn được giữ để bạn tự quyết định xử lý. Không reset database bằng cách drop schema khi đang có dữ liệu thật.

## Build và kiểm thử

```bash
npm run check
npm test
npm run build
npm run preview
npx playwright install chromium
npm run test:e2e
npm run format:check
```

- Vitest kiểm tra timer, ngày, validation, diff/merge/import và chạy migration thật trên PostgreSQL nhúng PGlite. Test RLS dùng role `authenticated`/`anon`, hai user và `auth.uid()` mô phỏng; kiểm tra chống đọc/ghi chéo user, khóa ngoại, rollback, trigger và reset.
- Playwright mô phỏng HTTP của Supabase để kiểm tra auth UI, CRUD, session/reload, retry/bản nháp, đổi tài khoản, timer, keyboard, mobile và tài nguyên dưới root hoặc `/FocusLab/`.
- Test e2e build riêng vào `dist-e2e` với URL/key giả chỉ dùng trong fixture; không thay thế `dist` phát hành và không gọi project Supabase thật.
- Các test này không xác minh việc gửi email, cấu hình SMTP/redirect hoặc RLS **đã triển khai** trên project thật. Sau khi cấu hình, cần đăng ký hai tài khoản thật và kiểm tra đăng nhập, lưu trên hai thiết bị, đăng xuất và cô lập dữ liệu.

## Deploy GitHub Pages

Giữ workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), tên **Triển khai FocusLab**. Trong **Settings → Secrets and variables → Actions**, tạo hai repository secrets (hoặc variables):

| Tên chính xác            | Giá trị                                                |
| ------------------------ | ------------------------------------------------------ |
| `VITE_SUPABASE_URL`      | Project URL, ví dụ `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Publishable key hoặc legacy anon key của cùng project  |

Workflow kiểm tra chúng không rỗng, chạy unit test/type check, build, e2e rồi deploy. E2e giữ `continue-on-error: true` theo workflow cũ để lỗi accessibility không chặn phát hành. Bản build e2e luôn nằm riêng.

Trong **Settings → Pages → Build and deployment**, chọn **GitHub Actions**. Push code lên `main` hoặc chạy **Actions → Triển khai FocusLab → Run workflow**.

`base: './'` và hash routing được giữ nguyên. Refresh `/#tasks` hoặc `/FocusLab/#tasks` không cần rewrite server. URL Pages mặc định: `https://lamb-is-me.github.io/FocusLab/`. Custom domain dự kiến: **husterlaydrl.id.vn**. Giữ cấu hình DNS/Custom domain hiện tại trong GitHub Pages; repo ban đầu không có `public/CNAME`, thay đổi này không tự đổi cấu hình domain. Nếu domain chưa được cấu hình, đặt chính xác `husterlaydrl.id.vn` trong **Pages → Custom domain**, hoàn tất DNS theo hướng dẫn GitHub và bật HTTPS.

## Bảo mật

Khóa Vite xuất hiện trong bundle công khai, dù được nhập dưới GitHub Secrets. Chỉ dùng publishable/anon key; bảo vệ dữ liệu bằng RLS. Không dùng `service_role`, `sb_secret_...`, mật khẩu database hoặc tài khoản test trong frontend. Client từ chối các dạng khóa không phải publishable/anon; PostgreSQL mới là nơi thực thi phân quyền.

Không đưa token, mật khẩu hay bản sao dữ liệu thật vào repo, log hoặc ảnh kiểm thử. Xem [hướng dẫn RLS của Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) và [database functions](https://supabase.com/docs/guides/database/functions) khi mở rộng schema. Không tắt RLS để chữa lỗi kết nối.

Mã nguồn sử dụng giấy phép [MIT](LICENSE).

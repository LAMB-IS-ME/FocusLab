Bạn đang làm việc trong một GitHub repository mới có tên **StudyFlow**.

Repository hiện tại gần như trống hoàn toàn, chỉ có một file `README.md` trống hoặc gần như trống.

Nhiệm vụ của bạn là **tự thiết kế và triển khai toàn bộ ứng dụng frontend từ đầu**.

Không chỉ đề xuất kiến trúc hoặc đưa ra code snippet. Hãy thực sự tạo các file cần thiết, scaffold project, cài dependencies, triển khai tính năng, kiểm tra build và để project ở trạng thái có thể chạy/deploy được.

# 1. Ý tưởng sản phẩm

Xây dựng **StudyFlow**, một dashboard hỗ trợ học tập và quản lý năng suất cá nhân dành cho sinh viên.

StudyFlow nên có cảm giác như một sản phẩm SaaS/productivity hiện đại thực sự, không giống một bài tập demo hay admin dashboard chung chung.

Ứng dụng hỗ trợ sinh viên quản lý:

* công việc hằng ngày
* phiên học
* Pomodoro
* môn học
* mục tiêu học tập theo tuần
* ghi chú
* lịch học
* thống kê học tập

Không có backend.

Mọi thứ phải hoạt động hoàn toàn ở phía trình duyệt.

Dữ liệu người dùng cần được lưu bằng `localStorage`.

Project cuối cùng phải phù hợp để deploy dưới dạng static site lên **GitHub Pages**.

---

# 2. Công nghệ sử dụng

Sử dụng:

* React
* Vite
* TypeScript
* Tailwind CSS
* Framer Motion cho animation và transition
* Recharts cho biểu đồ
* Lucide React cho icon
* localStorage để lưu dữ liệu
* npm làm package manager

Có thể thêm một số thư viện frontend nhỏ, phổ biến và đáng tin cậy nếu thực sự giúp cải thiện chất lượng implementation.

Không sử dụng:

* backend
* Firebase
* Supabase
* authentication service
* database
* API key
* paid API
* server-side code

Ứng dụng phải hoạt động hoàn toàn sau khi build thành static site.

---

# 3. Yêu cầu về ngôn ngữ

Toàn bộ dự án hướng đến người dùng Việt Nam.

## Giao diện người dùng

Toàn bộ nội dung hiển thị cho người dùng phải bằng **tiếng Việt tự nhiên, rõ ràng và nhất quán**.

Ví dụ:

* Dashboard → Tổng quan
* Tasks → Công việc
* Focus → Tập trung
* Calendar → Lịch
* Subjects → Môn học
* Notes → Ghi chú
* Settings → Cài đặt
* Todo → Cần làm
* In Progress → Đang thực hiện
* Done → Hoàn thành
* Today → Hôm nay
* Upcoming → Sắp tới
* Weekly Study Goal → Mục tiêu học tập tuần

Không dịch máy móc.

Có thể chọn cách diễn đạt phù hợp với trải nghiệm người dùng Việt Nam.

Toàn bộ các thành phần sau phải dùng tiếng Việt:

* tiêu đề
* menu
* nút
* tooltip
* modal
* toast
* placeholder
* empty state
* form label
* validation message
* dữ liệu demo
* trạng thái
* notification

## README

File `README.md` phải viết **hoàn toàn bằng tiếng Việt**.

README phải giải thích rõ:

* StudyFlow là gì
* chức năng chính
* công nghệ sử dụng
* cách cài đặt
* cách chạy local
* cách build
* cách deploy GitHub Pages
* cấu trúc thư mục chính
* dữ liệu được lưu bằng localStorage như thế nào

Viết sao cho sau vài tháng tôi mở lại vẫn có thể nhanh chóng hiểu project.

## Comment trong code

Comment dùng để giải thích logic phải viết bằng **tiếng Việt**.

Ví dụ:

```ts
// Khôi phục danh sách công việc đã lưu trong localStorage
```

hoặc:

```ts
// Tính tổng thời gian tập trung trong ngày hiện tại
```

Không cần comment mọi dòng.

Ưu tiên code tự giải thích, chỉ comment những đoạn logic không hiển nhiên.

## Tên biến, function, type và component

Giữ tên kỹ thuật bằng **tiếng Anh** theo convention chuẩn của React/TypeScript.

Ví dụ:

```ts
TaskCard
FocusTimer
StudySession
weeklyGoal
completedTasks
saveToLocalStorage()
```

Không dùng kiểu:

```ts
TheCongViec
thoiGianHoc
luuDuLieu()
```

## Tên file và thư mục

Giữ bằng tiếng Anh.

Ví dụ:

```text
src/
├── components/
│   ├── TaskCard.tsx
│   ├── FocusTimer.tsx
│   └── Sidebar.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Tasks.tsx
│   └── Settings.tsx
├── hooks/
├── utils/
└── types/
```

## Dữ liệu demo

Dữ liệu demo cần phù hợp với sinh viên Việt Nam.

Ví dụ môn học:

* Toán cao cấp
* Trí tuệ nhân tạo
* Cấu trúc dữ liệu và giải thuật
* Mạng máy tính
* Tiếng Anh

Ví dụ công việc:

* Hoàn thành bài tập cấu trúc dữ liệu
* Ôn chương 3 Toán cao cấp
* Đọc tài liệu Transformer
* Chuẩn bị bài lab Mạng máy tính
* Luyện TOEIC Reading

Không sử dụng thông tin cá nhân thật của tôi.

## Định dạng ngày giờ

Ưu tiên cách hiển thị quen thuộc với người Việt.

Ví dụ:

```text
16/09/2026
Thứ Tư, 16 tháng 9
Hôm nay
Ngày mai
2 giờ 30 phút
```

Không mặc định hiển thị kiểu Mỹ như:

```text
09/16/2026
```

Có thể dùng:

```ts
Intl.DateTimeFormat("vi-VN")
```

khi phù hợp.

---

# 4. Định hướng thiết kế

Tôi muốn project này thể hiện tốt khả năng frontend engineering và product design.

Phong cách nên mang cảm giác giống các sản phẩm productivity hiện đại như Linear, Notion, Todoist, Raycast, Arc hoặc các SaaS dashboard chất lượng cao.

Không clone bất kỳ sản phẩm nào.

Đặc điểm thiết kế:

* sạch
* hiện đại
* premium
* tối giản nhưng không trống trải
* hierarchy rõ ràng
* spacing tốt
* typography đẹp
* border tinh tế
* shadow vừa phải
* bo góc hợp lý
* gradient có kiểm soát
* animation mượt

Tránh:

* glassmorphism quá nhiều
* neon quá nhiều
* gradient blob khổng lồ
* giao diện kiểu admin Bootstrap mặc định
* quá nhiều hiệu ứng gây rối mắt

Ứng dụng phải có cảm giác sử dụng được lâu dài, không chỉ để demo vài giây.

---

# 5. Layout tổng thể

Thiết kế desktop-first nhưng phải responsive tốt cho mobile.

Desktop:

* sidebar bên trái
* có thể thu gọn/mở rộng
* main content
* top navigation hoặc header hữu ích
* responsive grid/card

Sidebar gồm:

* Tổng quan
* Công việc
* Tập trung
* Lịch
* Môn học
* Ghi chú
* Cài đặt

Menu đang active phải rõ ràng.

Sidebar cần:

* animation mượt khi collapse/expand
* icon và text chuyển động hợp lý
* có thể lưu trạng thái collapse nếu phù hợp
* mobile không được chỉ thu nhỏ sidebar desktop

Ở mobile, hãy thiết kế navigation phù hợp riêng.

---

# 6. Trang Tổng quan

Trang Tổng quan phải tạo cảm giác sản phẩm đang thực sự hoạt động.

Bao gồm:

## Lời chào

Ví dụ:

`Chào buổi tối, sẵn sàng tập trung chưa?`

Lời chào có thể thay đổi theo giờ local.

Không hardcode tên người thật.

## Thẻ thống kê

Hiển thị các chỉ số như:

* công việc hoàn thành hôm nay
* thời gian tập trung hôm nay
* streak hiện tại
* tiến độ mục tiêu tuần

Cards cần có animation khi xuất hiện và hover nhẹ.

## Công việc hôm nay

Hiển thị các task đến hạn hôm nay.

Cho phép:

* đánh dấu hoàn thành
* mở để chỉnh sửa
* thêm nhanh công việc

## Hoạt động học tập trong tuần

Hiển thị biểu đồ thời gian học theo ngày.

Dùng dữ liệu demo hợp lý ở lần mở đầu.

## Mục tiêu học tập tuần

Ví dụ:

`12,5 / 20 giờ`

Có animated progress.

## Sắp tới

Hiển thị các deadline hoặc lịch học sắp tới.

---

# 7. Công việc

Xây dựng một hệ thống quản lý task thật sự hoạt động.

Task gồm:

* title
* description tùy chọn
* subject
* priority
* due date
* status

Status:

* Cần làm
* Đang thực hiện
* Hoàn thành

Tạo giao diện Kanban đẹp.

Người dùng phải có thể:

* tạo task
* sửa task
* xóa task
* hoàn thành task
* đổi priority
* chọn subject
* đặt due date
* chuyển task giữa các cột

Nếu có thể làm sạch và ổn định, hãy hỗ trợ drag-and-drop.

Mọi thay đổi phải được lưu vào `localStorage`.

Thêm filter:

* tất cả
* hôm nay
* sắp tới
* đã hoàn thành
* theo môn học
* theo mức ưu tiên

Có ô search.

Khi task hoàn thành, thêm animation nhẹ và thỏa mãn.

Nếu hoàn thành toàn bộ task hôm nay, có thể có một hiệu ứng chúc mừng nhỏ hoặc confetti tinh tế.

Không lạm dụng.

---

# 8. Pomodoro / Tập trung

Xây dựng Pomodoro timer thật sự hoạt động.

Mode mặc định:

* Tập trung — 25 phút
* Nghỉ ngắn — 5 phút
* Nghỉ dài — 15 phút

Controls:

* Bắt đầu
* Tạm dừng
* Tiếp tục
* Đặt lại
* Bỏ qua

Hiển thị timer lớn với progress vòng tròn có animation.

Cho phép người dùng chọn:

* môn học đang học
* task đang thực hiện

Khi một phiên học kết thúc:

* lưu session
* cập nhật tổng thời gian học hôm nay
* cập nhật thống kê
* hiện toast/notification

Lịch sử session lưu vào `localStorage`.

Hiển thị:

* số session hôm nay
* tổng thời gian tập trung
* task/môn học hiện tại

Timer cần hoạt động hợp lý khi người dùng chuyển sang section khác trong app.

---

# 9. Lịch

Tạo study calendar tương tác.

Hỗ trợ:

* chuyển tháng
* làm nổi bật ngày hiện tại
* có indicator cho ngày có task/event
* click ngày để xem task/event
* thêm sự kiện học
* sửa sự kiện
* xóa sự kiện

Event gồm:

* title
* subject
* date
* start time tùy chọn
* duration tùy chọn

Persist bằng `localStorage`.

Calendar phải đẹp, không giống HTML calendar mặc định.

---

# 10. Môn học

Tạo section Môn học.

Khởi tạo demo:

* Toán cao cấp
* Trí tuệ nhân tạo
* Cấu trúc dữ liệu và giải thuật
* Mạng máy tính
* Tiếng Anh

Mỗi môn có:

* tên
* màu/icon
* tổng thời gian học
* task đã hoàn thành
* tổng task
* progress

Cho phép:

* thêm môn
* sửa môn
* xóa môn

Hiển thị bằng card đẹp.

Click vào môn học để xem chi tiết như:

* tiến độ
* công việc gần đây
* thời gian học
* session gần đây

Dùng `localStorage`.

---

# 11. Ghi chú

Tạo khu vực ghi chú đơn giản nhưng hữu ích.

Người dùng có thể:

* tạo note
* sửa note
* xóa note
* tìm kiếm note
* ghim note quan trọng

Persist bằng `localStorage`.

Autosave nội dung note.

Không cần editor quá phức tạp.

Plain text hoặc Markdown nhẹ là đủ.

Giao diện nên nhanh, sạch và ít gây phân tâm.

---

# 12. Thống kê học tập

Tạo các biểu đồ có ý nghĩa như:

* thời gian học theo ngày
* thời gian học theo môn
* số task hoàn thành
* số Pomodoro session
* tiến độ mục tiêu tuần

Chart nên có animation khi xuất hiện.

Không tạo chart cho có.

Mỗi biểu đồ phải cung cấp thông tin hữu ích.

---

# 13. Cài đặt

Tạo trang Cài đặt.

Bao gồm:

* Light theme
* Dark theme
* System theme
* thời gian Pomodoro mặc định
* thời gian nghỉ ngắn
* thời gian nghỉ dài
* mục tiêu học tập tuần

Theme phải persist.

Dark mode phải được thiết kế riêng, không chỉ invert màu.

Chuyển theme cần mượt.

Thêm:

* Reset toàn bộ dữ liệu ứng dụng

Hành động reset bắt buộc phải có confirm modal.

---

# 14. Command Palette

Implement command palette với:

`Ctrl + K`

và:

`Cmd + K` trên macOS.

Cho phép thao tác nhanh:

* đi đến Tổng quan
* đi đến Công việc
* bắt đầu phiên Tập trung
* tạo Công việc
* tạo Ghi chú
* đổi theme

Command palette phải:

* hỗ trợ bàn phím
* có animation mở/đóng
* đẹp
* đóng bằng Escape

---

# 15. Animation và interaction

Animation là phần quan trọng của project.

Sử dụng Framer Motion hợp lý.

Bao gồm:

* page transition
* sidebar animation
* modal transition
* dropdown animation
* command palette animation
* card hover
* progress animation
* list transition
* toast
* skeleton/loading state nếu phù hợp

Không animate mọi thứ một cách vô nghĩa.

Animation phải:

* nhanh
* mượt
* tinh tế
* giúp UI có cảm giác tốt hơn

Tôn trọng:

`prefers-reduced-motion`

---

# 16. Dữ liệu demo

Khi mở lần đầu, app phải có dữ liệu demo đủ đẹp để nhìn như một sản phẩm hoàn chỉnh.

Khởi tạo:

* một số task
* nhiều môn học
* sự kiện sắp tới
* focus sessions
* notes
* dữ liệu thống kê trong tuần

Chỉ khởi tạo demo data khi chưa có dữ liệu StudyFlow trong `localStorage`.

Không được overwrite dữ liệu người dùng mỗi lần reload.

---

# 17. Kiến trúc localStorage

Không được rải:

```ts
localStorage.getItem(...)
```

lung tung trong mọi component.

Hãy tạo persistence layer, hooks hoặc utility hợp lý.

Dùng storage key rõ ràng.

Xử lý trường hợp:

* dữ liệu không tồn tại
* JSON lỗi
* dữ liệu bị hỏng

Kiến trúc state phải dễ hiểu và dễ maintain.

---

# 18. Chất lượng code

Đây không chỉ là prototype.

Hãy coi đây là một frontend project thực sự.

Yêu cầu:

* component tái sử dụng
* folder structure hợp lý
* TypeScript type/interface rõ ràng
* tránh component khổng lồ
* tránh abstraction không cần thiết
* tránh duplicate code
* tên biến dễ hiểu
* state management sạch
* không có console error rõ ràng
* không có dead code
* không để TODO cho các chức năng bắt buộc

Ưu tiên maintainability hơn clever code.

---

# 19. Responsive

Ứng dụng phải dùng tốt trên:

* desktop
* laptop
* tablet
* mobile

Không chỉ scale layout desktop xuống.

Hãy điều chỉnh layout thông minh.

Đảm bảo:

* chart không tràn
* Kanban vẫn dùng được
* modal không vượt màn hình
* navigation hợp lý
* text không overflow
* touch target đủ lớn

---

# 20. Accessibility

Đảm bảo mức accessibility hợp lý.

Bao gồm:

* semantic HTML
* button thực sự dùng thẻ button
* form label
* keyboard navigation
* focus state rõ
* dialog/modal accessible
* contrast tốt
* aria-label khi icon không có text

---

# 21. GitHub Pages

Chuẩn bị project để deploy lên GitHub Pages.

Tên repository dự kiến:

`studyflow`

Phải đảm bảo Vite config và asset path hoạt động ở:

```text
https://<username>.github.io/studyflow/
```

Project cũng nên tương thích nếu sau này dùng custom domain.

Tránh routing setup khiến refresh URL bị 404 trên GitHub Pages.

Có thể dùng single-page app với internal navigation.

Nếu hợp lý, tạo GitHub Actions workflow để tự động:

* install dependencies
* build
* deploy GitHub Pages

khi push lên `main`.

---

# 22. README

Thay file README trống hiện tại bằng README hoàn chỉnh bằng tiếng Việt.

Bao gồm:

* giới thiệu StudyFlow
* chức năng chính
* công nghệ sử dụng
* hướng dẫn cài đặt
* lệnh chạy local
* lệnh build
* hướng dẫn deploy GitHub Pages
* cấu trúc project
* cách localStorage hoạt động

Viết ngắn gọn nhưng chuyên nghiệp.

---

# 23. Chi tiết chất lượng nhỏ

Thêm các chi tiết để app có cảm giác hoàn thiện:

* empty state
* confirm dialog khi xóa
* tooltip khi phù hợp
* toast feedback
* hover/focus state
* format ngày tự nhiên
* tránh browser alert mặc định nếu có thể dùng modal đẹp
* không broken image
* không có button giả mà bấm không làm gì

Mọi control nhìn thấy rõ ràng đều phải hoạt động hoặc thực sự chỉ là decorative.

---

# 24. Tính nguyên bản của thiết kế

Bạn được tự quyết định:

* layout chính xác
* font
* palette
* spacing
* component styling
* hierarchy
* animation choreography

Tôi cố tình không định nghĩa từng pixel.

Một phần của bài này là để đánh giá khả năng:

* product sense
* design sense
* frontend engineering

Hãy tạo sản phẩm có cảm giác ấn tượng khi mở lần đầu.

Không hy sinh usability chỉ để làm flashy.

---

# 25. Quy trình triển khai

Trước khi code:

1. Kiểm tra repository hiện tại.
2. Xác nhận đây là project mới gần như chưa có implementation.
3. Chọn cấu trúc project sạch.

Sau đó:

1. Scaffold app.
2. Cài dependencies.
3. Tạo layout và design system dùng chung.
4. Implement từng chức năng chính.
5. Thêm persistence.
6. Thêm responsive.
7. Thêm animation.
8. Cấu hình GitHub Pages.
9. Chạy build.
10. Sửa lỗi nếu có.

Không dừng ở bước tạo project.

Không dừng ở bước viết kế hoạch.

Không yêu cầu tôi tự tạo file nếu bạn có thể tự tạo.

Hãy chủ động hoàn thiện project.

---

# 26. Điều kiện hoàn thành

Trước khi coi task là hoàn tất, hãy kiểm tra:

* dependencies cài được
* dev server chạy được
* TypeScript không có lỗi rõ ràng
* production build thành công
* navigation hoạt động
* CRUD task hoạt động
* task lưu được
* Pomodoro hoạt động
* focus history lưu được
* calendar hoạt động
* notes persist
* subjects persist
* theme switching hoạt động
* command palette hoạt động
* responsive ổn
* GitHub Pages config hợp lệ
* không có console error do implementation

Hãy tự chạy các lệnh kiểm tra/build cần thiết.

Nếu lỗi nằm trong repository này, hãy sửa thay vì chỉ báo lỗi.

---

# 27. Phản hồi cuối cùng

Sau khi hoàn thành, chỉ cần báo ngắn gọn:

1. đã xây dựng những gì
2. quyết định kiến trúc quan trọng
3. file/tính năng chính đã thêm
4. kết quả build/verification
5. lệnh chạy local
6. bước tiếp theo chính xác để tôi publish bằng GitHub Pages

Không cần paste lại toàn bộ source code vì code đã nằm trong repository.

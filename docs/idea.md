I want to build a Personal Workout APP - Name AuraFit
Core Idea:

Chức năng chính

Dành cho Solo

- Sẽ có các bài tập theo ngày
- Lộ trình ăn uống
- Kiểm soát cân nặng, cải thiện, ... chất lượng giấc ngủ
- Nghỉ ngơi
- Ứng dụng cũng tự động ghi lại mọi hiệp, số lần lặp và trọng lượng, vì vậy theo thời gian bạn sẽ xây dựng được lịch sử đầy đủ về các lần nâng tạ của mình và có thể xem kỷ lục cá nhân (PR) cho mỗi bài tập một cách nhanh chóng.
- Các bài tập phổ biến, nguồn tham khảo, (giống như sau mỗi set sẽ có thời gian đếm ngược cho việc nghỉ giữa set, ...)
- Hướng dẫn người dùng theo từng bài tập, theo set, rep, bộ đếm thời gian cho từng buổi tập
- Hệ thống thăng cấp, tích lũy EXP chuỗi, aura nhân vật mạnh hơn khi cấp độ cao hơn, XP giảm nếu bỏ tập -> phần thưởng cho sự kiên trì -> nhiệm vụ hệ thống
- Các bài tập của người nổi tiếng, quy trình làm quen khi lần đầu tập
- Bên cạnh đó, có một công cụ ước tính tuổi tim mạch dựa trên nghiên cứu của Nes và cộng sự năm 2014 (NTNU) tính toán tuổi tim của bạn bằng cách sử dụng chỉ số VO2max ước tính được suy ra từ giới tính, tuổi tác, chỉ số BMI và mức độ luyện tập đều đặn của bạn. Luyện tập đủ và tuổi tim mạch của bạn có thể giảm xuống dưới tuổi thật. Bỏ tập quá nhiều ngày và nó sẽ tăng trở lại.

Social

- Có thể mở rộng ra các cơ sở tập luyện
- Bạn bè tập chung ở các cơ sở đó
- Profile
- Diễn đàn
- Chatting

Ứng dụng ThreeJS 3D cho UI

- Mục đích để hiển thị và tô màu các nhóm cơ cũng như model cho từng bài tập
- Sau mỗi buổi tập lập bản đồ chính xác những nhóm cơ nào bị mỏi và tô màu chúng theo thời gian thực (thực sự biết khi nào một nhóm cơ sẵn sàng để tập luyện trở lại chứ không phải đoán mò)

IMPORTANT:
Before writing any code:
1. Ask up to 10 clarifying questions about:
    * product requirements (user flow, interactions)
    * timeline logic (how time is calculated)
    * data structure
    * UI/UX expectations
    * technical constraints
2. Do NOT assume:
    * frontend framework
    * styling library
    * backend or storage approach
3. After asking questions:
    * propose a step-by-step implementation plan
    * explain key design decisions briefly
4. Wait for my confirmation before writing any code.

TechStack In my opinion: React-Native + Three.js + Supabase + PostgreSQL

Hiện tại plan của tôi đang là thế này bạn thấy sao ghi lại check list và đưa ra những tính năng cải thiện
Đồng thời dự án có thể tạo một file context riêng để tôi thêm ý tưởng vào mà không cần gõ lại mỗi lần lên promt được không như Claude.md hay Gemini.md


Chức năng chính
- Chụp ảnh tính calo nạp của ngày hôm đó - Tạm thời sẽ nhập tay (nâng cấp sẽ sử dụng AI để tính lượng calo) + protein đã nạp
- Chụp ảnh sẽ lưu lại ảnh và thời gian - giao diện locket cũng là một option ổn

DB chứa danh sách các bài tập
Lấy thông tin người dùng số đo - cân nặng - tính toán số rep theo bài theo công thức, setup ban đầu sẽ do người dùng input
Ý tưởng của tôi là máy tính sẽ không thể quan sát trực tiếp người dùng được chỉ có họ nhập
Ví dụ bài đầu tiên trong lộ trình lần đầu tiên tập sẽ là lat pull down
sẽ cho người dùng thấy số tạ (kg) hệ thống recommend 
Chỉnh form trước khi vào bài, pre setup
rồi người dùng tập theo và sau đó sẽ nhập số rep đã hoàn thành nếu quá thấp (như 1 set lat thường từ 8-10 rep), 
Người dùng nhập dưới 8 như là 5-6 rep cho set vừa rồi -> tạ quá nặng phải giảm lại ? kg
Người dùng nhập 15-20 rep cho set vừa rồi -> tạ quá nhẹ phải tăng kí

Sau khi xong 1 set sẽ có đếm ngược nghỉ đến set 2, hết thời gian đếm ngược thông báo vào set 2 và liên tục cho đến bài khác
Một buổi tập sẽ có các bài mặc định và các bài extra

Ví dụ như bên dưới, có thể có option theo lộ trình máy đưa ra cũng có thể có option swap 2 bài như latPulldown hôm nay có hứng tập thanh đòn nhưng hôm khác có hứng tập máy thì vẫn cho swap

Còn Extra nghĩa là Hôm nay quá mệt để tập thì có thể giảm bài hoặc giảm set để done bài đó sớm
Cũng có thể tăng bài nếu vô tình tập hăng hơn
 
1. Lat Pulldown (Kéo xô máy): 3 hiệp x 8-10 lần (Nghỉ giữa hiệp: 2 phút)
2. Seated Cable Row (Kéo lưng ngang): 3 hiệp x 10-12 lần (Nghỉ giữa hiệp: 90 giây)
3. Dumbbell Rear Delt Fly (Bay vai sau với tạ đơn): 3 hiệp x 12-15 lần (Nghỉ giữa hiệp: 60 giây)
4. Dumbbell Bicep Curl (Cuốn tay trước tạ đơn): 3 hiệp x 10-12 lần (Nghỉ giữa hiệp: 60 giây)
Cardio cuối buổi: Đi bộ dốc trên máy 20 phút. Độ dốc: 10 - 12%, Tốc độ: 4.2 - 4.5 km/h (Không vịnh tay vào máy).

Quan trọng là sẽ có lưu lại tập theo ngày sơ đồ có thể giống như commit của github tập nhiều thì màu càng xanh, nhấn vào có thể xem lịch sử ngày hôm đó tập gì, kiểu như vậy

Với React-Native có hỗ trợ thông báo đúng không phải cho phép, lưu các thông số sau để dễ phát triển hơn 
Như hỏi về thời gian trên Social -> Giới hạn thời gian trên mạng xã hội
Read books -> Tuần vừa rồi đã đọc bao nhiêu trang sách - sách nào - ảnh sách
Weigh Training -> link lên trên -> tuần vừa rồi tập như thế nào bao nhiêu ngày những bài ưu tiên -
Nạp Protein - tổng calo, protein đã nạp theo ngày tuần
Exercies Cardio - Ngoài đi bộ trên máy, có tập thể dục như cầu lông, đã banh không, nạp gì đốt bao nhiêu cal 
Wake-up time - Mỗi ngày dậy mấy giờ chất lượng giấc ngủ mỗi đêm thế nào
Drink water - Uống bao nhiêu lit nước mỗi ngày, nhắc thông báo uống nước mỗi 10-15p

idea 9/6
Tiếp tục với dự án hôm nay tôi đang có các ý tưởng thế này

Chức năng chính
- Chụp ảnh tính calo nạp của ngày hôm đó - Tạm thời sẽ nhập tay (nâng cấp sẽ sử dụng AI để tính lượng calo) + protein đã nạp
- Chụp ảnh sẽ lưu lại ảnh và thời gian - giao diện locket cũng là một option ổn

DB chứa danh sách các bài tập
Lấy thông tin người dùng số đo - cân nặng - tính toán số rep theo bài theo công thức, setup ban đầu sẽ do người dùng input
Ý tưởng của tôi là máy tính sẽ không thể quan sát trực tiếp người dùng được chỉ có họ nhập
Ví dụ bài đầu tiên trong lộ trình lần đầu tiên tập sẽ là lat pull down
sẽ cho người dùng thấy số tạ (kg) hệ thống recommend 
Chỉnh form trước khi vào bài, pre setup
rồi người dùng tập theo và sau đó sẽ nhập số rep đã hoàn thành nếu quá thấp (như 1 set lat thường từ 8-10 rep), 
Người dùng nhập dưới 8 như là 5-6 rep cho set vừa rồi -> tạ quá nặng phải giảm lại ? kg
Người dùng nhập 15-20 rep cho set vừa rồi -> tạ quá nhẹ phải tăng kí

Sau khi xong 1 set sẽ có đếm ngược nghỉ đến set 2, hết thời gian đếm ngược thông báo vào set 2 và liên tục cho đến bài khác
Một buổi tập sẽ có các bài mặc định và các bài extra

Ví dụ như bên dưới, có thể có option theo lộ trình máy đưa ra cũng có thể có option swap 2 bài như latPulldown hôm nay có hứng tập thanh đòn nhưng hôm khác có hứng tập máy thì vẫn cho swap

Còn Extra nghĩa là Hôm nay quá mệt để tập thì có thể giảm bài hoặc giảm set để done bài đó sớm
Cũng có thể tăng bài nếu vô tình tập hăng hơn
 
1. Lat Pulldown (Kéo xô máy): 3 hiệp x 8-10 lần (Nghỉ giữa hiệp: 2 phút)
2. Seated Cable Row (Kéo lưng ngang): 3 hiệp x 10-12 lần (Nghỉ giữa hiệp: 90 giây)
3. Dumbbell Rear Delt Fly (Bay vai sau với tạ đơn): 3 hiệp x 12-15 lần (Nghỉ giữa hiệp: 60 giây)
4. Dumbbell Bicep Curl (Cuốn tay trước tạ đơn): 3 hiệp x 10-12 lần (Nghỉ giữa hiệp: 60 giây)
Cardio cuối buổi: Đi bộ dốc trên máy 20 phút. Độ dốc: 10 - 12%, Tốc độ: 4.2 - 4.5 km/h (Không vịnh tay vào máy).

Quan trọng là sẽ có lưu lại tập theo ngày sơ đồ có thể giống như commit của github tập nhiều thì màu càng xanh, nhấn vào có thể xem lịch sử ngày hôm đó tập gì, kiểu như vậy

Với React-Native có hỗ trợ thông báo đúng không phải cho phép, lưu các thông số sau để dễ phát triển hơn 
Như hỏi về thời gian trên Social -> Giới hạn thời gian trên mạng xã hội
Read books -> Tuần vừa rồi đã đọc bao nhiêu trang sách - sách nào - ảnh sách
Weigh Training -> link lên trên -> tuần vừa rồi tập như thế nào bao nhiêu ngày những bài ưu tiên -
Nạp Protein - tổng calo, protein đã nạp theo ngày tuần
Exercies Cardio - Ngoài đi bộ trên máy, có tập thể dục như cầu lông, đã banh không, nạp gì đốt bao nhiêu cal 
Wake-up time - Mỗi ngày dậy mấy giờ chất lượng giấc ngủ mỗi đêm thế nào
Drink water - Uống bao nhiêu lit nước mỗi ngày, nhắc thông báo uống nước mỗi 10-15p


bạn đọc có hiểu không khoan code có thể confirm lại chức năng và hướng phát triển, đồng thời bổ sung các chức năng mới vào file doc,

Oke bây giờ hoàn thiện chức năng cho tôi ở trang workout mặc dù đã có danh sách bài tập theo nghày nhưng mong muốn của tôi khi user vào trang sẽ hiển thị list theo tuần

Plan tuần mặc định sẽ của hệ thống recommend trước, và người dùng có quyền tập theo hoặc tạo plan tuần theo từng ngày họ mong muốn, day time sẽ lấy theo current giờ của Việt Nam trước, UI theo trong ảnh cho dễ tracking ngày tập, streak chuỗi tập, 1 tuần sẽ được tặng 2 sheild, nghĩa là day off, nếu lộ trình ban đầu của người dùng sẽ có các trạng thái hard, medium, easy, thì sẽ được tặng số sheild tương ứng kiểu vậy, để họ vẫn giữ được động lực giữ chuỗi tập mà không áp lực mất chuỗi
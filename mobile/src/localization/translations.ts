import { create } from 'zustand';

export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    // Header & Settings
    settings: 'Cài đặt hệ thống',
    changeTheme: 'Thay đổi giao diện',
    changeLanguage: 'Thay đổi ngôn ngữ',
    themeLight: 'Sáng',
    themeDark: 'Tối',
    languageName: 'Tiếng Việt',
    vietnamese: 'Tiếng Việt',
    english: 'Tiếng Anh',
    close: 'Đóng',
    activeTheme: 'Giao diện hiện tại',
    activeLanguage: 'Ngôn ngữ hiện tại',

    // BottomNav
    home: 'TRANG CHỦ',
    workout: 'LUYỆN TẬP',
    leaderboard: 'XẾP HẠNG',
    profile: 'HỒ SƠ',

    // HomeScreen / General
    peakPerformance: 'HIỆU SUẤT ĐỈNH CAO',
    anonymous: 'VÔ DANH',
    visionTitle: 'CÙNG HIỆN THỰC HÓA MỤC TIÊU CỦA BẠN',
    yourName: 'TÊN CỦA BẠN',
    yourIntent: 'MỤC TIÊU CỦA BẠN',
    inquireMembership: 'ĐĂNG KÝ HỘI VIÊN',
    inquireSuccess: 'Đơn đăng ký đang được xử lý trong im lặng.',
    membershipAlert: 'Xin chào {{name}}!\n\nYêu cầu gia nhập AuraFit với mục tiêu "{{intent}}" của bạn đã được tiếp nhận. Đơn đăng ký đang được xử lý.',
    
    // Bento / Stats
    cardioAge: 'Tuổi tim mạch',
    auraShields: 'Lá chắn Aura',
    streak: 'Chuỗi ngày',
    level: 'Cấp độ',
    xp: 'Kinh nghiệm',
    physicalSynthesis: 'Tổng hợp thể chất',
    recoveryIndex: 'Chỉ số phục hồi',
    years: 'tuổi',
    days: 'ngày',
    shields: 'khiên',

    // Workout Hub
    workoutHubTitle: 'Workout Hub',
    workoutHubDesc: 'Tạo, lên lịch và thực hiện các hoạt động thể chất. Chọn các mục khác trên thanh điều hướng để xem thông số.',

    // Leaderboard
    leaderboardTitle: 'Bảng Xếp Hạng',
    leaderboardDesc: 'So sánh cấp độ Aura toàn cầu và chỉ số phục hồi. Nỗ lực để đạt hiệu suất kiến trúc đỉnh cao.',

    // Profile & Auth
    profileTitle: 'AuraFit Node / Hồ Sơ',
    connectedNode: 'Đã kết nối Node thực',
    sandboxMode: 'Chế độ Sandbox ngoại tuyến',
    biometrics: 'Chỉ số sinh trắc',
    height: 'Chiều cao',
    weight: 'Cân nặng',
    cardioAgeLabel: 'Tuổi tim mạch',
    fullName: 'Họ và tên',
    username: 'Tên đăng nhập',
    email: 'Địa chỉ Email',
    password: 'Mật khẩu',
    signIn: 'Đăng Nhập',
    signUp: 'Đăng Ký',
    signOut: 'Đăng xuất / Ngắt kết nối',
    connect: 'Kết nối',
    offlineBypass: 'Truy cập Sandbox offline',
    editProfile: 'Chỉnh sửa hồ sơ',
    save: 'Lưu thay đổi',
    saveSuccess: 'Đã lưu thay đổi thành công!',
    saveLocalSuccess: 'Đã lưu vào bộ nhớ cục bộ (Mock Sandbox).',
    requiredFields: 'Vui lòng điền đầy đủ thông tin bắt buộc.',
    passwordMinLength: 'Mật khẩu phải chứa ít nhất 6 ký tự.',
    signUpSuccess: 'Đăng ký thành công! Vui lòng tiến hành đăng nhập.',
    signOutConfirm: 'Bạn muốn ngắt kết nối phiên làm việc này?',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
  },
  en: {
    // Header & Settings
    settings: 'System Settings',
    changeTheme: 'Change theme',
    changeLanguage: 'Change language',
    themeLight: 'Light',
    themeDark: 'Dark',
    languageName: 'English',
    vietnamese: 'Vietnamese',
    english: 'English',
    close: 'Close',
    activeTheme: 'Current theme',
    activeLanguage: 'Current language',

    // BottomNav
    home: 'HOME',
    workout: 'WORKOUT',
    leaderboard: 'LEADERBOARD',
    profile: 'PROFILE',

    // HomeScreen / General
    peakPerformance: 'PEAK PERFORMANCE',
    anonymous: 'ANONYMOUS',
    visionTitle: "LET'S BRING YOUR VISION TO LIFE",
    yourName: 'YOUR NAME',
    yourIntent: 'YOUR INTENT',
    inquireMembership: 'INQUIRE FOR MEMBERSHIP',
    inquireSuccess: 'Your membership inquiry is being processed in silence.',
    membershipAlert: 'Hello {{name}}!\n\nYour request to join AuraFit with intent "{{intent}}" has been received. Processing...',

    // Bento / Stats
    cardioAge: 'Cardio age',
    auraShields: 'Aura shields',
    streak: 'Streak',
    level: 'Level',
    xp: 'XP',
    physicalSynthesis: 'Physical synthesis',
    recoveryIndex: 'Recovery index',
    years: 'yrs',
    days: 'days',
    shields: 'shields',

    // Workout Hub
    workoutHubTitle: 'Workout Hub',
    workoutHubDesc: 'Create, schedule, and perform physical syntheses. Swipe left to return or check metrics in other nodes.',

    // Leaderboard
    leaderboardTitle: 'Leaderboard',
    leaderboardDesc: 'Compare global Aura levels and recovery indices. Strive for architectural peak performance.',

    // Profile & Auth
    profileTitle: 'AuraFit Node / Profile',
    connectedNode: 'Connected Live Node',
    sandboxMode: 'Sandbox Offline Mode',
    biometrics: 'Biometrics',
    height: 'Height',
    weight: 'Weight',
    cardioAgeLabel: 'Cardio age',
    fullName: 'Full Name',
    username: 'Username',
    email: 'Email address',
    password: 'Password',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Disconnect / Log Out',
    connect: 'Connect',
    offlineBypass: 'Access offline Sandbox',
    editProfile: 'Edit profile',
    save: 'Save changes',
    saveSuccess: 'Changes saved successfully!',
    saveLocalSuccess: 'Saved to local storage (Mock Sandbox).',
    requiredFields: 'Please fill in all required fields.',
    passwordMinLength: 'Password must be at least 6 characters.',
    signUpSuccess: 'Sign up successful! Please log in now.',
    signOutConfirm: 'Are you sure you want to disconnect this session?',
    cancel: 'Cancel',
    confirm: 'Confirm',
  }
};

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['vi']) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'vi', // default language is Vietnamese
  setLanguage: (language) => set({ language }),
  toggleLanguage: () => set((state) => ({ language: state.language === 'vi' ? 'en' : 'vi' })),
  t: (key) => {
    const lang = get().language;
    return translations[lang][key] || translations['vi'][key] || key;
  }
}));

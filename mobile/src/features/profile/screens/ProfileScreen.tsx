import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView } from 'react-native';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { 
  User, 
  Shield, 
  Zap, 
  Flame, 
  Edit2, 
  Check, 
  X, 
  Database, 
  Mail, 
  Lock, 
  LogOut, 
  KeyRound,
  ChevronRight
} from 'lucide-react-native';
import { getProfile, updateProfile, UserProfile } from '../services/profileService';
import { useThemeStore } from '@/src/theme/themeStore';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';

const CURRENT_USER_ID_MOCK = '00000000-0000-0000-0000-000000000000';

const MOCK_PROFILE: UserProfile = {
  id: CURRENT_USER_ID_MOCK,
  username: 'elenavance',
  full_name: 'Elena Vance',
  avatar_url: '',
  level: 12,
  xp: 8450,
  streak_days: 7,
  aura_shields: 1,
  cardio_age: 24,
  metadata: {
    weight: 68,
    height: 172,
    gender: 'Female'
  }
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>(MOCK_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<any>(null);
  const [isSandboxBypassed, setIsSandboxBypassed] = useState(false);
  const { theme } = useThemeStore();

  // Auth States
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Form States
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');

  useEffect(() => {
    // 1. If not configured, directly fall back to Offline Sandbox
    if (!isSupabaseConfigured) {
      setIsOfflineMode(true);
      setIsLoading(false);
      return;
    }

    // 2. Fetch session and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(MOCK_PROFILE);
        setIsLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      const data = await getProfile(userId);
      setProfile(data);
      setIsOfflineMode(false);
    } catch (error: any) {
      console.log('Error fetching profile from Supabase:', error.message);
      
      // Handle missing profile row gracefully (e.g. trigger didn't run or RLS issues)
      if (error.code === 'PGRST116' || error.message?.includes('JSON')) {
        try {
          const newProfile: UserProfile = {
            id: userId,
            username: session?.user?.email?.split('@')[0] || 'aura_user',
            full_name: 'Aura Warrior',
            avatar_url: '',
            level: 1,
            xp: 0,
            streak_days: 0,
            aura_shields: 0,
            cardio_age: 30,
            metadata: {
              weight: 70,
              height: 175,
              gender: 'Other'
            }
          };
          
          // Try to insert missing row
          const { data: inserted, error: insertErr } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (insertErr) throw insertErr;
          setProfile(inserted as UserProfile);
        } catch (initErr: any) {
          console.log('Could not initialize profile row:', initErr.message);
          // Fallback to local
          setProfile(MOCK_PROFILE);
          setIsOfflineMode(true);
        }
      } else {
        setProfile(MOCK_PROFILE);
        setIsOfflineMode(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Yêu cầu', 'Vui lòng điền đầy đủ Email và Mật khẩu.');
      return;
    }

    setAuthLoading(true);
    try {
      if (!isSupabaseConfigured) {
        // Mock connection success in offline mode
        setIsSandboxBypassed(true);
        setProfile({
          ...MOCK_PROFILE,
          username: email.split('@')[0],
          full_name: 'Offline Explorer',
        });
        Alert.alert('Thành công (Sandbox)', 'Đã mô phỏng đăng nhập thành công vào Sandbox.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        Alert.alert('Thành công', 'Đã kết nối với database node.');
      }
    } catch (error: any) {
      Alert.alert('Lỗi đăng nhập', error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Yêu cầu', 'Vui lòng điền đầy đủ Email và Mật khẩu.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Yêu cầu', 'Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }
    if (!signUpUsername.trim() || !signUpFullName.trim()) {
      Alert.alert('Yêu cầu', 'Vui lòng cung cấp Username và Họ tên.');
      return;
    }

    setAuthLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setIsSandboxBypassed(true);
        setProfile({
          ...MOCK_PROFILE,
          username: signUpUsername.trim(),
          full_name: signUpFullName.trim(),
        });
        Alert.alert('Thành công (Sandbox)', 'Tài khoản sandbox được tạo cục bộ thành công.');
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              username: signUpUsername.trim(),
              full_name: signUpFullName.trim(),
            }
          }
        });
        if (error) throw error;
        Alert.alert('Đăng ký thành công', 'Kiểm tra email của bạn để xác thực hoặc bắt đầu đăng nhập.');
        setIsSignUpMode(false);
      }
    } catch (error: any) {
      Alert.alert('Lỗi đăng ký', error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn muốn ngắt kết nối phiên làm việc này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              if (isSupabaseConfigured) {
                await supabase.auth.signOut();
              }
              setSession(null);
              setIsSandboxBypassed(false);
              setProfile(MOCK_PROFILE);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEditPress = () => {
    setEditUsername(profile.username);
    setEditFullName(profile.full_name);
    setEditWeight(String(profile.metadata.weight || ''));
    setEditHeight(String(profile.metadata.height || ''));
    setIsEditing(true);
  };

  const handleSavePress = async () => {
    if (!editUsername.trim() || !editFullName.trim()) {
      Alert.alert('Lỗi', 'Username và tên đầy đủ không được bỏ trống.');
      return;
    }

    const updates = {
      username: editUsername.trim(),
      full_name: editFullName.trim(),
      metadata: {
        ...profile.metadata,
        weight: Number(editWeight) || profile.metadata.weight,
        height: Number(editHeight) || profile.metadata.height,
      }
    };

    setIsLoading(true);
    try {
      const activeUserId = session?.user?.id || CURRENT_USER_ID_MOCK;
      const isActuallyOffline = isOfflineMode || !session;

      if (isActuallyOffline) {
        // Save local only
        setProfile(prev => ({
          ...prev,
          ...updates,
        }));
        Alert.alert('Thành công (Local)', 'Đã lưu thay đổi vào bộ nhớ cục bộ (Mock Sandbox).');
      } else {
        // Save to real database
        const updated = await updateProfile(activeUserId, updates);
        setProfile(updated);
        Alert.alert('Thành công', 'Hồ sơ đã được lưu đồng bộ lên Supabase Database.');
      }
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể lưu thay đổi: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if we should show the auth panel
  const isAuthRequired = isSupabaseConfigured ? !session : !isSandboxBypassed;

  if (isLoading) {
    return (
      <Box className="flex-1 bg-brand-light-bg dark:bg-brand-dark-bg items-center justify-center">
        <ActivityIndicator size="large" color="#8EB69B" />
        <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted mt-2">
          Đang kết nối dữ liệu...
        </Text>
      </Box>
    );
  }

  // --- 1. AUTH PANEL PORTAL SCREEN ---
  if (isAuthRequired) {
    return (
      <ScrollView 
        className="flex-1 bg-brand-light-bg dark:bg-brand-dark-bg"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <VStack space="xl" className="w-full">
          {/* Logo / Title Area */}
          <VStack space="xs" className="items-center mb-2">
            <Box className="w-14 h-14 rounded-full border border-brand-primary/40 items-center justify-center bg-brand-light-card dark:bg-brand-dark-card shadow-md mb-2">
              <KeyRound size={24} className="text-brand-primary" />
            </Box>
            <Heading size="xl" className="text-brand-light-text dark:text-brand-dark-text font-extrabold uppercase tracking-tight text-center">
              AuraFit Node
            </Heading>
            <Text className="text-xs text-brand-light-text-muted dark:text-brand-dark-text-muted text-center font-light px-4">
              Kết nối hồ sơ đồng bộ sinh trắc học và lịch sử luyện tập của bạn
            </Text>
          </VStack>

          {/* Offline/Config Notice */}
          {!isSupabaseConfigured && (
            <HStack space="xs" className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl items-start">
              <Database size={16} className="text-amber-500 mt-0.5" />
              <VStack className="flex-1">
                <Text className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                  Chế độ Sandbox (Offline)
                </Text>
                <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted mt-0.5 leading-relaxed">
                  Thiết lập file mobile/.env để chuyển sang Supabase thực. Nhấp nút "Truy cập Sandbox" để chạy thử.
                </Text>
              </VStack>
            </HStack>
          )}

          {/* Form Card */}
          <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl p-6 shadow-xl">
            <VStack space="lg">
              <HStack className="border-b border-brand-light-border/40 dark:border-brand-dark-border/40 pb-3 justify-around">
                <Pressable onPress={() => setIsSignUpMode(false)} className="pb-1">
                  <Text className={`text-xs font-bold uppercase tracking-widest ${!isSignUpMode ? 'text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                    Đăng Nhập
                  </Text>
                </Pressable>
                <Pressable onPress={() => setIsSignUpMode(true)} className="pb-1">
                  <Text className={`text-xs font-bold uppercase tracking-widest ${isSignUpMode ? 'text-brand-primary' : 'text-brand-light-text-muted dark:text-brand-dark-text-muted'}`}>
                    Đăng Ký
                  </Text>
                </Pressable>
              </HStack>

              {/* Dynamic Sign Up Fields */}
              {isSignUpMode && (
                <VStack space="md">
                  <VStack space="xs">
                    <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                      Họ và Tên
                    </Text>
                    <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                      <InputField
                        value={signUpFullName}
                        onChangeText={signUpFullName => setSignUpFullName(signUpFullName)}
                        placeholder="Elena Vance"
                        placeholderTextColor={theme === 'dark' ? '#8EB69B' : '#5C8276'}
                        className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                      />
                    </Input>
                  </VStack>

                  <VStack space="xs">
                    <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                      Username độc nhất
                    </Text>
                    <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                      <InputField
                        value={signUpUsername}
                        onChangeText={signUpUsername => setSignUpUsername(signUpUsername)}
                        placeholder="elenavance"
                        placeholderTextColor={theme === 'dark' ? '#8EB69B' : '#5C8276'}
                        className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                        autoCapitalize="none"
                      />
                    </Input>
                  </VStack>
                </VStack>
              )}

              {/* Core Credentials Fields */}
              <VStack space="xs">
                <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                  Email
                </Text>
                <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                  <InputField
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@domain.com"
                    placeholderTextColor={theme === 'dark' ? '#8EB69B' : '#5C8276'}
                    className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                  Mật khẩu
                </Text>
                <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                  <InputField
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={theme === 'dark' ? '#8EB69B' : '#5C8276'}
                    className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </Input>
              </VStack>

              {/* Action Button */}
              {authLoading ? (
                <ActivityIndicator size="small" color="#8EB69B" className="py-2" />
              ) : (
                <Button 
                  size="md" 
                  variant="solid" 
                  action="primary" 
                  className="bg-brand-primary rounded-xl py-2 mt-2"
                  onPress={isSignUpMode ? handleSignUp : handleSignIn}
                >
                  <ButtonText className="text-brand-secondary dark:text-brand-neutral font-extrabold uppercase text-xs tracking-wider">
                    {isSignUpMode ? 'Đăng Ký Thành Viên' : 'Kết Nối'}
                  </ButtonText>
                </Button>
              )}
            </VStack>
          </Box>

          {/* Sandbox Bypass Option */}
          {!isSupabaseConfigured && (
            <Button 
              variant="outline" 
              action="secondary" 
              className="border border-brand-primary/30 rounded-xl py-2 flex-row items-center justify-center bg-brand-light-card/40 dark:bg-brand-dark-card/40"
              onPress={() => setIsSandboxBypassed(true)}
            >
              <ButtonText className="text-brand-primary font-bold text-xs mr-1">
                Truy cập Sandbox offline
              </ButtonText>
              <ChevronRight size={14} className="text-brand-primary" />
            </Button>
          )}
        </VStack>
      </ScrollView>
    );
  }

  // --- 2. MAIN PROFILE DASHBOARD (CRUD RENDERING) ---
  return (
    <ScrollView 
      className="flex-1 bg-brand-light-bg dark:bg-brand-dark-bg"
      contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <VStack space="xl">
        {/* Connection Mode Banner */}
        <HStack space="sm" className={`p-3 rounded-xl items-center justify-between border ${
          isOfflineMode 
            ? 'bg-amber-500/10 border-amber-500/20' 
            : 'bg-brand-primary/10 border-brand-primary/20'
        }`}>
          <HStack space="xs" className="items-center flex-1">
            <Database size={14} className={isOfflineMode ? 'text-amber-500' : 'text-brand-primary'} />
            <Text className={`text-[9px] font-bold uppercase tracking-wider ${isOfflineMode ? 'text-amber-500' : 'text-brand-primary'}`}>
              {isOfflineMode ? 'Sandbox Offline Mode' : 'Connected Live Node'}
            </Text>
          </HStack>
          <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted">
            {isOfflineMode ? 'Mock Local Saving' : `Session: ${session?.user?.email}`}
          </Text>
        </HStack>

        {/* Profile Card */}
        <Box className="bg-brand-light-card dark:bg-brand-dark-card border border-brand-light-border dark:border-brand-dark-border rounded-2xl p-6 relative overflow-hidden shadow-lg">
          <VStack space="xl">
            {/* Top row: avatar & edit triggers */}
            <HStack className="justify-between items-center">
              <Box className="w-16 h-16 rounded-full border border-brand-primary/45 items-center justify-center bg-brand-light-bg dark:bg-brand-dark-bg shadow-sm">
                <User size={28} className="text-brand-primary" />
              </Box>

              {!isEditing ? (
                <Button 
                  size="sm" 
                  variant="outline" 
                  action="secondary" 
                  className="rounded-full w-8 h-8 items-center justify-center p-0 border-brand-light-border dark:border-brand-dark-border"
                  onPress={handleEditPress}
                >
                  <Edit2 size={13} className="text-brand-primary" />
                </Button>
              ) : (
                <HStack space="xs">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    action="secondary" 
                    className="rounded-full w-8 h-8 items-center justify-center p-0 border-red-500/50"
                    onPress={() => setIsEditing(false)}
                  >
                    <X size={13} className="text-red-500" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    action="primary" 
                    className="rounded-full w-8 h-8 items-center justify-center p-0 border-brand-primary"
                    onPress={handleSavePress}
                  >
                    <Check size={13} className="text-brand-primary" />
                  </Button>
                </HStack>
              )}
            </HStack>

            {/* Profile fields */}
            <VStack space="md">
              {!isEditing ? (
                <VStack space="xs">
                  <Heading size="lg" className="text-brand-light-text dark:text-brand-dark-text font-bold">
                    {profile.full_name}
                  </Heading>
                  <Text className="text-xs text-brand-primary font-mono">
                    @{profile.username}
                  </Text>
                </VStack>
              ) : (
                <VStack space="md">
                  <VStack space="xs">
                    <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                      Họ và Tên
                    </Text>
                    <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                      <InputField
                        value={editFullName}
                        onChangeText={setEditFullName}
                        className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                      />
                    </Input>
                  </VStack>
                  <VStack space="xs">
                    <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-wider">
                      Username
                    </Text>
                    <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                      <InputField
                        value={editUsername}
                        onChangeText={setEditUsername}
                        className="text-brand-light-text dark:text-brand-dark-text text-sm h-8"
                      />
                    </Input>
                  </VStack>
                </VStack>
              )}
            </VStack>

            {/* Gamification indicators */}
            <HStack className="justify-between pt-4 border-t border-brand-light-border/40 dark:border-brand-dark-border/40">
              <VStack className="items-center flex-1">
                <Zap size={16} className="text-brand-primary mb-1" />
                <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest">
                  Level
                </Text>
                <Heading size="sm" className="text-brand-light-text dark:text-brand-dark-text font-bold mt-0.5">
                  {profile.level}
                </Heading>
              </VStack>

              <VStack className="items-center flex-1 border-l border-r border-brand-light-border/40 dark:border-brand-dark-border/40">
                <Flame size={16} className="text-amber-500 mb-1" />
                <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest">
                  Streak
                </Text>
                <Heading size="sm" className="text-brand-light-text dark:text-brand-dark-text font-bold mt-0.5">
                  {profile.streak_days}d
                </Heading>
              </VStack>

              <VStack className="items-center flex-1">
                <Shield size={16} className="text-brand-primary mb-1" />
                <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest">
                  Shields
                </Text>
                <Heading size="sm" className="text-brand-light-text dark:text-brand-dark-text font-bold mt-0.5">
                  {profile.aura_shields}
                </Heading>
              </VStack>
            </HStack>

            {/* Biometrics */}
            <VStack space="md" className="pt-4 border-t border-brand-light-border/40 dark:border-brand-dark-border/40">
              <Heading size="xs" className="text-brand-light-text dark:text-brand-dark-text uppercase tracking-widest text-[9px] font-bold">
                Chỉ số Sinh trắc
              </Heading>

              {!isEditing ? (
                <HStack className="justify-between">
                  <VStack>
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest">Chiều Cao</Text>
                    <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-semibold mt-0.5">{profile.metadata?.height || 170} cm</Text>
                  </VStack>
                  <VStack>
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest">Cân Nặng</Text>
                    <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-semibold mt-0.5">{profile.metadata?.weight || 60} kg</Text>
                  </VStack>
                  <VStack>
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest">Cardio Age</Text>
                    <Text className="text-xs text-brand-light-text dark:text-brand-dark-text font-semibold mt-0.5">{profile.cardio_age || 30} tuổi</Text>
                  </VStack>
                </HStack>
              ) : (
                <HStack space="md" className="w-full">
                  <VStack space="xs" className="flex-1">
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest">Chiều cao (cm)</Text>
                    <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                      <InputField
                        value={editHeight}
                        onChangeText={setEditHeight}
                        keyboardType="numeric"
                        className="text-brand-light-text dark:text-brand-dark-text text-xs h-7"
                      />
                    </Input>
                  </VStack>
                  <VStack space="xs" className="flex-1">
                    <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted uppercase tracking-widest">Cân nặng (kg)</Text>
                    <Input variant="underlined" size="sm" className="border-brand-light-border dark:border-brand-dark-border">
                      <InputField
                        value={editWeight}
                        onChangeText={setEditWeight}
                        keyboardType="numeric"
                        className="text-brand-light-text dark:text-brand-dark-text text-xs h-7"
                      />
                    </Input>
                  </VStack>
                </HStack>
              )}
            </VStack>
          </VStack>
        </Box>

        {/* Action: Log Out */}
        <Button 
          variant="outline" 
          action="secondary" 
          className="border border-red-500/30 rounded-xl py-2 flex-row items-center justify-center bg-red-500/5 dark:bg-red-500/10"
          onPress={handleSignOut}
        >
          <LogOut size={14} className="text-red-500 mr-2" />
          <ButtonText className="text-red-500 font-bold text-xs uppercase tracking-wider">
            {isOfflineMode ? 'Rời Sandbox' : 'Ngắt kết nối / Đăng xuất'}
          </ButtonText>
        </Button>
      </VStack>
    </ScrollView>
  );
}

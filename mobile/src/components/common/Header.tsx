import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button, ButtonIcon } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { Moon, Settings, User, Sun } from 'lucide-react-native';
import { useThemeStore } from '@/src/theme/themeStore';
import { useLanguageStore } from '@/src/localization/translations';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { getProfile } from '@/src/features/profile/services/profileService';

export default function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const { language, toggleLanguage, t } = useLanguageStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const logo = require('@/assets/app-logo.png')

  console.log("logo", logo)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserEmail(session.user.email || '');
        getProfile(session.user.id)
          .then(setProfile)
          .catch(() => { });
      }
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || '');
        getProfile(session.user.id)
          .then(setProfile)
          .catch(() => { });
      } else {
        setProfile(null);
        setUserEmail('');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSettingsPress = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <HStack className="h-16 justify-between items-center px-6 border-b border-brand-light-border dark:border-brand-dark-border bg-brand-light-bg/85 dark:bg-brand-dark-bg/85 backdrop-blur-md z-50 relative">
      {/* Profile Section */}
      <HStack space="md" className="items-center">
        <Avatar size="sm" className="border border-brand-primary/30">
          <AvatarImage
            source={logo}
          />
        </Avatar>
        <VStack>
          <Text className="text-[10px] text-brand-light-text dark:text-brand-dark-text font-bold uppercase tracking-widest leading-none">
            {profile?.full_name || 'Elena Vance'}
          </Text>
          <Text className="text-[8px] text-brand-primary font-semibold uppercase tracking-wider mt-0.5">
            Lvl {profile?.level || 12} Architect
          </Text>
        </VStack>
      </HStack>

      {/* Brand Title */}
      <Heading size="md" className="text-brand-light-text dark:text-brand-dark-text uppercase tracking-tighter font-bold">
        AuraFit
      </Heading>

      {/* Action Buttons */}
      <HStack className="items-center relative">
        <Button
          size="md"
          variant="outline"
          action="secondary"
          className="w-10 h-10 rounded-full border-brand-light-border dark:border-brand-dark-border items-center justify-center p-0"
          onPress={handleSettingsPress}
        >
          <ButtonIcon as={Settings} className="text-brand-primary" style={{ width: 20, height: 20 }} />
        </Button>
      </HStack>

      {/* Click-outside Backdrop */}
      {isMenuOpen && (
        <Pressable
          style={StyleSheet.absoluteFill}
          className="absolute -top-10 -left-10 w-[1000%] h-[1000%] bg-transparent z-[80]"
          onPress={() => setIsMenuOpen(false)}
        />
      )}

      {/* GitHub/Premium styled Dropdown Menu */}
      {isMenuOpen && (
        <Box
          className="absolute top-14 right-6 w-60 rounded-2xl bg-brand-light-card/95 dark:bg-brand-dark-card/95 border border-brand-light-border dark:border-brand-dark-border p-4 shadow-2xl z-[90] backdrop-blur-md"
        >
          {/* Header User info */}
          {/* <HStack space="sm" className="pb-3 border-b border-brand-light-border/40 dark:border-brand-dark-border/40 items-center">
            <Box className="w-8 h-8 rounded-full border border-brand-primary/30 items-center justify-center bg-brand-light-bg dark:bg-brand-dark-bg">
              <User size={14} className="text-brand-primary" />
            </Box>
            <VStack className="flex-1">
              <Text className="text-xs font-bold text-brand-light-text dark:text-brand-dark-text leading-tight">
                {profile?.full_name || 'Elena Vance'}
              </Text>
              <Text className="text-[9px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-mono truncate max-w-[150px]">
                {userEmail || 'guest@aurafit.io'}
              </Text>
            </VStack> 
          </HStack> */}

          {/* Theme Section */}
          <HStack className="flex flex-col">
            <VStack>
              <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-widest">
                {t('activeTheme')}
              </Text>
            </VStack>

            <VStack className='flex flex-row justify-between items-center mt-1'>
              <Text className="text-xs font-semibold text-brand-light-text dark:text-brand-dark-text capitalize">
                {theme === 'dark' ? t('themeDark') : t('themeLight')}
              </Text>
              {/* Custom Toggle Switch (Matches design blueprint) */}
              <Pressable
                onPress={toggleTheme}
                className={`w-14 h-7 rounded-full p-[3px] flex-row items-center justify-between ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-neutral-200 border border-neutral-300'
                  }`}
              >
                {theme === 'dark' ? (
                  <>
                    <Box className="w-5 h-5 rounded-full bg-brand-primary shadow-sm" />
                    <Box className="pr-1.5">
                      <Moon size={10} color={"white"} />
                    </Box>
                  </>
                ) : (
                  <>
                    <Box className="pl-1.5">
                      <Sun size={10} color={"black"} />
                    </Box>
                    <Box className="w-5 h-5 rounded-full bg-brand-primary shadow-sm" />
                  </>
                )}
              </Pressable>
            </VStack>
          </HStack>

          {/* Language Section */}
          <VStack space="xs" className="pt-3">
            <Text className="text-[8px] text-brand-light-text-muted dark:text-brand-dark-text-muted font-bold uppercase tracking-widest mb-1">
              {t('activeLanguage')}
            </Text>
            <Pressable
              onPress={() => { if (language !== 'vi') toggleLanguage(); }}
              className="flex-row items-center justify-between py-1"
            >
              <Text className={`text-xs ${language === 'vi' ? 'text-brand-primary font-bold' : 'text-brand-light-text dark:text-brand-dark-text'}`}>
                {t('vietnamese')}
              </Text>
              {language === 'vi' && <Box className="w-1.5 h-1.5 rounded-full bg-brand-primary" />}
            </Pressable>
            <Pressable
              onPress={() => { if (language !== 'en') toggleLanguage(); }}
              className="flex-row items-center justify-between py-1"
            >
              <Text className={`text-xs ${language === 'en' ? 'text-brand-primary font-bold' : 'text-brand-light-text dark:text-brand-dark-text'}`}>
                {t('english')}
              </Text>
              {language === 'en' && <Box className="w-1.5 h-1.5 rounded-full bg-brand-primary" />}
            </Pressable>
          </VStack>
        </Box>
      )}
    </HStack>
  );
}

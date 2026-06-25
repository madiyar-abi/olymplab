'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useTransition } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

const LOCALES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const onSelectLocale = (nextLocale: string) => {
    setIsOpen(false);
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- next-intl typed pathname
        { pathname, params },
        { locale: nextLocale }
      );
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/10 text-sm font-medium text-white/80 hover:text-white"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="uppercase text-xs tracking-wide font-semibold">{locale}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 mt-2 w-44 z-50 rounded-xl overflow-hidden shadow-2xl"
              style={{
                background: 'rgba(15, 15, 20, 0.95)',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="p-1.5 space-y-0.5">
                {LOCALES.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => onSelectLocale(item.code)}
                    disabled={isPending}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                      locale === item.code
                        ? 'bg-blue-500/20 text-blue-300 font-semibold'
                        : 'text-white/70 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-base">{item.flag}</span>
                      <span>{item.label}</span>
                    </span>
                    {locale === item.code && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

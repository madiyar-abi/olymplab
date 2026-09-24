'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useTransition } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCALES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

function setLocaleCookie(nextLocale: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000;SameSite=Lax`;
  }
}

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSelectLocale = (nextLocale: string) => {
    setIsOpen(false);
    setLocaleCookie(nextLocale);
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
      router.refresh();
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 bg-secondary/80 border-border hover:border-primary/40 hover:bg-secondary text-sm font-medium text-foreground shadow-sm cursor-pointer"
        title="Сменить язык / Switch language"
      >
        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="uppercase text-xs tracking-wide font-semibold font-mono">{locale}</span>
        <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
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
              className="absolute right-0 mt-2 w-44 z-50 rounded-xl overflow-hidden shadow-2xl bg-card border border-border text-foreground"
            >
              <div className="p-1.5 space-y-0.5">
                {LOCALES.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => onSelectLocale(item.code)}
                    disabled={isPending}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer",
                      locale === item.code
                        ? "bg-primary/15 text-primary font-bold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-base">{item.flag}</span>
                      <span>{item.label}</span>
                    </span>
                    {locale === item.code && <Check className="w-3.5 h-3.5 text-primary" />}
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

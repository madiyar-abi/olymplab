'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useTransition } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function LanguageSwitcher() {
  const t = useTranslations('LanguageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const locales = [
    { code: 'en', label: t('en') },
    { code: 'ru', label: t('ru') },
  ];

  const onSelectLocale = (nextLocale: string) => {
    setIsOpen(false);
    startTransition(() => {
      router.replace(
        // @ts-expect-error
        { pathname, params },
        { locale: nextLocale }
      );
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300",
          "bg-secondary/50 border-white/5 hover:border-white/20 text-sm font-medium",
          isOpen ? "border-white/20 bg-secondary" : ""
        )}
      >
        <Globe className="w-4 h-4 text-primary" />
        <span className="uppercase">{locale}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-2 w-40 z-50 bg-secondary border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              <div className="p-1.5">
                {locales.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => onSelectLocale(item.code)}
                    disabled={isPending}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                      locale === item.code 
                        ? "bg-primary/10 text-primary font-semibold" 
                        : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <span>{item.label}</span>
                    {locale === item.code && <Check className="w-4 h-4" />}
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

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Levels:
//   beginner    — уроки 1–14
//   junior_cp   — уроки 15–22
//   middle_cp   — уроки 23–32
//   advanced_cp — уроки 33–40+

const topics = [
  // ─── BEGINNER (1–14) ──────────────────────────────────────────────────────

  // Уроки 1–2 оставляем как есть
  {
    title: 'Основы языка (Ввод-вывод, типы, циклы, функции)',
    stage: 'Начальный',
    level: 'beginner',
    order_index: 1,
    prerequisites: [],
    article_url: null,
  },
  {
    title: 'Массивы и строки',
    stage: 'Начальный',
    level: 'beginner',
    order_index: 2,
    prerequisites: ['Основы языка (Ввод-вывод, типы, циклы, функции)'],
    article_url: null,
  },

  // Урок 3 — Анализ алгоритмов
  {
    title: 'Анализ алгоритмов',
    stage: 'Базовый',
    level: 'beginner',
    order_index: 3,
    prerequisites: ['Массивы и строки'],
    article_url: null,
  },

  // Урок 4 — Базовые структуры данных
  {
    title: 'Базовые структуры данных',
    stage: 'Базовый',
    level: 'beginner',
    order_index: 4,
    prerequisites: ['Анализ алгоритмов'],
    article_url: null,
  },

  // Урок 5 — Простые сортировки
  {
    title: 'Простые сортировки',
    stage: 'Базовый',
    level: 'beginner',
    order_index: 5,
    prerequisites: ['Базовые структуры данных'],
    article_url: null,
  },

  // Урок 6 — Общая тема сортировок
  {
    title: 'Общая тема сортировок',
    stage: 'Базовый',
    level: 'beginner',
    order_index: 6,
    prerequisites: ['Простые сортировки'],
    article_url: null,
  },

  // Урок 7 — Специальные сортировки
  {
    title: 'Специальные сортировки',
    stage: 'Базовый',
    level: 'beginner',
    order_index: 7,
    prerequisites: ['Общая тема сортировок'],
    article_url: null,
  },

  // Урок 8 — Двоичная куча и сортировка кучей
  {
    title: 'Двоичная куча и сортировка кучей',
    stage: 'Базовый',
    level: 'beginner',
    order_index: 8,
    prerequisites: ['Специальные сортировки'],
    article_url: null,
  },

  // Урок 9 — Префиксные суммы
  {
    title: 'Префиксные суммы',
    stage: 'Базовый',
    level: 'beginner',
    order_index: 9,
    prerequisites: ['Базовые структуры данных'],
    article_url: null,
  },

  // Урок 10 — Бинарный поиск
  {
    title: 'Бинарный поиск',
    stage: 'Базовый',
    level: 'beginner',
    order_index: 10,
    prerequisites: ['Общая тема сортировок', 'Анализ алгоритмов'],
    article_url: null,
  },

  // Урок 11 — Бинарный поиск по ответу
  {
    title: 'Бинарный поиск по ответу',
    stage: 'Базовый',
    level: 'beginner',
    order_index: 11,
    prerequisites: ['Бинарный поиск'],
    article_url: null,
  },

  // Урок 12 — Интерактивные задачи
  {
    title: 'Интерактивные задачи',
    stage: 'Базовый',
    level: 'beginner',
    order_index: 12,
    prerequisites: ['Бинарный поиск по ответу'],
    article_url: null,
  },

  // Урок 13 — Сжатие координат
  {
    title: 'Сжатие координат',
    stage: 'Базовый',
    level: 'beginner',
    order_index: 13,
    prerequisites: ['Бинарный поиск', 'Общая тема сортировок'],
    article_url: null,
  },

  // Урок 14 — Арифметика и биты
  {
    title: 'Арифметика и биты',
    stage: 'Базовый',
    level: 'beginner',
    order_index: 14,
    prerequisites: ['Анализ алгоритмов'],
    article_url: null,
  },

  // ─── JUNIOR CP (15–22) ────────────────────────────────────────────────────

  // Урок 15 — Базовая математика
  {
    title: 'Базовая математика',
    stage: 'Средний',
    level: 'junior_cp',
    order_index: 15,
    prerequisites: ['Арифметика и биты'],
    article_url: null,
  },

  // Урок 16 — Простые числа и факторизация
  {
    title: 'Простые числа и факторизация',
    stage: 'Средний',
    level: 'junior_cp',
    order_index: 16,
    prerequisites: ['Базовая математика'],
    article_url: null,
  },

  // Урок 17 — Технологии программирования (стресс-тест)
  {
    title: 'Технологии программирования',
    stage: 'Средний',
    level: 'junior_cp',
    order_index: 17,
    prerequisites: ['Бинарный поиск по ответу', 'Общая тема сортировок'],
    article_url: null,
  },

  // Урок 18 — Деревья поиска
  {
    title: 'Деревья поиска',
    stage: 'Средний',
    level: 'junior_cp',
    order_index: 18,
    prerequisites: ['Двоичная куча и сортировка кучей', 'Базовые структуры данных'],
    article_url: null,
  },

  // Урок 19 — Жадные алгоритмы
  {
    title: 'Жадные алгоритмы',
    stage: 'Средний',
    level: 'junior_cp',
    order_index: 19,
    prerequisites: ['Деревья поиска', 'Сжатие координат'],
    article_url: null,
  },

  // Урок 20 — Обходы графов
  {
    title: 'Обходы графов',
    stage: 'Средний',
    level: 'junior_cp',
    order_index: 20,
    prerequisites: ['Жадные алгоритмы', 'Базовые структуры данных'],
    article_url: null,
  },

  // Урок 21 — Базовые задачи на графы
  {
    title: 'Базовые задачи на графах',
    stage: 'Средний',
    level: 'junior_cp',
    order_index: 21,
    prerequisites: ['Обходы графов'],
    article_url: null,
  },

  // Урок 22 — Кратчайшие пути
  {
    title: 'Кратчайшие пути',
    stage: 'Средний',
    level: 'junior_cp',
    order_index: 22,
    prerequisites: ['Базовые задачи на графах'],
    article_url: null,
  },

  // ─── MIDDLE CP (23–32) ────────────────────────────────────────────────────

  // Урок 23 — DSU и остовные деревья
  {
    title: 'DSU и остовные деревья',
    stage: 'Продвинутый',
    level: 'middle_cp',
    order_index: 23,
    prerequisites: ['Кратчайшие пути'],
    article_url: null,
  },

  // Урок 24 — Корневые деревья
  {
    title: 'Корневые деревья',
    stage: 'Продвинутый',
    level: 'middle_cp',
    order_index: 24,
    prerequisites: ['DSU и остовные деревья', 'Обходы графов'],
    article_url: null,
  },

  // Урок 25 — Динамическое программирование
  {
    title: 'Динамическое программирование',
    stage: 'Продвинутый',
    level: 'middle_cp',
    order_index: 25,
    prerequisites: ['Жадные алгоритмы', 'Корневые деревья'],
    article_url: null,
  },

  // Урок 26 — Теория игр
  {
    title: 'Теория игр',
    stage: 'Продвинутый',
    level: 'middle_cp',
    order_index: 26,
    prerequisites: ['Арифметика и биты', 'Динамическое программирование'],
    article_url: null,
  },

  // Урок 27 — Строки, базовый уровень
  {
    title: 'Строки, базовый уровень',
    stage: 'Продвинутый',
    level: 'middle_cp',
    order_index: 27,
    prerequisites: ['Базовые структуры данных', 'Анализ алгоритмов'],
    article_url: null,
  },

  // Урок 28 — Хеширование строк
  {
    title: 'Хеширование строк',
    stage: 'Продвинутый',
    level: 'middle_cp',
    order_index: 28,
    prerequisites: ['Строки, базовый уровень', 'Базовая математика'],
    article_url: null,
  },

  // Урок 29 — Строковые структуры
  {
    title: 'Строковые структуры',
    stage: 'Продвинутый',
    level: 'middle_cp',
    order_index: 29,
    prerequisites: ['Хеширование строк'],
    article_url: null,
  },

  // Урок 30 — Запросы на отрезках
  {
    title: 'Запросы на отрезках',
    stage: 'Продвинутый',
    level: 'middle_cp',
    order_index: 30,
    prerequisites: ['Префиксные суммы', 'Динамическое программирование'],
    article_url: null,
  },

  // Урок 31 — Статические и корневые структуры
  {
    title: 'Статические и корневые структуры',
    stage: 'Продвинутый',
    level: 'middle_cp',
    order_index: 31,
    prerequisites: ['Запросы на отрезках'],
    article_url: null,
  },

  // Урок 32 — Геометрия
  {
    title: 'Геометрия',
    stage: 'Продвинутый',
    level: 'middle_cp',
    order_index: 32,
    prerequisites: ['Анализ алгоритмов', 'Базовая математика'],
    article_url: null,
  },

  // ─── ADVANCED CP (33–40+) ─────────────────────────────────────────────────

  // Урок 33 — Выпуклые оболочки
  {
    title: 'Выпуклые оболочки',
    stage: 'Мастер',
    level: 'advanced_cp',
    order_index: 33,
    prerequisites: ['Геометрия'],
    article_url: null,
  },

  // Урок 34 — Алгебра среднего уровня
  {
    title: 'Алгебра среднего уровня',
    stage: 'Мастер',
    level: 'advanced_cp',
    order_index: 34,
    prerequisites: ['Базовая математика', 'Динамическое программирование'],
    article_url: null,
  },

  // Урок 35 — Алгебра продвинутого уровня
  {
    title: 'Алгебра продвинутого уровня',
    stage: 'Мастер',
    level: 'advanced_cp',
    order_index: 35,
    prerequisites: ['Алгебра среднего уровня'],
    article_url: null,
  },

  // Урок 36 — Продвинутые графы
  {
    title: 'Продвинутые графы',
    stage: 'Мастер',
    level: 'advanced_cp',
    order_index: 36,
    prerequisites: ['DSU и остовные деревья', 'Кратчайшие пути', 'Динамическое программирование'],
    article_url: null,
  },

  // Урок 37 — Паросочетания
  {
    title: 'Паросочетания',
    stage: 'Мастер',
    level: 'advanced_cp',
    order_index: 37,
    prerequisites: ['Продвинутые графы'],
    article_url: null,
  },

  // Урок 38 — Потоки
  {
    title: 'Потоки',
    stage: 'Мастер',
    level: 'advanced_cp',
    order_index: 38,
    prerequisites: ['Паросочетания', 'Кратчайшие пути'],
    article_url: null,
  },

  // Урок 39 — Продвинутые алгоритмы на разбиении
  {
    title: 'Продвинутые алгоритмы на разбиении',
    stage: 'Мастер',
    level: 'advanced_cp',
    order_index: 39,
    prerequisites: ['Запросы на отрезках', 'Динамическое программирование', 'Корневые деревья'],
    article_url: null,
  },

  // Урок 40 — Продвинутые структуры данных
  {
    title: 'Продвинутые структуры данных',
    stage: 'Мастер',
    level: 'advanced_cp',
    order_index: 40,
    prerequisites: ['Запросы на отрезках', 'Корневые деревья'],
    article_url: null,
  },

  // Урок 41 — Продвинутые оптимизации динамики
  {
    title: 'Продвинутые оптимизации динамики',
    stage: 'Мастер',
    level: 'advanced_cp',
    order_index: 41,
    prerequisites: ['Динамическое программирование', 'Выпуклые оболочки'],
    article_url: null,
  },

  // Урок 42 — Очень поздние темы (факультативно)
  {
    title: 'Очень поздние темы',
    stage: 'Мастер',
    level: 'advanced_cp',
    order_index: 42,
    prerequisites: ['Продвинутые оптимизации динамики', 'Алгебра продвинутого уровня'],
    article_url: null,
  },

  // Урок 43 — Совсем в конец курса (факультативно)
  {
    title: 'Совсем в конец курса',
    stage: 'Мастер',
    level: 'advanced_cp',
    order_index: 43,
    prerequisites: ['Продвинутые алгоритмы на разбиении', 'Продвинутые структуры данных', 'Корневые деревья'],
    article_url: null,
  },
]

async function seed() {
  console.log('🌱 Seeding roadmap_topics...')

  // Clear existing topics first
  const { error: delError } = await supabase
    .from('roadmap_topics')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (delError) {
    console.warn('Warning clearing table:', delError.message)
  }

  const { data, error } = await supabase.from('roadmap_topics').insert(topics).select()

  if (error) {
    console.error('❌ Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`✅ Seeded ${data?.length ?? 0} topics successfully!`)
}

seed()

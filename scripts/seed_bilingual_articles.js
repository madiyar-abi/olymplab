const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx), line.slice(idx + 1).replace(/^['"]|['"]$/g, '')];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const GEMINI_API_KEY = env.GEMINI_API_KEY;

const TOPIC_TITLES_EN = {
  1: "Language Fundamentals (I/O, Types, Loops, Functions)",
  2: "Arrays and Strings",
  3: "Algorithm Complexity Analysis",
  4: "Basic Data Structures",
  5: "Simple Sorting Algorithms",
  6: "Advanced Sorting & Divide and Conquer",
  7: "Specialized Sorts (Counting & Radix)",
  8: "Binary Heap and Heapsort",
  9: "Prefix Sums and Difference Arrays",
  10: "Binary Search",
  11: "Binary Search on Answer",
  12: "Interactive Problems",
  13: "Coordinate Compression",
  14: "Arithmetic and Bit Manipulations",
  15: "Basic Number Theory & Modular Arithmetic",
  16: "Prime Numbers and Sieve Factorization",
  17: "Competitive Programming Techniques & Stress Testing",
  18: "Binary Search Trees and Ordered Sets",
  19: "Greedy Algorithms",
  20: "Graph Traversals (BFS and DFS)",
  21: "Fundamental Graph Problems",
  22: "Shortest Paths (Dijkstra, Floyd-Warshall)",
  23: "Disjoint Set Union and Minimum Spanning Trees",
  24: "Rooted Trees and LCA",
  25: "Dynamic Programming",
  26: "Game Theory and Sprague-Grundy",
  27: "String Algorithms: Basics",
  28: "String Hashing",
  29: "String Structures (Trie and Suffix Structures)",
  30: "Range Queries (Segment Trees and Fenwick)",
  31: "Static and SQRT Decompositions",
  32: "Computational Geometry",
  33: "Convex Hulls",
  34: "Intermediate Algebra & Matrix Exponentiation",
  35: "Advanced Algebra & FFT / NTT",
  36: "Advanced Graphs & 2-SAT",
  37: "Bipartite Matching & Kuhn's Algorithm",
  38: "Network Flows and Cut Algorithms",
  39: "Advanced Divide and Conquer & Centroid Decomposition",
  40: "Advanced Data Structures (Treap, Link-Cut Tree)",
  41: "Advanced Dynamic Programming Optimizations (CHT, Knuth)",
  42: "Specialized Topics (Heavy-Light Decomposition)",
  43: "Grandmaster Topics and Advanced Combinatorics"
};

// Rich articles for Topic 1
const TOPIC_1_RU = `## Основы языка C++ для олимпиадного программирования

Для успешного старта в спортивном программировании необходимо уверенно владеть базовым синтаксисом C++, знать фундаментальные типы данных, уметь организовать быстрый ввод-вывод и писать лаконичные функции.

---

### Быстрый ввод и вывод (Fast I/O)

По умолчанию потоки \`std::cin\` и \`std::cout\` синхронизированы со стандартными потоками C (\`scanf\` / \`printf\`). При чтении сотен тысяч чисел это приводит к Time Limit Exceeded.

В начале функции \`main\` всегда следует отключать синхронизацию:

\`\`\`cpp
#include <iostream>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (cin >> n) {
        // Решение задачи
    }
    return 0;
}
\`\`\`

> **Важно**: избегайте использования \`std::endl\` при выводе больших объемов данных, так как он принудительно сбрасывает буфер вывода (flush). Используйте символ перевода строки \`'\\n'\`.

---

### Примитивные типы данных и переполнения

В олимпиадном программировании выбор неправильного типа — частая причина неверных ответов (Wrong Answer):

1. **\`int\`**: Обычно 32-битный знаковый тип. Диапазон примерно от $-2 \\cdot 10^9$ до $2 \\cdot 10^9$.
2. **\`long long\`**: 64-битный знаковый тип. Диапазон примерно от $-9 \\cdot 10^{18}$ до $9 \\cdot 10^{18}$. Если сумма чисел или произведение может превысить $2 \\cdot 10^9$, используйте \`long long\`.
3. **\`double\` и \`long double\`**: Вещественные типы. Для задач с высокой точностью предпочтительнее \`long double\`. Сравнение вещественных чисел всегда выполняйте с эпсилон: \`abs(a - b) < 1e-9\`.
4. **\`bool\`**: Логический тип (\`true\` / \`false\`).

\`\`\`cpp
long long a = 1000000;
long long b = 1000000;
// Внимание: при a * b в int произойдет переполнение до присваивания!
long long product = a * b; // Корректно, так как операнды имеют тип long long
\`\`\`

---

### Условные конструкции и циклы

Базовые конструкции управления потоком:

\`\`\`cpp
// Цикл for с итерацией по диапазону
for (int i = 0; i < n; ++i) {
    // Операции
}

// Цикл while (удобно для считывания до конца файла)
int x;
while (cin >> x) {
    // Обработка очередного числа
}
\`\`\`

---

### Функции и передача параметров

Всегда передавайте тяжелые структуры данных (векторы, строки) по константной ссылке (\`const auto&\`), чтобы избежать лишнего копирования за $O(N)$:

\`\`\`cpp
#include <vector>
#include <string>

// Быстрая передача по константной ссылке
long long computeSum(const vector<int>& arr) {
    long long sum = 0;
    for (int x : arr) {
        sum += x;
    }
    return sum;
}
\`\`\`

Знание этих основ позволяет комфортно перейти к изучению массивов, векторов и алгоритмической сложности.
`;

const TOPIC_1_EN = `## C++ Language Fundamentals for Competitive Programming

To succeed in competitive programming, having a rock-solid command of C++ basics, fundamental data types, fast I/O practices, and efficient parameter passing is essential.

---

### Fast Input/Output (Fast I/O)

By default, \`std::cin\` and \`std::cout\` synchronize with the C runtime standard streams (\`scanf\` / \`printf\`). When reading or writing hundreds of thousands of integers, this overhead frequently causes Time Limit Exceeded (TLE).

Disable synchronization at the very beginning of \`main\`:

\`\`\`cpp
#include <iostream>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (cin >> n) {
        // Solution logic
    }
    return 0;
}
\`\`\`

> **Important**: Avoid using \`std::endl\` in performance-sensitive loops because it forces an output buffer flush on every call. Use the newline character \`'\\n'\` instead.

---

### Primitive Data Types and Overflow Prevention

Choosing an insufficient integer width is one of the most common causes of Wrong Answer (WA):

1. **\`int\`**: Typically 32-bit signed integer. Range is approximately $[-2 \\cdot 10^9, 2 \\cdot 10^9]$.
2. **\`long long\`**: 64-bit signed integer. Range is $[-9 \\cdot 10^{18}, 9 \\cdot 10^{18}]$. Whenever intermediate sums or products can exceed $2 \\cdot 10^9$, always use \`long long\`.
3. **\`double\` and \`long double\`**: Floating-point types. For geometric and high-precision calculations, \`long double\` is preferred. Always compare floats with an epsilon tolerance: \`abs(a - b) < 1e-9\`.
4. **\`bool\`**: Boolean values (\`true\` / \`false\`).

\`\`\`cpp
long long a = 1'000'000;
long long b = 1'000'000;
// Watch out: multiplying two 32-bit ints overflows before assignment!
long long product = a * b; // Correct, operands are already 64-bit
\`\`\`

---

### Control Flow and Loops

Essential loop patterns for contest environments:

\`\`\`cpp
// Standard index iteration
for (int i = 0; i < n; ++i) {
    // Process element
}

// Reading until End-of-File (EOF)
int x;
while (cin >> x) {
    // Process stream input
}
\`\`\`

---

### Functions and Parameter Passing

Pass heavy structures like strings and vectors by const reference (\`const auto&\`) to prevent costly $O(N)$ deep copies:

\`\`\`cpp
#include <vector>

long long computeSum(const std::vector<int>& arr) {
    long long sum = 0;
    for (int val : arr) {
        sum += val;
    }
    return sum;
}
\`\`\`

With these language foundations mastered, you are ready to explore vectors, dynamic arrays, and asymptotic complexity analysis.
`;

// Rich articles for Topic 12
const TOPIC_12_RU = `## Интерактивные задачи в олимпиадном программировании

_Интерактивная задача_ — это задача, в которой тестирующая система и решение взаимодействуют во время выполнения: программа делает запрос (выводит данные), а система отвечает на него (подает ответ на стандартный ввод).

Цель решения — угадать скрытую конфигурацию (число, перестановку, граф) за ограниченное число запросов.

---

### Главное правило: сброс буфера (Flush)

В стандартных задачах ввод и вывод буферизируются для ускорения. В интерактивных задачах, если вы не сбросите буфер вывода, тестирующая система не получит ваш запрос и зависнет в ожидании ответа. Это приведет к вердикту **Idleness Limit Exceeded** или **Time Limit Exceeded**.

Чтобы сбросить буфер:
- В C++ с \`std::cout\`: используйте \`std::cout << std::endl;\` (он выводит перевод строки и делает flush) либо \`std::cout << '\\n' << flush;\`.
- В C: \`fflush(stdout);\`.
- В Python: \`print(..., flush=True)\` или \`sys.stdout.flush()\`.

\`\`\`cpp
#include <iostream>
#include <string>

using namespace std;

int main() {
    // В интерактивных задачах sync_with_stdio можно оставить, но tie(NULL) не обязателен
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int low = 1, high = 1000000;
    int answer = -1;

    while (low <= high) {
        int mid = low + (high - low) / 2;

        // Отправляем запрос тестирующей системе
        cout << "? " << mid << endl; // endl автоматически вызывает flush!

        string response;
        cin >> response;

        if (response == "<") {
            high = mid - 1;
        } else if (response == ">=") {
            answer = mid;
            low = mid + 1;
        }
    }

    // Вывод окончательного ответа
    cout << "! " << answer << endl;
    return 0;
}
\`\`\`

---

### Анализ ограничений на запросы

Тестирующая система жестко ограничивает число запросов $Q$.
- Если $Q \\approx \\log_2 N$ (например, $Q = 30$ при $N = 10^9$) — задача решается бинарным поиском или тернарным поиском.
- Если $Q \\approx 2N$ — часто используется обход в глубину с оптимизацией парных запросов.
- Если $Q$ мало — используются адаптивные запросы, рандомизация или теория информации.

---

### Адаптивный тестировщик (Adaptive Interactor)

В некоторых задачах жюри использует «адаптивного» тестировщика: у него нет заранее зафиксированного ответа. Вместо этого после каждого вашего запроса тестировщик выбирает такой ответ, который оставляет максимально сложное для вас подмножество вариантов.

Для победы над адаптивным интерактором алгоритм должен гарантированно делить пространство допустимых состояний на равные части в худшем случае (принцип минимакса).
`;

const TOPIC_12_EN = `## Interactive Problems in Competitive Programming

An _interactive problem_ is a contest problem where your solution interacts with the grading system during runtime: your program issues a query via standard output, and the interactor writes its response to your standard input.

Your objective is typically to reconstruct a hidden state (a secret number, permutation, tree, or graph) while respecting a strict limit on the number of allowed queries.

---

### The Fundamental Rule: Flushing the Output Buffer

In standard batch problems, I/O is buffered in memory to maximize throughput. In interactive problems, if you don't explicitly flush the output stream, the judging program never receives your query and hangs waiting for input, resulting in **Idleness Limit Exceeded** or **Time Limit Exceeded**.

To properly flush the stream:
- In C++ using \`std::cout\`: use \`std::cout << std::endl;\` (which appends \`'\\n'\` and flushes the buffer) or \`std::cout << '\\n' << std::flush;\`.
- In C: \`fflush(stdout);\`.
- In Python: \`print(..., flush=True)\` or \`sys.stdout.flush()\`.

\`\`\`cpp
#include <iostream>
#include <string>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int low = 1, high = 1'000'000;
    int answer = -1;

    while (low <= high) {
        int mid = low + (high - low) / 2;

        // Query the interactor
        cout << "? " << mid << endl; // endl guarantees buffer flush

        string response;
        cin >> response;

        if (response == "<") {
            high = mid - 1;
        } else {
            answer = mid;
            low = mid + 1;
        }
    }

    // Output final verified answer
    cout << "! " << answer << endl;
    return 0;
}
\`\`\`

---

### Query Complexity Analysis

Judges enforce a strict maximum number of queries $Q$:
- If $Q \\approx \\log_2 N$ (e.g., $Q = 30$ for $N = 10^9$): Binary search or ternary search is intended.
- If $Q \\approx 2N$: Often a DFS traversal or pairing strategy that amortizes queries.
- If $Q$ is small and non-standard: Information-theoretic bounds, randomized queries, or divide-and-conquer partitions are required.

---

### Adaptive Interactors

In advanced contests (such as Codeforces or IOI), the interactor may be _adaptive_. An adaptive interactor does not commit to a specific hidden answer before the test starts. Instead, upon each of your queries, it chooses an answer that preserves as many candidates as possible to force the worst-case scenario.

To defend against an adaptive interactor, your algorithm must guarantee balanced state partitioning in the worst case (minimax optimization) rather than relying on average-case assumptions.
`;

async function translateMarkdownWithGemini(markdown, titleEn, retries = 3) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const prompt = `You are an expert competitive programming and computer science writer.
Translate the following Russian competitive programming article into clear, high-quality, professional English for topic: "${titleEn}".
Follow these rules strictly:
1. Preserve all markdown structure, headings (##, ###), lists, tables, bold, italics.
2. Preserve all LaTeX math expressions exactly as they are ($...$ and $$...$$).
3. Preserve all code snippets and programming languages exactly as they are.
4. Keep Russian author names or references accurate.
5. Translate all textual explanations naturally, accurately, and professionally.
6. Return ONLY the translated markdown text, with no surrounding explanations or quotes.

Article to translate:
${markdown}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2
        }
      })
    });

    if (res.status === 429) {
      console.log(`Rate limit hit on "${titleEn}". Waiting 25 seconds before retry ${attempt + 1}/${retries}...`);
      await new Promise(r => setTimeout(r, 25000));
      continue;
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    const text = parts?.find(p => !p.thought)?.text || parts?.slice(-1)[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }
    return text.trim();
  }
  throw new Error(`Exceeded max retries for ${titleEn}`);
}

async function run() {
  console.log('Fetching all roadmap topics from Supabase...');
  const { data: topics, error } = await supabase
    .from('roadmap_topics')
    .select('*')
    .order('order_index');

  if (error) {
    console.error('Failed to fetch topics:', error);
    process.exit(1);
  }

  console.log(`Found ${topics.length} topics. Processing updates...`);

  for (const topic of topics) {
    const idx = topic.order_index;
    const titleEn = TOPIC_TITLES_EN[idx] || topic.title;

    console.log(`\n--- Topic #${idx}: ${topic.title} -> ${titleEn} ---`);

    let updatePayload = {
      title_en: titleEn
    };

    if (idx === 1) {
      updatePayload.article_markdown = TOPIC_1_RU;
      updatePayload.article_markdown_en = TOPIC_1_EN;
      console.log('Setting curated RU and EN articles for Topic 1 (Language Fundamentals)');
    } else if (idx === 12) {
      updatePayload.article_markdown = TOPIC_12_RU;
      updatePayload.article_markdown_en = TOPIC_12_EN;
      console.log('Setting curated RU and EN articles for Topic 12 (Interactive Problems)');
    } else {
      // If already has English article, skip translation
      if (topic.article_markdown_en && topic.article_markdown_en.length > 100) {
        console.log(`Topic #${idx} already has English article (${topic.article_markdown_en.length} chars). Skipping translation.`);
      } else if (topic.article_markdown && topic.article_markdown.length > 50) {
        console.log(`Translating Topic #${idx} (${topic.article_markdown.length} chars) using Gemini 2.5 Flash...`);
        try {
          const enMarkdown = await translateMarkdownWithGemini(topic.article_markdown, titleEn);
          updatePayload.article_markdown_en = enMarkdown;
          console.log(`Successfully translated topic #${idx} (${enMarkdown.length} chars).`);
        } catch (err) {
          console.error(`Error translating topic #${idx}:`, err.message);
        }
      }
    }

    const { error: updateError } = await supabase
      .from('roadmap_topics')
      .update(updatePayload)
      .eq('id', topic.id);

    if (updateError) {
      console.error(`Failed to update topic #${idx}:`, updateError);
    } else {
      console.log(`Successfully saved topic #${idx} to Supabase.`);
    }

    // Brief delay to be courteous with rate limits
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\nAll topics processed successfully!');
}

run();

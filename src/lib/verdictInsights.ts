import { Verdict } from '@/types/verdict';

export interface VerdictStat {
  verdict: Verdict;
  count: number;
  percentage: number;
}

export interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

export function generateVerdictInsights(stats: VerdictStat[]): Insight[] {
  const insights: Insight[] = [];
  const totalSubmissions = stats.reduce((acc, curr) => acc + curr.count, 0);

  if (totalSubmissions === 0) {
    return [
      {
        type: 'info',
        title: 'Start Solving!',
        message: 'Complete your first problem to unlock personalized performance insights.',
      },
    ];
  }

  const findStat = (v: Verdict) => stats.find((s) => s.verdict === v);

  const acStat = findStat(Verdict.AC);
  const waStat = findStat(Verdict.WA);
  const tleStat = findStat(Verdict.TLE);
  const mleStat = findStat(Verdict.MLE);
  const reStat = findStat(Verdict.RE);

  const acRate = acStat?.percentage || 0;
  const waRate = waStat?.percentage || 0;
  const tleRate = tleStat?.percentage || 0;
  const mleRate = mleStat?.percentage || 0;
  const reRate = reStat?.percentage || 0;

  // AC Success
  if (acRate > 60) {
    insights.push({
      type: 'success',
      title: 'Excellent Accuracy',
      message: 'You write robust and clean code. Your success rate is significantly above average.',
    });
  } else if (acRate < 30 && totalSubmissions > 5) {
    insights.push({
      type: 'info',
      title: 'Focus on Fundamentals',
      message: 'Your accuracy is lower than ideal. Try solving "Easy" problems to build confidence and better coding habits.',
    });
  }

  // TLE Warning
  if (tleRate > 30) {
    insights.push({
      type: 'warning',
      title: 'High Time Limit Exceeded Rate',
      message: 'You often write inefficient algorithms. Focus on Big O notation and look for ways to optimize nested loops ($O(N^2) \\rightarrow O(N \\log N)$).',
    });
  }

  // WA Warning
  if (waRate > 40) {
    insights.push({
      type: 'warning',
      title: 'High Wrong Answer Rate',
      message: 'You might be missing edge cases or facing integer overflow issues. Test with extreme constraints before submitting.',
    });
  }

  // MLE/RE Info
  if (mleRate > 15) {
    insights.push({
      type: 'warning',
      title: 'Memory Management Issues',
      message: 'Your solutions use too much memory. Check for unnecessary large arrays or deep recursion that could be converted to iteration.',
    });
  }

  if (reRate > 20) {
    insights.push({
      type: 'warning',
      title: 'Frequent Runtime Errors',
      message: 'Your code is crashing. Common causes include out-of-bounds array access, null pointer dereference, or stack overflow.',
    });
  }

  // Default if no specific insights
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'Steady Progress',
      message: 'Keep solving problems! As you submit more, I will be able to provide deeper analysis of your coding patterns.',
    });
  }

  return insights;
}

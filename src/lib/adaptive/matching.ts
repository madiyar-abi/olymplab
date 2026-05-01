import { SkillAxes } from '@/types/database';

export type UserSkills = Record<SkillAxes, number>;
export type ProblemRequirements = Record<SkillAxes, { level: number; weight: number }>;

export interface ProblemCandidate {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  requirements: ProblemRequirements;
}

/**
 * Calculates the mathematical flow state match score based on weighted distance.
 * $score(u, t) = \sum_{i} w_i \cdot |u_i - t_i|$
 * Lower score implies a closer match to the user's flow state.
 */
export function calculateMatchScore(
  userSkills: Partial<UserSkills>,
  problemRequirements: ProblemRequirements
): number {
  let score = 0;

  for (const axis of Object.keys(problemRequirements) as SkillAxes[]) {
    const req = problemRequirements[axis];
    if (!req) continue;

    const userSkillLevel = userSkills[axis] || 0;
    const { level: targetLevel, weight } = req;

    const distance = Math.abs(userSkillLevel - targetLevel);
    score += weight * distance;
  }

  return score;
}

/**
 * Filters and sorts problems by the flow state match score.
 * Retains problems where the user covers a significant portion of requirements,
 * allowing slight over-reaching (10-30% above user level) for optimal challenge.
 */
export function getRecommendedProblems(
  userSkills: Partial<UserSkills>,
  allProblems: ProblemCandidate[]
): ProblemCandidate[] {
  // 1. Map problems to include their match score
  const scoredProblems = allProblems.map(problem => {
    return {
      problem,
      score: calculateMatchScore(userSkills, problem.requirements)
    };
  });

  // 2. Filter out problems that are drastically too hard or trivially easy.
  //    A heuristic filter: we check how many axes the user is significantly lacking in.
  const filteredProblems = scoredProblems.filter(({ problem }) => {
    let severeDeficits = 0;
    let completelyMastered = 0;
    const requirements = problem.requirements;
    const axes = Object.keys(requirements) as SkillAxes[];

    if (axes.length === 0) return false; // Invalid problem without requirements

    axes.forEach(axis => {
      const targetLevel = requirements[axis].level;
      const userLevel = userSkills[axis] || 0;

      // If problem requires a level 30+ points higher than user, it's a severe deficit
      if (targetLevel > userLevel + 30) {
        severeDeficits++;
      }
      
      // If user is > 20 points above the target level, it's completely mastered
      if (userLevel >= targetLevel + 20) {
        completelyMastered++;
      }
    });

    // We want the user to cover 70-90% of requirements, meaning:
    // - Not too many severe deficits (e.g., if > 1 severe deficit, it's too hard)
    // - Not completely mastered across all required axes (trivial)
    if (severeDeficits > 1) return false;
    if (completelyMastered === axes.length && axes.length > 0) return false;

    return true;
  });

  // 3. Sort by match score (lowest score = best match)
  filteredProblems.sort((a, b) => a.score - b.score);

  return filteredProblems.map(fp => fp.problem);
}

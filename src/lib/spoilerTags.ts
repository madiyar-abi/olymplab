/**
 * Utility to generate pseudo-random placeholder tags for spoiler protection.
 *
 * Prevents revealing the actual number and lengths of tags before the user
 * reveals or solves the problem, eliminating fear of problems with many tags.
 */

const FAKE_TAG_POOL = [
  'dp',
  'math',
  'trees',
  'graphs',
  'greedy',
  'search',
  'number',
  'matrix',
  'divide',
  'bitwise',
  'dynamic',
  'sorting',
  'geometry',
  'analysis',
  'recursion',
  'structure',
  'combinatorics',
  'constructive',
]

export function getSpoilerPlaceholderTags(seed: string): string[] {
  if (!seed) return ['algorithm', 'structure']

  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }

  // Generate 2 or 3 fake tags per problem
  const count = 2 + (hash % 2)

  const tags: string[] = []
  for (let i = 0; i < count; i++) {
    const index = (hash + i * 11) % FAKE_TAG_POOL.length
    tags.push(FAKE_TAG_POOL[index])
  }

  return tags
}

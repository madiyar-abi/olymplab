import crypto from 'crypto'

/**
 * Generates the SHA-512 signature required for authenticated Codeforces API requests.
 */
export function generateCfSignature(
  methodName: string,
  params: Record<string, string | number>,
  apiKey: string,
  apiSecret: string
): string {
  // 1. Generate 6-character random string
  const rand = crypto.randomBytes(3).toString('hex')

  // 2. Sort params alphabetically by key
  const sortedKeys = Object.keys(params).sort()

  // 3. Construct query string
  // Note: Codeforces expects standard URL encoding
  const queryParts = sortedKeys.map((key) => {
    return `${key}=${encodeURIComponent(String(params[key]))}`
  })
  const queryString = queryParts.join('&')

  // 4. Construct base string
  const baseString = `${rand}/${methodName}?${queryString}#${apiSecret}`

  // 5. Hash using SHA-512
  const hash = crypto.createHash('sha512').update(baseString).digest('hex')

  // 6. Final signature
  return `${rand}${hash}`
}

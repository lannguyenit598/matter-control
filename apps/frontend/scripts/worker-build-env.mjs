/** @param {string} key */
export function isRuntimeSecretKey(key) {
  return /TOKEN|SECRET|PASSWORD|CREDENTIAL|PRIVATE|DATABASE_URL|DATABASE_DSN|API_KEY|BFF_STATE_KEYS|BFF_DATABASE_CA/.test(
    key,
  )
}

/** @param {string} text @returns {string | null} */
export function findRuntimeSecret(text) {
  for (const line of text.split('\n')) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
    if (match && isRuntimeSecretKey(match[1]) && !['', '""', "''"].includes(match[2].trim()))
      return match[1]
  }
  return null
}

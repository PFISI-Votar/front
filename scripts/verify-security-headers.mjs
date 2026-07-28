const PREVIEW_URL = process.env.SECURITY_HEADERS_URL ?? 'http://localhost:4173/'
const REQUIRED_HEADERS = {
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
}

const assertHeader = (headers, name, expectedValue) => {
  const actual = headers.get(name)
  if (!actual) {
    throw new Error(`Missing required header: ${name}`)
  }
  if (expectedValue && actual.toLowerCase() !== expectedValue.toLowerCase()) {
    throw new Error(
      `Unexpected ${name}: expected "${expectedValue}", got "${actual}"`,
    )
  }
}

const main = async () => {
  const response = await fetch(PREVIEW_URL, { redirect: 'follow' })
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${PREVIEW_URL}: ${response.status} ${response.statusText}`,
    )
  }

  for (const [name, expectedValue] of Object.entries(REQUIRED_HEADERS)) {
    assertHeader(response.headers, name, expectedValue)
  }

  const csp = response.headers.get('content-security-policy')
  if (!csp?.includes("frame-ancestors 'none'")) {
    throw new Error('CSP must include frame-ancestors none')
  }

  console.log(`Security headers verified for ${PREVIEW_URL}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

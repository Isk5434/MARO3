export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function assetPath(path: string) {
  const normalizedPath = path.replace(/^\/+/, '')
  return `${BASE_PATH}/${normalizedPath}`
}

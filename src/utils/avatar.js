export function avatarUrl(user) {
  if (!user) return ''
  const url = user.avatarUrl || user.avatar || ''
  if (url.includes('pravatar') || url.includes('gravatar')) return ''
  return url
}

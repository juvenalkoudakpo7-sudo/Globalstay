const storagePrefix = 'globalstay:'

export function loadLocal<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(`${storagePrefix}${key}`)
    return stored === null ? fallback : (JSON.parse(stored) as T)
  } catch {
    return fallback
  }
}

export function saveLocal<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value))
  } catch {
    return
  }
}
export function getOpenRouterKey() {
  return (
    import.meta.env.VITE_OPENROUTER_API_KEY ||
    import.meta.env.VITE_OPENROUTER_KEY ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('openrouter_key') : '') ||
    ''
  ).trim()
}

export function getGroqKey() {
  return (
    import.meta.env.VITE_GROQ_KEY ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('groq_key') : '') ||
    ''
  ).trim()
}

export function getGeminiKey() {
  return (
    import.meta.env.VITE_GEMINI_KEY ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_key') : '') ||
    ''
  ).trim()
}

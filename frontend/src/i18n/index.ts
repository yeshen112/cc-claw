import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './locales/zh.json'

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
  },
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
})

export default i18n

/** Change language and persist to localStorage */
export function setLanguage(lng: string) {
  i18n.changeLanguage(lng)
  localStorage.setItem('cc-claw-lang', lng)
}

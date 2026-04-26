import { readFileSync, readdirSync } from 'fs'
import path from 'path'

const DESKTOP_PATH = '/Users/federicoterrazas/Desktop/perritos'
const CSV_FILE = path.join(DESKTOP_PATH, 'Casa Refugio 2026 - Perros del refu.csv')
const PHOTOS_BASE_DIR = path.join(DESKTOP_PATH, 'PERROS REFU CASA')

function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function parseCSVToObjects(text) {
  const result = []
  let row = [], inQuotes = false, cur = ''
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"' && text[i + 1] === '"') { cur += '"'; i++ }
    else if (c === '"') { inQuotes = !inQuotes }
    else if (c === ',' && !inQuotes) { row.push(cur); cur = '' }
    else if (c === '\n' && !inQuotes) { row.push(cur); result.push(row); row = []; cur = '' }
    else if (c !== '\r') { cur += c }
  }
  if (cur || row.length) { row.push(cur); result.push(row) }
  if (result.length < 2) return []
  const headers = result[1].map(h => h.trim()) // Headers are in second line
  return result.slice(2).map(row => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = row[i]?.trim() ?? '' })
    return obj
  })
}

const csvData = parseCSVToObjects(readFileSync(CSV_FILE, 'utf8')).filter(p => p.Perro && p.Perro.length < 30)
const folders = readdirSync(PHOTOS_BASE_DIR).filter(f => !f.startsWith('.') && !f.includes('.'))

const NAME_MAPPING = {
  'Oli': 'OLIVIA',
  'Mila': 'MILANESA',
  'Morci': 'MORCILLA',
  'Sonri': 'SONRISA',
  'Negri': 'NEGRITO'
}

const matched = []
const unmatchedCsv = []

csvData.forEach(p => {
  const name = p.Perro
  const normalizedName = removeAccents(name).toUpperCase()
  const folderName = NAME_MAPPING[name] || normalizedName
  
  if (folders.includes(folderName)) {
    matched.push({ name, folderName })
  } else {
    unmatchedCsv.push(name)
  }
})

const matchedFolders = matched.map(m => m.folderName)
const unmatchedFolders = folders.filter(f => !matchedFolders.includes(f))

console.log('\n--- PERROS EN EXCEL QUE NO TIENEN FOTO (NO SE CARGAN) ---')
console.log(Array.from(new Set(unmatchedCsv)).join(', '))

console.log('\n--- CARPETAS DE FOTOS QUE NO ESTÁN EN EL EXCEL (NO SE CARGAN) ---')
console.log(unmatchedFolders.join(', '))

console.log(`\nTOTAL A CARGAR: ${matched.length} perros.`)

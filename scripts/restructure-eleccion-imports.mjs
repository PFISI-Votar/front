import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const dirs = [join(root, 'src/features/eleccion')]

const replacements = [
  [
    '@/features/eleccion/api/lista-api',
    '@/features/eleccion/lista/api/lista-api',
  ],
  [
    '@/features/eleccion/api/candidato-api',
    '@/features/eleccion/candidato/api/candidato-api',
  ],
  [
    '@/features/eleccion/api/configuracion-datos-candidato-api',
    '@/features/eleccion/candidato/api/configuracion-datos-candidato-api',
  ],
  [
    '@/features/eleccion/components/comicio-frozen-guard',
    '@/features/eleccion/shared/components/comicio-frozen-guard',
  ],
  [
    '@/features/eleccion/components/candidato-form',
    '@/features/eleccion/candidato/components/candidato-form',
  ],
  [
    '@/features/eleccion/components/comicios-list',
    '@/features/eleccion/components/comicios-list',
  ],
  ["from '../data/schema'", "from '@/features/eleccion/data/schema'"],
  [
    "from '../api/eleccion-api'",
    "from '@/features/eleccion/api/eleccion-api'",
  ],
  [
    "from '../api/lista-api'",
    "from '@/features/eleccion/lista/api/lista-api'",
  ],
  [
    "from '../api/candidato-api'",
    "from '@/features/eleccion/candidato/api/candidato-api'",
  ],
  [
    "from '../api/configuracion-datos-candidato-api'",
    "from '@/features/eleccion/candidato/api/configuracion-datos-candidato-api'",
  ],
  [
    "from '../utils/format-datos-adicionales'",
    "from '@/features/eleccion/candidato/utils/format-datos-adicionales'",
  ],
  [
    "from '../utils/slugify-etiqueta-clave'",
    "from '@/features/eleccion/candidato/utils/slugify-etiqueta-clave'",
  ],
  [
    "from './components/oferta-electoral-panel'",
    "from '@/features/eleccion/lista/components/oferta-electoral-panel'",
  ],
  [
    "from './components/lista-detail-panel'",
    "from '@/features/eleccion/lista/components/lista-detail-panel'",
  ],
  [
    "from './components/create-comicio-form'",
    "from '@/features/eleccion/components/create-comicio-form'",
  ],
  [
    "from './configuracion-datos-candidato-panel'",
    "from '@/features/eleccion/candidato/components/configuracion-datos-candidato-panel'",
  ],
  [
    "from './lista-form-dialog'",
    "from '@/features/eleccion/lista/components/lista-form-dialog'",
  ],
  [
    "from './candidato-campos-dinamicos'",
    "from '@/features/eleccion/candidato/components/candidato-campos-dinamicos'",
  ],
]

const walk = (dir, files = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walk(full, files)
    } else if (/\.(ts|tsx)$/.test(full)) {
      files.push(full)
    }
  }
  return files
}

for (const dir of dirs) {
  for (const file of walk(dir)) {
    let content = readFileSync(file, 'utf8')
    let changed = false

    for (const [from, to] of replacements) {
      if (from !== to && content.includes(from)) {
        content = content.split(from).join(to)
        changed = true
      }
    }

    if (changed) {
      writeFileSync(file, content)
      console.log('updated', file.replace(root + '/', ''))
    }
  }
}

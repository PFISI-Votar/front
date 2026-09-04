import { Command, Vote, ScrollText, Settings } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Administrador',
    email: 'admin@votar.local',
    avatar: '/avatars/01.png',
  },
  teams: [
    {
      name: 'VOTAR',
      logo: Command,
      plan: 'Five Stack - UTN FRVM',
    },
  ],
  navGroups: [
    {
      items: [
        {
          title: 'Comicios',
          icon: Vote,
          items: [
            {
              title: 'Nuevo comicio',
              url: '/comicios/nuevo',
            },
            {
              title: 'Ver comicios',
              url: '/comicios',
            },
          ],
        },
        {
          title: 'Auditoría',
          url: '/auditoria',
          icon: ScrollText,
        },
        {
          title: 'Configuración',
          icon: Settings,
          items: [
            {
              title: 'Configuración institucional',
              url: '/configuracion',
            },
            {
              title: 'Seguridad',
              url: '/configuracion/seguridad',
            },
          ],
        },
      ],
    },
  ],
}

import { Command, Vote, ScrollText } from 'lucide-react'
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
      title: 'General',
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
      ],
    },
  ],
}

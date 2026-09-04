import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

type ContentSectionProps = {
  title: string
  desc: string
  children: React.JSX.Element
  /** Ancho del contenido. Por defecto se limita a `xl` (settings). */
  contentWidth?: 'default' | 'wide'
  /**
   * Gradiente inferior del área scrolleable.
   * Desactivar en formularios con acciones al final para evitar el blur
   * inconsistente sobre Cancelar / Submit (VOTAR-477).
   */
  fadeBottom?: boolean
}

export function ContentSection({
  title,
  desc,
  children,
  contentWidth = 'default',
  fadeBottom = true,
}: ContentSectionProps) {
  return (
    <div className='flex flex-1 flex-col'>
      <div className='flex-none'>
        <h3 className='text-lg font-medium'>{title}</h3>
        <p className='text-sm text-muted-foreground'>{desc}</p>
      </div>
      <Separator className='my-4 flex-none' />
      <div
        className={cn(
          'h-full w-full overflow-y-auto scroll-smooth pe-4 pb-12',
          fadeBottom && 'faded-bottom'
        )}
        data-fade-bottom={fadeBottom ? 'true' : 'false'}
      >
        <div
          className={cn(
            '-mx-1 px-1.5',
            contentWidth === 'wide' ? 'max-w-4xl' : 'lg:max-w-xl'
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { ContentSection } from './content-section'

describe('ContentSection', () => {
  it('aplica el fade inferior por defecto (settings)', async () => {
    const { getByText, container } = await render(
      <ContentSection title='Perfil' desc='Datos de la cuenta'>
        <p>Contenido</p>
      </ContentSection>
    )

    await expect.element(getByText('Perfil')).toBeInTheDocument()
    await expect
      .element(getByText('Datos de la cuenta'))
      .toBeInTheDocument()

    const scrollArea = container.querySelector('[data-fade-bottom]')
    expect(scrollArea).not.toBeNull()
    expect(scrollArea?.getAttribute('data-fade-bottom')).toBe('true')
    expect(scrollArea?.classList.contains('faded-bottom')).toBe(true)
  })

  it('omite el fade inferior cuando fadeBottom es false (formularios con acciones)', async () => {
    const { getByRole, container } = await render(
      <ContentSection
        title='Configuración inicial'
        desc='Complete los campos'
        contentWidth='wide'
        fadeBottom={false}
      >
        <div>
          <button type='button'>Cancelar</button>
          <button type='submit'>Crear comicio</button>
        </div>
      </ContentSection>
    )

    await expect
      .element(getByRole('button', { name: 'Cancelar' }))
      .toBeInTheDocument()
    await expect
      .element(getByRole('button', { name: 'Crear comicio' }))
      .toBeInTheDocument()

    const scrollArea = container.querySelector('[data-fade-bottom]')
    expect(scrollArea).not.toBeNull()
    expect(scrollArea?.getAttribute('data-fade-bottom')).toBe('false')
    expect(scrollArea?.classList.contains('faded-bottom')).toBe(false)
  })
})

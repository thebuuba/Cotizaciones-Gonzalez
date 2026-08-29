import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { BusinessProfileForm } from './BusinessProfileForm'

describe('BusinessProfileForm', () => {
  it('keeps values and shows nearby errors when required identity is missing', async () => {
    const user = userEvent.setup()
    render(<BusinessProfileForm onSave={vi.fn()} />)

    await user.type(screen.getByLabelText('Teléfono'), '809-555-0101')
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }))

    expect(screen.getByText('Escribe el nombre del negocio.')).toBeInTheDocument()
    expect(screen.getByText('Escribe el nombre del propietario.')).toBeInTheDocument()
    expect(screen.getByLabelText('Teléfono')).toHaveValue('809-555-0101')
  })

  it('submits a complete business profile', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<BusinessProfileForm onSave={onSave} />)

    await user.type(screen.getByLabelText('Nombre del negocio'), 'Construcciones González')
    await user.type(screen.getByLabelText('Propietario'), 'José González')
    await user.type(screen.getByLabelText('Teléfono'), '809-555-0101')
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ businessName: 'Construcciones González', ownerName: 'José González' }))
  })

  it('includes the selected logo and signature in the saved profile', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<BusinessProfileForm onSave={onSave} />)
    await user.type(screen.getByLabelText('Nombre del negocio'), 'Construcciones González')
    await user.type(screen.getByLabelText('Propietario'), 'José González')
    const logo = new File(['logo'], 'logo.png', { type: 'image/png' })
    const signature = new File(['firma'], 'firma.png', { type: 'image/png' })
    await user.upload(screen.getByLabelText('Logo'), logo)
    await user.upload(screen.getByLabelText('Firma'), signature)
    await user.click(screen.getByRole('button', { name: 'Guardar perfil' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ logoBlob: logo, signatureBlob: signature }))
  })
})

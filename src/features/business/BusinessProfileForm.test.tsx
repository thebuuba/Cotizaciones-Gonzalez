import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { quotationSnapshotFactory } from '../../test/factories'
import { BusinessProfileForm, type BusinessProfileFormValue } from './BusinessProfileForm'

const initialValue = (): BusinessProfileFormValue => {
  const business = quotationSnapshotFactory().business
  return {
    businessName: business.businessName,
    tagline: business.tagline,
    headerPhone: business.headerPhone,
    terms: business.terms,
    bankAccounts: business.bankAccounts,
    managerName: business.managerName,
    managerTitle: business.managerTitle,
    directPhone: business.directPhone,
    whatsappPhone: business.whatsappPhone,
    footerQuality: business.footerQuality,
    footerCommitment: business.footerCommitment,
    footerFaith: business.footerFaith,
    logoBlob: business.logoBlob,
    stampBlob: business.stampBlob,
  }
}

describe('BusinessProfileForm', () => {
  it('shows every configurable section from the physical sheet', () => {
    render(<BusinessProfileForm initialValue={initialValue()} onSave={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Marca' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Contacto' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Términos y condiciones' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cuentas bancarias' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pie de página' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('9604220069')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Guardar' })).not.toBeInTheDocument()
  })

  it('keeps values and reports required business and manager names', async () => {
    const user = userEvent.setup()
    render(<BusinessProfileForm initialValue={initialValue()} onSave={vi.fn()} />)

    await user.clear(screen.getByLabelText('Nombre'))
    await user.clear(screen.getByLabelText('Gerente'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getAllByText('Escribe el nombre del negocio.')).toHaveLength(2)
    expect(screen.getAllByText('Escribe el nombre del gerente.')).toHaveLength(2)
    expect(screen.getByRole('alert')).toHaveTextContent('Escribe el nombre del negocio.')
    expect(screen.getByRole('alert')).toHaveTextContent('Escribe el nombre del gerente.')
    expect(screen.getByRole('alert')).toHaveFocus()
    expect(screen.getByLabelText('WhatsApp')).toHaveValue('849-379-7731')
  })

  it('submits edited accounts with selected logo and stamp', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<BusinessProfileForm initialValue={initialValue()} onSave={onSave} />)
    const logo = new File(['logo'], 'logo.png', { type: 'image/png' })
    const stamp = new File(['sello'], 'sello.png', { type: 'image/png' })

    await user.clear(screen.getByLabelText('Número de cuenta 1'))
    await user.type(screen.getByLabelText('Número de cuenta 1'), '123456')
    await user.upload(screen.getByLabelText('Logo'), logo)
    await user.upload(screen.getByLabelText('Sello'), stamp)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      bankAccounts: [expect.objectContaining({ number: '123456' })],
      logoBlob: logo,
      stampBlob: stamp,
    }))
  })

  it('shows progress and confirms when settings are saved', async () => {
    const user = userEvent.setup()
    let finishSave: (() => void) | undefined
    const onSave = vi.fn(() => new Promise<void>((resolve) => { finishSave = resolve }))
    render(<BusinessProfileForm initialValue={initialValue()} onSave={onSave} />)

    await user.type(screen.getByLabelText('Lema principal'), ' actualizado')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByRole('button', { name: 'Guardando' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Guardando')

    finishSave?.()

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Cambios guardados'))
    expect(screen.queryByRole('button', { name: 'Guardar' })).not.toBeInTheDocument()
  })

  it('announces a save failure and allows retrying', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue(new Error('network'))
    render(<BusinessProfileForm initialValue={initialValue()} onSave={onSave} />)

    await user.type(screen.getByLabelText('Lema principal'), ' actualizado')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar')
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
  })
})

import { render, screen } from '@testing-library/react'
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
    expect(screen.getByRole('heading', { name: 'Términos y condiciones' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cuentas bancarias' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Gerente y teléfonos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pie de página' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('9604220069')).toBeInTheDocument()
  })

  it('keeps values and reports required business and manager names', async () => {
    const user = userEvent.setup()
    const value = initialValue()
    value.businessName = ''
    value.managerName = ''
    render(<BusinessProfileForm initialValue={value} onSave={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Guardar ajustes' }))

    expect(screen.getByText('Escribe el nombre del negocio.')).toBeInTheDocument()
    expect(screen.getByText('Escribe el nombre del gerente.')).toBeInTheDocument()
    expect(screen.getByLabelText('Teléfono de WhatsApp')).toHaveValue('849-379-7731')
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
    await user.click(screen.getByRole('button', { name: 'Guardar ajustes' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      bankAccounts: [expect.objectContaining({ number: '123456' })],
      logoBlob: logo,
      stampBlob: stamp,
    }))
  })
})

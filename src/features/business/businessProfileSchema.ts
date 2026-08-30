import { z } from 'zod'

const bankAccountSchema = z.object({
  id: z.string().min(1),
  bank: z.string().trim().min(1, 'Escribe el nombre del banco.'),
  type: z.string().trim().min(1, 'Escribe el tipo de cuenta.'),
  number: z.string().trim().min(1, 'Escribe el número de cuenta.'),
})

export const businessProfileSchema = z.object({
  businessName: z.string().trim().min(1, 'Escribe el nombre del negocio.'),
  tagline: z.string().trim(),
  headerPhone: z.string().trim(),
  terms: z.array(z.string().trim().min(1, 'El término no puede estar vacío.')).min(1),
  bankAccounts: z.array(bankAccountSchema).min(1),
  managerName: z.string().trim().min(1, 'Escribe el nombre del gerente.'),
  managerTitle: z.string().trim(),
  directPhone: z.string().trim(),
  whatsappPhone: z.string().trim(),
  footerQuality: z.string().trim(),
  footerCommitment: z.string().trim(),
  footerFaith: z.string().trim(),
})

export type BusinessProfileDraft = z.infer<typeof businessProfileSchema>

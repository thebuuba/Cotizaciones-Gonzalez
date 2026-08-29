import { z } from 'zod'

export const businessProfileSchema = z.object({
  businessName: z.string().trim().min(1, 'Escribe el nombre del negocio.'),
  ownerName: z.string().trim().min(1, 'Escribe el nombre del propietario.'),
  phone: z.string().trim(), email: z.string().trim().email('Escribe un correo válido.').or(z.literal('')), address: z.string().trim(),
})
export type BusinessProfileDraft = z.infer<typeof businessProfileSchema>

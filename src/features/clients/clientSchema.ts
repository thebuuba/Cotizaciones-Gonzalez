import { z } from 'zod'
export const clientSchema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre del cliente.'), phone: z.string().trim(),
  email: z.string().trim().email('Escribe un correo válido.').or(z.literal('')), address: z.string().trim(),
  locations: z.array(z.object({ label: z.string().trim(), address: z.string().trim() })).min(1),
})
export type ClientDraft = z.infer<typeof clientSchema>

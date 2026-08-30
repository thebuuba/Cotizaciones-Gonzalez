import { db } from '../db/database'
import { DexieBusinessProfileRepository, DexieClientRepository, DexieQuotationRepository } from '../db/repositories'
export const quotationRepository = new DexieQuotationRepository(db)
export const businessProfileRepository = new DexieBusinessProfileRepository(db)
export const clientRepository = new DexieClientRepository(db)

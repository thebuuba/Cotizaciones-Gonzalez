import { db } from '../db/database'
import { DexieBusinessProfileRepository, DexieQuotationRepository } from '../db/repositories'
export const quotationRepository = new DexieQuotationRepository(db)
export const businessProfileRepository = new DexieBusinessProfileRepository(db)

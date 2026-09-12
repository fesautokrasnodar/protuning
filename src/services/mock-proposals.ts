import type { Proposal, ProposalStatus } from '@/types'
import { buildSnapshotItems, computeTotals } from '@/lib/calc'
import { DomainError, type CreateProposalData, type ProposalsProvider } from '@/services/module'
import { commitDb, loadDb, nowIso, uid, type DbShape } from '@/lib/mock/db'

function pad(n: number): string {
  return String(n).padStart(3, '0')
}

function formatNumber(year: number, n: number): string {
  return `КП-${year}-${pad(n)}`
}

function takeSequence(db: DbShape, year: number): string {
  const next = (db.counters[year] ?? 0) + 1
  db.counters[year] = next
  return formatNumber(year, next)
}

function applyCreateData(
  db: DbShape,
  existing: Proposal | null,
  data: CreateProposalData,
): Proposal {
  const id = existing?.id ?? uid('prop')
  const t = nowIso()
  const totals = computeTotals(
    data.selection.map((s) => s.price),
    data.discount,
  )
  const items = buildSnapshotItems(id, data.selection)
  return {
    id,
    number: existing?.number ?? takeSequence(db, new Date().getFullYear()),
    carId: data.carId,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    clientEmail: data.clientEmail,
    status: data.status,
    subtotal: totals.subtotal,
    discount: totals.discount,
    total: totals.total,
    createdBy: data.createdBy,
    createdAt: existing?.createdAt ?? t,
    updatedAt: t,
    items,
  }
}

export const mockProposalsProvider: ProposalsProvider = {
  async list() {
    return loadDb().proposals
  },
  async get(id) {
    return loadDb().proposals.find((p) => p.id === id) ?? null
  },
  async create(data) {
    const db = loadDb()
    const proposal = applyCreateData(db, null, data)
    db.proposals.push(proposal)
    commitDb(db)
    return proposal
  },
  async update(id, data) {
    const db = loadDb()
    const index = db.proposals.findIndex((p) => p.id === id)
    if (index === -1) throw new DomainError('КП не найдено', 'NOT_FOUND')
    db.proposals[index] = applyCreateData(db, db.proposals[index] ?? null, data)
    commitDb(db)
    return db.proposals[index] as Proposal
  },
  async updateStatus(id, status: ProposalStatus) {
    const db = loadDb()
    const p = db.proposals.find((x) => x.id === id)
    if (!p) throw new DomainError('КП не найдено', 'NOT_FOUND')
    p.status = status
    p.updatedAt = nowIso()
    commitDb(db)
    return p
  },
  async remove(id) {
    const db = loadDb()
    db.proposals = db.proposals.filter((p) => p.id !== id)
    commitDb(db)
  },
  nextNumber(year) {
    const db = loadDb()
    return formatNumber(year, (db.counters[year] ?? 0) + 1)
  },
}
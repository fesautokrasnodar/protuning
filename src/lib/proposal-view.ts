import type { Car, Proposal } from '@/types'
import type { ProposalViewData } from '@/components/proposal/proposal-document'
import { carLabel } from '@/lib/calc'
import { formatRub } from '@/lib/money'

export function formatProposalDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU')
}

/** Построить view-модель КП для документа (снапшот items). */
export function proposalToView(proposal: Proposal, car: Car | null | undefined): ProposalViewData {
  return {
    number: proposal.number,
    date: formatProposalDate(proposal.createdAt),
    carLabel: car ? carLabel(car) : 'Автомобиль',
    carPhotoUrl: car?.photoUrl ?? null,
    clientName: proposal.clientName,
    clientPhone: proposal.clientPhone,
    clientEmail: proposal.clientEmail,
    items: proposal.items.map((it, i) => ({ num: i + 1, name: it.serviceName, price: it.price })),
    subtotal: proposal.subtotal,
    discount: proposal.discount,
    total: proposal.total,
  }
}

/** Текстовое представление КП для «Скопировать». */
export function proposalCopyText(proposal: Proposal, carLabelText: string): string {
  const lines: string[] = [
    `КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ PRO-TUNING`,
    `${proposal.number} · ${carLabelText}`,
    proposal.clientName ? `Клиент: ${proposal.clientName}` : '',
    proposal.clientPhone ? `Телефон: ${proposal.clientPhone}` : '',
    proposal.clientEmail ? `E-mail: ${proposal.clientEmail}` : '',
    '',
    ...proposal.items.map((it) => `• ${it.serviceName}: ${formatRub(it.price)}`),
    '',
    `ИТОГО: ${formatRub(proposal.total)}`,
  ]
  return lines.join('\n')
}
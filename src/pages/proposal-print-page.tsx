import { useParams } from 'react-router-dom'
import { useProposal } from '@/hooks/use-proposals'
import { useAllCars } from '@/hooks/use-cars'
import { Spinner } from '@/components/common/spinner'
import { ErrorState } from '@/components/common/error-state'
import { ProposalDocument } from '@/components/proposal/proposal-document'
import { proposalToView } from '@/lib/proposal-view'

/**
 * Отдельная страница только для печати: без навигации, A4 с нулевыми полями.
 * Браузерный «Сохранить как PDF» даёт аккуратный документ.
 */
export function ProposalPrintPage() {
  const { id } = useParams<{ id: string }>()
  const proposalQuery = useProposal(id)
  const carsQuery = useAllCars()

  if (proposalQuery.isLoading || carsQuery.isLoading) {
    return (
      <div className="grid place-items-center py-24 print:hidden">
        <Spinner />
      </div>
    )
  }

  if (proposalQuery.isError || !proposalQuery.data) {
    return <ErrorState message="Коммерческое предложение не найдено." />
  }

  const proposal = proposalQuery.data
  const car = carsQuery.data?.find((c) => c.id === proposal.carId)
  const view = proposalToView(proposal, car)

  return (
    <div className="print-root">
      <ProposalDocument data={view} />
      <noscript className="print:hidden">
        <p>Печать: Ctrl+P → «Сохранить как PDF».</p>
      </noscript>
    </div>
  )
}
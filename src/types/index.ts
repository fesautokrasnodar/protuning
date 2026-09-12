export type Role = 'admin' | 'manager'

export type ProposalStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'archived'

export const ROLES: readonly Role[] = ['admin', 'manager']

export const PROPOSAL_STATUSES: readonly ProposalStatus[] = [
  'draft',
  'sent',
  'approved',
  'rejected',
  'archived',
]

export interface Car {
  id: string
  brand: string
  model: string
  photoUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** price === null означает «цена не задана / услуга не предлагается» */
export interface Price {
  id: string
  carId: string
  serviceId: string
  price: number | null
  createdAt: string
  updatedAt: string
}

export interface Profile {
  id: string
  userId: string
  fullName: string
  role: Role
  createdAt: string
  updatedAt: string
}

/** snapshot: serviceName и price фиксируются на момент сохранения КП */
export interface ProposalItem {
  id: string
  proposalId: string
  serviceId: string
  serviceName: string
  price: number
  quantity: number
  total: number
}

export interface Proposal {
  id: string
  number: string
  carId: string
  clientName: string
  clientPhone: string
  clientEmail: string
  status: ProposalStatus
  subtotal: number
  discount: number
  total: number
  createdBy: string
  createdAt: string
  updatedAt: string
  items: ProposalItem[]
}

export interface Session {
  userId: string
  email: string
  fullName: string
  role: Role
}
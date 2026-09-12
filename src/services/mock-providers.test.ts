import { beforeEach, describe, expect, it } from 'vitest'
import { mockCarsProvider } from '@/services/mock-cars'
import { mockProposalsProvider } from '@/services/mock-proposals'
import { loadDb, type DbShape } from '@/lib/mock/db'
import { DomainError } from '@/services/module'

beforeEach(() => {
  localStorage.clear()
})

async function seeded(): Promise<DbShape> {
  return await Promise.resolve(loadDb())
}

describe('cars (mock over localStorage)', () => {
  it('возвращает seed-список автомобилей', async () => {
    const all = await mockCarsProvider.listAll()
    expect(all.length).toBeGreaterThanOrEqual(3)
    expect(all[0]).toHaveProperty('brand')
  })

  it('создаёт и обновляет автомобиль', async () => {
    const created = await mockCarsProvider.create({ brand: 'TANK', model: '300' })
    expect(created.id).toMatch(/^car_/)

    const updated = await mockCarsProvider.update(created.id, { brand: 'TANK', model: '500' })
    expect(updated.model).toBe('500')
  })

  it('устанавливает, заменяет и удаляет фото автомобиля', async () => {
    const created = await mockCarsProvider.create({ brand: 'TANK', model: '300' })
    const withPhoto = await mockCarsProvider.setPhoto(created.id, 'data:image/jpeg;base64,xxx')
    expect(withPhoto.photoUrl).toBe('data:image/jpeg;base64,xxx')

    const replaced = await mockCarsProvider.setPhoto(created.id, 'data:image/webp;base64,yyy')
    expect(replaced.photoUrl).toBe('data:image/webp;base64,yyy')

    const cleared = await mockCarsProvider.setPhoto(created.id, null)
    expect(cleared.photoUrl).toBeNull()
  })

  it('запрещает удаление автомобиля, используемого в КП', async () => {
    const cars = await mockCarsProvider.listAll()
    const target = cars[0]!
    const services = loadDb().services
    const selection = [
      { serviceId: services[0]!.id, serviceName: services[0]!.name, price: 15000 },
    ]
    await mockProposalsProvider.create({
      carId: target.id,
      clientName: 'Клиент',
      clientContact: '',
      status: 'draft',
      discount: 0,
      createdBy: 'user_admin',
      selection,
    })
    await expect(mockCarsProvider.remove(target.id)).rejects.toMatchObject({ code: 'IN_USE' })
  })
})

describe('proposals (mock over localStorage)', () => {
  it('создаёт КП со снапшотом и номером КП-YYYY-NNN', async () => {
    const cars = await mockCarsProvider.listAll()
    const db = await seeded()
    const selection = [
      { serviceId: db.services[0]!.id, serviceName: db.services[0]!.name, price: 15000 },
      { serviceId: db.services[1]!.id, serviceName: db.services[1]!.name, price: 20000 },
    ]
    const proposal = await mockProposalsProvider.create({
      carId: cars[0]!.id,
      clientName: 'Алексей',
      clientContact: '+7 900 000-00-00',
      status: 'draft',
      discount: 5000,
      createdBy: 'user_admin',
      selection,
    })

    expect(proposal.number).toMatch(/^КП-\d{4}-001$/)
    expect(proposal.items).toHaveLength(2)
    expect(proposal.subtotal).toBe(35000)
    expect(proposal.total).toBe(30000)
    expect(proposal.status).toBe('draft')

    const next = await mockProposalsProvider.nextNumber(new Date().getFullYear())
    expect(next).toMatch(/^КП-\d{4}-002$/)
  })

  it('номера не переиспользуются после удаления самого свежего КП', async () => {
    const cars = await mockCarsProvider.listAll()
    const db = await seeded()
    const selection = [{ serviceId: db.services[0]!.id, serviceName: db.services[0]!.name, price: 15000 }]
    const a = await mockProposalsProvider.create({
      carId: cars[0]!.id,
      clientName: 'А',
      clientContact: '',
      status: 'draft',
      discount: 0,
      createdBy: 'user_admin',
      selection,
    })
    const b = await mockProposalsProvider.create({
      carId: cars[0]!.id,
      clientName: 'Б',
      clientContact: '',
      status: 'draft',
      discount: 0,
      createdBy: 'user_admin',
      selection,
    })
    await mockProposalsProvider.remove(b.id)
    expect(a.number.endsWith('-001')).toBe(true)
    expect((await mockProposalsProvider.nextNumber(new Date().getFullYear())).endsWith('-003')).toBe(true)
  })

  it('обновляет статус и возвращает копию', async () => {
    const cars = await mockCarsProvider.listAll()
    const db = await seeded()
    const selection = [{ serviceId: db.services[0]!.id, serviceName: db.services[0]!.name, price: 15000 }]
    const proposal = await mockProposalsProvider.create({
      carId: cars[0]!.id,
      clientName: 'А',
      clientContact: '',
      status: 'draft',
      discount: 0,
      createdBy: 'user_admin',
      selection,
    })
    await mockProposalsProvider.updateStatus(proposal.id, 'approved')
    const fetched = await mockProposalsProvider.get(proposal.id)
    expect(fetched?.status).toBe('approved')
  })

  it('удаление автомобиля из КП блокируется только при существующем КП', async () => {
    const cars = await mockCarsProvider.listAll()
    const target = cars[2]!
    // КП для этого автомобиля ещё нет
    await mockCarsProvider.remove(target.id)
    expect((await mockCarsProvider.listAll()).some((c) => c.id === target.id)).toBe(false)
  })

  it('DomainError имеет код', () => {
    const err = new DomainError('msg', 'IN_USE')
    expect(err.code).toBe('IN_USE')
    expect(err.message).toBe('msg')
  })
})
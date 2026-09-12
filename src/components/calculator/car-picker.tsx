import { Car } from 'lucide-react'
import type { Car as CarEntity } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface CarPickerProps {
  cars: CarEntity[]
  value: string
  onChange: (id: string) => void
}

export function CarPicker({ cars, value, onChange }: CarPickerProps) {
  const current = cars.find((c) => c.id === value) ?? null
  return (
    <div className="space-y-2">
      <Label htmlFor="car">Автомобиль</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id="car">
          <SelectValue placeholder="Выберите автомобиль" />
        </SelectTrigger>
        <SelectContent>
          {cars.map((car) => (
            <SelectItem key={car.id} value={car.id}>
              {car.brand} {car.model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {current ? (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-soft/60 p-2">
          {current.photoUrl ? (
            <img
              src={current.photoUrl}
              alt={`${current.brand} ${current.model}`}
              className="h-16 w-24 rounded-lg border border-line object-cover"
            />
          ) : (
            <div className="grid h-16 w-24 place-items-center rounded-lg border border-line bg-white text-sub">
              <Car className="h-6 w-6" />
            </div>
          )}
          <div>
            <div className="text-sm font-black text-ink">
              {current.brand} {current.model}
            </div>
            <div className="text-xs text-muted-foreground">Цены учитывают выбранную модель</div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
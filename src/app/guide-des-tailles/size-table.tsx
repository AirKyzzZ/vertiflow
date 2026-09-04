import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { MeasurementRow } from './size-data'

type SizeTableProps = {
  sizes: string[]
  measurements: MeasurementRow[]
}

export function SizeTable({ sizes, measurements }: SizeTableProps) {
  return (
    <Table className="min-w-[480px] text-sm">
      <TableHeader>
        <TableRow className="border-neutral-300 hover:bg-transparent">
          <TableHead scope="col" className="h-auto py-2 pr-4 font-normal text-neutral-500">
            Taille
          </TableHead>
          {sizes.map((size) => (
            <TableHead
              key={size}
              scope="col"
              className="h-auto py-2 pr-4 font-normal text-neutral-500"
            >
              {size}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {measurements.map((row) => (
          <TableRow key={row.label} className="border-neutral-100 hover:bg-transparent">
            <TableHead scope="row" className="h-auto py-2 pr-4 font-normal text-neutral-700">
              {row.label}
            </TableHead>
            {sizes.map((size) => (
              <TableCell key={size} className="py-2 pr-4">
                {row.values[size] ?? '—'}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

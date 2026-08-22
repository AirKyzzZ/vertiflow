import type { MeasurementRow } from './size-data'

type SizeTableProps = {
  sizes: string[]
  measurements: MeasurementRow[]
}

export function SizeTable({ sizes, measurements }: SizeTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className="border-b border-neutral-300 py-2 pr-4 font-normal text-neutral-500">
              Taille
            </th>
            {sizes.map((size) => (
              <th
                key={size}
                className="border-b border-neutral-300 py-2 pr-4 font-normal text-neutral-500"
              >
                {size}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {measurements.map((row) => (
            <tr key={row.label}>
              <td className="border-b border-neutral-100 py-2 pr-4 text-neutral-700">
                {row.label}
              </td>
              {sizes.map((size) => (
                <td key={size} className="border-b border-neutral-100 py-2 pr-4">
                  {row.values[size] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

'use client'

import { groupByGeneration } from '@/lib/iphone-generation'
import { swatchClass } from '@/lib/swatch'

type VariantPickerProps = {
  palette: string[]
  sizes: string[]
  colour: string
  size: string
  onColour: (value: string) => void
  onSize: (value: string) => void
}

export function VariantPicker({ palette, sizes, colour, size, onColour, onSize }: VariantPickerProps) {
  const isPhoneModel = sizes.some((value) => value.startsWith('iPhone'))

  return (
    <div className="space-y-8">
      {palette.length > 1 && (
        <div>
          <p className="eyebrow text-neutral-500">
            Couleur — <span className="text-ink">{colour}</span>
          </p>
          <div className="mt-3 flex gap-3">
            {palette.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onColour(value)}
                aria-label={value}
                aria-pressed={value === colour}
                className={`size-9 transition-shadow ${swatchClass(value)} ${
                  value === colour ? 'ring-2 ring-ink ring-offset-4 ring-offset-paper' : ''
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {sizes.length === 1 ? (
        <p className="eyebrow text-neutral-500">Taille unique</p>
      ) : sizes.length <= 8 ? (
        <div>
          <p className="eyebrow text-neutral-500">Taille</p>
          <div className="mt-3 flex divide-x divide-ink/15 border border-ink/15">
            {sizes.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onSize(value)}
                aria-pressed={value === size}
                className={`flex-1 py-3 text-sm transition-colors ${
                  value === size ? 'bg-ink text-paper' : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <label className="eyebrow block text-neutral-500" htmlFor="size-select">
            {isPhoneModel ? 'Modèle' : 'Taille'}
          </label>
          <select
            id="size-select"
            value={size}
            onChange={(event) => onSize(event.target.value)}
            className="mt-3 w-full border border-ink/15 bg-paper px-4 py-3 text-sm text-ink"
          >
            {isPhoneModel
              ? groupByGeneration(sizes).map(([generation, models]) => (
                  <optgroup key={generation} label={generation}>
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </optgroup>
                ))
              : sizes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
          </select>
        </div>
      )}
    </div>
  )
}

export const seedlingVarieties = [
  { type: 'Robusta', varieties: ['Nganda', 'Eracta', 'Clonal Robusta'] },
  { type: 'Arabica', varieties: ['Kent', 'SL14', 'SL28', 'Typica', 'KP 423'] },
]

export function getItemSeedlingVarieties(item) {
  if (item.seedling_varieties && typeof item.seedling_varieties === 'object') {
    return item.seedling_varieties
  }
  return item.seedling_type ? { [item.seedling_type]: item.quantity } : {}
}

export function mergeSeedlingVarieties(...selections) {
  return selections.reduce((merged, selection) => {
    Object.entries(selection || {}).forEach(([variety, quantity]) => {
      merged[variety] = (merged[variety] || 0) + quantity
    })
    return merged
  }, {})
}

export function getSeedlingVarietyBreakdown(items) {
  return mergeSeedlingVarieties(
    ...items
      .filter(item => item.id === 'coffee-seedlings')
      .map(getItemSeedlingVarieties),
  )
}

export function formatSeedlingVarieties(selection) {
  return Object.entries(selection)
    .filter(([, quantity]) => quantity > 0)
    .map(([variety, quantity]) => `${variety}: ${quantity.toLocaleString()}`)
    .join('; ')
}

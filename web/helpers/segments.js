/*
  common functions
*/
export const WeightMap = {
  0.1: 'low',
  0.4: 'med',
  0.7: 'high'
}
export const BasisMap = {
  label: 'Tag',
  asset: 'Product'
}
export function MakeSegmentDisplayId (
  action_type,
  segment_basis,
  segment_basis_id,
  min_weight
) {
  const displayWeight = WeightMap[min_weight]
  const displayBasis = BasisMap[segment_basis].toLowerCase()
  return `${action_type}-${displayBasis}-${segment_basis_id.trim()}-${displayWeight}`
}
export function ConvertSegmentDisplayIdToQuery (segmentDisplayId) {
  const queryParts = segmentDisplayId.split('-')
  console.log(queryParts[1], getKeyByValue(BasisMap, queryParts[1]))
  const segmentQuery = {
    action_type: queryParts[0],
    segment_basis: getKeyByValue(BasisMap, queryParts[1]),
    segment_basis_id: queryParts[2],
    min_weight: getKeyByValue(WeightMap, queryParts[3])
  }
  return segmentQuery
}

const getKeyByValue = (object, value) => {
  return Object.keys(object).find(
    key => object[key].toLowerCase() === value.toLowerCase()
  )
}

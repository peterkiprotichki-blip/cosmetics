export function dateFilter(
  field: string,
  from?: string,
  to?: string,
): Record<string, any> {
  const bounds: any = {};
  if (from) bounds.$gte = new Date(`${from.slice(0, 10)}T00:00:00`);
  if (to) bounds.$lte = new Date(`${to.slice(0, 10)}T23:59:59.999`);
  return Object.keys(bounds).length ? { [field]: bounds } : {};
}

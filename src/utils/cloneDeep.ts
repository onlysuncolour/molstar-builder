export default function cloneDeep<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(item => cloneDeep(item)) as unknown as T;
  }
  const clonedObject = {} as T;
  for (const key in value) {
    if (value.hasOwnProperty(key)) {
      clonedObject[key] = cloneDeep(value[key]);
    }
  }
  return clonedObject;
}

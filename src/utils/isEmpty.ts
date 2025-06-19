export default function isEmpty(value: unknown): boolean {
  if (value == null) { 
    return true;
  }

  if (typeof value === 'string' || value instanceof String) {
    return value.length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (value instanceof Map || value instanceof Set) {
    return value.size === 0;
  }

  if (typeof value === 'object') {
    if (Object.prototype.toString.call(value) !== '[object Object]') {
      return false;
    }
    return Object.keys(value).length === 0;
  }
  
  return false;
}

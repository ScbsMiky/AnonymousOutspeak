export function isObject(item: any) {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

export default function merge<T>(target: T, ...sources: any) {
  if (!sources.length) return target;

  const source = sources.shift( );

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        // @ts-ignore
        if (!target[key]) Object.assign(target, { [key]: {} });
        
        // @ts-ignore
        merge(target[key], source[key]);
      } else {
        // @ts-ignore
        Object.assign(target, { [key]: source[key] });
      };
    };
  };

  return merge(target, ...sources);
};
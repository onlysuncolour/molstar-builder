import { useState, useEffect } from 'react';

export const useMolstar = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    // 添加与Molstar交互的逻辑
    console.log('Hook initialized:', value);
  }, [value]);

  return [value, setValue] as const;
};
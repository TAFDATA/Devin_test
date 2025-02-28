'use client';

import { useEffect, useState } from 'react';

export function EventStream() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCount(data.count);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">SSEカウンター</h2>
      <p className="mt-2">現在のカウント: {count}</p>
    </div>
  );
}

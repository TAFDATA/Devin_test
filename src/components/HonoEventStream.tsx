'use client';

import { useEffect, useState } from 'react';

interface HonoEventStreamProps {
  id?: string;
}

export function HonoEventStream({ id }: HonoEventStreamProps) {
  const [count, setCount] = useState<number>(0);
  const [sourceInfo, setSourceInfo] = useState<string>('');
  const [streamId, setStreamId] = useState<string | undefined>(id);

  useEffect(() => {
    // IDが指定されている場合はそのIDを使用したエンドポイントに接続
    const endpoint = streamId 
      ? `/api/hono-events/${streamId}` 
      : '/api/hono-events';
    
    const eventSource = new EventSource(endpoint);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCount(data.count);
      setSourceInfo(data.source);
      if (data.id) {
        setStreamId(data.id);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE接続エラー:', error);
      // 接続エラー時の処理を追加
    };

    return () => {
      eventSource.close();
    };
  }, [streamId]);

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <h2 className="text-xl font-bold">Hono SSEカウンター</h2>
      {streamId && (
        <p className="text-sm text-gray-600">ストリームID: {streamId}</p>
      )}
      <p className="mt-2">現在のカウント: {count}</p>
      <p className="text-sm text-gray-500">ソース: {sourceInfo}</p>
    </div>
  );
}

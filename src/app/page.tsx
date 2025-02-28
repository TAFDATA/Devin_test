import { EventStream } from '@/components/EventStream';
import { HonoEventStream } from '@/components/HonoEventStream';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold my-4">Next.js SSEデモ</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <h2 className="text-xl mb-2">標準Next.js SSE</h2>
          <EventStream />
        </div>
        
        <div>
          <h2 className="text-xl mb-2">Hono SSE</h2>
          <HonoEventStream />
        </div>
      </div>
      
      <div className="mt-8 p-4 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">Dynamic Routingデモ</h2>
        <p className="mb-2">以下のリンクをクリックして、IDを指定したSSEストリームを試してみてください：</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><a href="/hono-stream/user123" className="text-blue-500 hover:underline">ユーザーID: user123</a></li>
          <li><a href="/hono-stream/device456" className="text-blue-500 hover:underline">デバイスID: device456</a></li>
          <li><a href="/hono-stream/sensor789" className="text-blue-500 hover:underline">センサーID: sensor789</a></li>
        </ul>
      </div>
    </div>
  );
}

import { HonoEventStream } from '@/components/HonoEventStream';

export default function HonoStreamPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold my-4">Hono SSEデモ - Dynamic Routing</h1>
      <p className="mb-4">ID: {params.id}</p>
      <HonoEventStream id={params.id} />
      <div className="mt-4">
        <a href="/" className="text-blue-500 hover:underline">トップページに戻る</a>
      </div>
    </div>
  );
}

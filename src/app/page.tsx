import { EventStream } from '@/components/EventStream';

export default function Home() {
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold my-4">Next.js SSEデモ</h1>
      <EventStream />
    </div>
  );
}

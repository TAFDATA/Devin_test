import { NextResponse } from 'next/server';

export async function GET() {
  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    start(controller) {
      let count = 0;
      const interval = setInterval(() => {
        const message = `data: ${JSON.stringify({ count: count++ })}\n\n`;
        controller.enqueue(encoder.encode(message));
      }, 1000);

      // クリーンアップ
      return () => {
        clearInterval(interval);
      };
    },
  });

  return new NextResponse(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

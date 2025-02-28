import { NextResponse } from 'next/server';

export async function GET() {
  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    start(controller) {
      let count = 0;
      let isActive = true;
      
      const interval = setInterval(() => {
        if (!isActive) {
          clearInterval(interval);
          return;
        }
        
        try {
          const message = `data: ${JSON.stringify({ count: count++ })}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('SSEエラー:', error);
          clearInterval(interval);
          isActive = false;
          try {
            controller.close();
          } catch (closeError) {
            // すでにクローズされている場合は無視
          }
        }
      }, 1000);

      // クリーンアップ
      return () => {
        isActive = false;
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

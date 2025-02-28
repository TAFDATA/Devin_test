import { Hono } from 'hono';
import { handle } from 'hono/vercel';

// Honoアプリケーションの作成
const app = new Hono().basePath('/api/hono-events');

// SSEエンドポイントの実装
app.get('/', (c) => {
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
          const message = `data: ${JSON.stringify({ count: count++, source: 'hono' })}\n\n`;
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

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

// Dynamic Routingを使用したパラメータ付きSSEエンドポイント
app.get('/:id', (c) => {
  const id = c.req.param('id');
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
          const message = `data: ${JSON.stringify({ count: count++, id, source: 'hono' })}\n\n`;
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

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

export const GET = handle(app);

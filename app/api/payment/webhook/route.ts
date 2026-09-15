import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`[Razorpay Webhook] Received event: ${event}`);

    switch (event) {
      case 'payment.captured': {
        const payment = payload.payload.payment.entity;
        console.log(`[Razorpay] Payment captured: ${payment.id} for order ${payment.order_id}`);
        // In full DB setup, update order payment_status to 'PAID'
        break;
      }
      case 'payment.failed': {
        const payment = payload.payload.payment.entity;
        console.warn(`[Razorpay] Payment failed: ${payment.id} reason: ${payment.error_description}`);
        // In full DB setup, update order payment_status to 'FAILED'
        break;
      }
      case 'order.paid': {
        const order = payload.payload.order.entity;
        console.log(`[Razorpay] Order marked paid: ${order.id}`);
        break;
      }
      default:
        console.log(`[Razorpay Webhook] Unhandled event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

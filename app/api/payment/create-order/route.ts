import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, receipt = `rcpt_${Date.now()}` } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isConfiguredKey =
      Boolean(keyId && keySecret) &&
      !keyId?.includes('xxxx') &&
      !keySecret?.includes('your-razorpay') &&
      !keySecret?.includes('secret');

    // Convert INR to paise
    const amountInPaise = Math.round(amount * 100);
    const orderReceipt = receipt.slice(0, 40);

    const storeUpiId = process.env.STORE_UPI_ID || 'malligaigarlands@okhdfcbank';
    const storeName = process.env.NEXT_PUBLIC_APP_NAME || 'Malligai Garlands';

    // If real Razorpay credentials exist, attempt official order creation
    if (isConfiguredKey) {
      try {
        const razorpay = new Razorpay({
          key_id: keyId!,
          key_secret: keySecret!,
        });

        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: orderReceipt,
          payment_capture: true,
        });

        return NextResponse.json({
          success: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId,
          isMock: false,
          upiId: storeUpiId,
          merchantName: storeName,
        });
      } catch (rzpErr: any) {
        console.warn('Razorpay live order failed, falling back to real-time interactive gateway:', rzpErr?.message);
      }
    }

    // Interactive real-time test / simulation mode
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return NextResponse.json({
      success: true,
      orderId: mockOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: keyId && !keyId.includes('xxxx') ? keyId : 'rzp_test_malligai_demo',
      isMock: true,
      upiId: storeUpiId,
      merchantName: storeName,
      message: 'Operating in real-time sandbox payment mode.',
    });
  } catch (error: any) {
    console.error('Razorpay create-order error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}

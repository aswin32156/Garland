import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

// GET: Fetch all orders (for Owner/Admin) or user's orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('order_number');
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');

    const supabase = await createAdminClient();

    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:profiles(*),
        items:order_items(*)
      `)
      .order('created_at', { ascending: false });

    if (orderNumber) {
      query = query.eq('order_number', orderNumber);
    }
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        data: orders || [],
        total: orders?.length || 0,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch orders' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// POST: Place a new order into Supabase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_number,
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      subtotal,
      total,
      pickup_date,
      pickup_start_time,
      pickup_end_time,
      payment_id,
      items,
    } = body;

    if (!items || !items.length) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const supabase = await createAdminClient();
    let effectiveCustomerId = customer_id;

    // Verify if customer_id exists in profiles
    if (effectiveCustomerId && effectiveCustomerId !== 'guest-user') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', effectiveCustomerId)
        .maybeSingle();

      if (!profile) {
        effectiveCustomerId = null;
      }
    } else {
      effectiveCustomerId = null;
    }

    // If no valid profile found, find or create one based on customer email or phone
    if (!effectiveCustomerId) {
      const email = customer_email || `guest_${Date.now()}@malligai.com`;
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const existingUser = usersData?.users?.find((u) => u.email === email);

      if (existingUser) {
        effectiveCustomerId = existingUser.id;
      } else {
        const { data: newUser, error: userCreateErr } = await supabase.auth.admin.createUser({
          email,
          password: `Guest_${Date.now()}_Pass!`,
          email_confirm: true,
          user_metadata: {
            full_name: customer_name || 'Customer',
            phone: customer_phone || '',
          },
        });

        if (userCreateErr) {
          throw userCreateErr;
        }
        effectiveCustomerId = newUser.user.id;
      }
    }

    const assignedOrderNumber =
      order_number || `MG${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Insert Order
    const { data: newOrder, error: orderErr } = await supabase
      .from('orders')
      .insert([
        {
          order_number: assignedOrderNumber,
          customer_id: effectiveCustomerId,
          status: 'ACCEPTED',
          payment_status: 'PAID',
          subtotal: Number(subtotal || total),
          total: Number(total),
          pickup_date,
          pickup_start_time,
          pickup_end_time,
          payment_id: payment_id || `pay_direct_${Date.now()}`,
        },
      ])
      .select()
      .single();

    if (orderErr) {
      throw orderErr;
    }

    // 2. Insert Order Items
    const orderItemsPayload = items.map((item: any) => ({
      order_id: newOrder.id,
      garland_id: item.garland_id && item.garland_id.length > 20 ? item.garland_id : null,
      garland_name: item.garland_name,
      garland_image: item.garland_image || null,
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unit_price),
      subtotal: Number(item.subtotal || item.unit_price * item.quantity),
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(orderItemsPayload);

    if (itemsErr) {
      console.error('Error inserting order items:', itemsErr);
    }

    // 3. Insert Payment Record into Supabase payments table
    try {
      await supabase.from('payments').insert([
        {
          order_id: newOrder.id,
          razorpay_payment_id: payment_id || `pay_live_${Date.now()}`,
          amount: Number(total),
          currency: 'INR',
          status: 'PAID',
          method: body.payment_method || 'UPI',
        },
      ]);
    } catch (payErr) {
      console.warn('Could not insert into payments table:', payErr);
    }

    // 4. Insert notification for customer if registered
    try {
      if (effectiveCustomerId) {
        await supabase.from('notifications').insert([
          {
            user_id: effectiveCustomerId,
            type: 'ORDER_CONFIRMED',
            title: `Order #${assignedOrderNumber} Confirmed`,
            body: `Your payment of ₹${total} was received. Pickup on ${pickup_date}.`,
            data: { order_number: assignedOrderNumber, total, items_count: items.length },
            is_read: false,
          },
        ]);
      }
    } catch (notifErr) {
      console.warn('Could not insert into notifications table:', notifErr);
    }

    // 5. Fetch full populated order
    const { data: fullOrder } = await supabase
      .from('orders')
      .select(`
        *,
        customer:profiles(*),
        items:order_items(*)
      `)
      .eq('id', newOrder.id)
      .single();

    return NextResponse.json(
      {
        success: true,
        data: fullOrder || newOrder,
        message: 'Order created in Supabase successfully',
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// PATCH: Update order status (Owner / Admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_number, id, status } = body;

    if ((!order_number && !id) || !status) {
      return NextResponse.json(
        { success: false, error: 'Order identifier and status are required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const supabase = await createAdminClient();

    let query = supabase.from('orders').update({
      status,
      updated_at: new Date().toISOString(),
    });

    if (order_number) {
      query = query.eq('order_number', order_number);
    } else {
      query = query.eq('id', id);
    }

    const { error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        message: `Order status updated to ${status} in Supabase`,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update order status' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

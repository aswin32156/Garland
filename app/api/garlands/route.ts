import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getStoredGarlands, updateStoredGarland } from '@/lib/catalog-storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

// GET: fetch all garlands or filtered garlands from Supabase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const occasion = searchParams.get('occasion');
    const featured = searchParams.get('featured');
    const popular = searchParams.get('popular');
    const search = searchParams.get('search');
    const all = searchParams.get('all') === 'true'; // for admin: includes unavailable ones

    const supabase = await createClient();

    let query = supabase
      .from('garlands')
      .select(`
        *,
        category:categories(*),
        occasion:occasions(*)
      `)
      .order('created_at', { ascending: true });

    if (!all) {
      query = query.eq('is_available', true);
    }
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }
    if (popular === 'true') {
      query = query.eq('is_popular', true);
    }

    const { data: garlands, error } = await query;

    if (error) {
      console.warn('Supabase query failed, falling back to local storage:', error.message);
      const fallback = getStoredGarlands();
      return NextResponse.json(
        { success: true, data: fallback, total: fallback.length, source: 'fallback' },
        { headers: NO_CACHE_HEADERS }
      );
    }

    let filtered = garlands || [];

    if (category) {
      filtered = filtered.filter((g: any) => g.category?.slug === category);
    }
    if (occasion) {
      filtered = filtered.filter((g: any) => g.occasion?.slug === occasion);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (g: any) =>
          g.name?.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q) ||
          g.flower_type?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: filtered,
        total: filtered.length,
        source: 'supabase',
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Error fetching garlands:', error);
    const fallback = getStoredGarlands();
    return NextResponse.json(
      { success: true, data: fallback, total: fallback.length, source: 'fallback-error' },
      { headers: NO_CACHE_HEADERS }
    );
  }
}

// DELETE: permanently delete a garland by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Garland ID is required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const supabase = await createAdminClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let deleteQuery = supabase.from('garlands').delete();

    if (isUUID) {
      deleteQuery = deleteQuery.or(`id.eq.${id},slug.eq.${id}`);
    } else {
      deleteQuery = deleteQuery.eq('slug', id);
    }

    const { error } = await deleteQuery;

    if (error) {
      throw error;
    }

    // Return updated list
    const { data: updated } = await supabase
      .from('garlands')
      .select('*, category:categories(*), occasion:occasions(*)')
      .order('created_at', { ascending: true });

    return NextResponse.json(
      {
        success: true,
        message: 'Garland deleted from Supabase',
        data: updated || [],
        total: updated?.length || 0,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Error deleting garland:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete garland' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// POST: create a new garland
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newGarland = body.garland;

    if (!newGarland || !newGarland.name || !newGarland.price) {
      return NextResponse.json(
        { success: false, error: 'Invalid garland payload' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const supabase = await createAdminClient();

    // Generate a unique clean slug
    const rawSlug = (newGarland.slug || newGarland.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const uniqueSlug = `${rawSlug}-${Date.now().toString().slice(-4)}`;

    // Prepare payload for Supabase garlands table
    const insertPayload: any = {
      name: newGarland.name.trim(),
      slug: uniqueSlug,
      description: newGarland.description || '',
      price: Number(newGarland.price),
      flower_type: newGarland.flower_type || 'Mixed',
      images: Array.isArray(newGarland.images) && newGarland.images.length > 0 
        ? newGarland.images 
        : ['/images/garland-rose.jpg'],
      is_available: newGarland.is_available ?? true,
      is_featured: newGarland.is_featured ?? false,
      is_popular: newGarland.is_popular ?? false,
      stock_qty: newGarland.stock_qty || 20,
      collection_tag: newGarland.collection_tag || null,
    };

    // 1. Resolve Category UUID from Supabase
    const catSearch = newGarland.category_name || newGarland.category?.name || newGarland.category?.slug || '';
    if (catSearch) {
      const { data: catRow } = await supabase
        .from('categories')
        .select('id')
        .or(`name.ilike.%${catSearch}%,slug.ilike.%${catSearch}%`)
        .limit(1)
        .maybeSingle();

      if (catRow?.id) {
        insertPayload.category_id = catRow.id;
      }
    } else if (newGarland.category_id && newGarland.category_id.length > 20) {
      insertPayload.category_id = newGarland.category_id;
    }

    // 2. Resolve Occasion UUID from Supabase
    const occSearch = newGarland.occasion_name || newGarland.occasion?.name || newGarland.occasion?.slug || '';
    if (occSearch) {
      const { data: occRow } = await supabase
        .from('occasions')
        .select('id')
        .or(`name.ilike.%${occSearch}%,slug.ilike.%${occSearch}%`)
        .limit(1)
        .maybeSingle();

      if (occRow?.id) {
        insertPayload.occasion_id = occRow.id;
      }
    } else if (newGarland.occasion_id && newGarland.occasion_id.length > 20) {
      insertPayload.occasion_id = newGarland.occasion_id;
    }

    const { error: insertErr } = await supabase.from('garlands').insert([insertPayload]);

    if (insertErr) {
      throw insertErr;
    }

    const { data: updated } = await supabase
      .from('garlands')
      .select('*, category:categories(*), occasion:occasions(*)')
      .order('created_at', { ascending: true });

    return NextResponse.json(
      {
        success: true,
        message: 'Garland created in Supabase',
        data: updated || [],
        total: updated?.length || 0,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Error creating garland:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create garland' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// PUT: update availability, featured status, or details
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json(
        { success: false, error: 'ID and updates are required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const supabase = await createAdminClient();

    const allowedUpdates: any = {};
    if (updates.name !== undefined) allowedUpdates.name = updates.name;
    if (updates.price !== undefined) allowedUpdates.price = Number(updates.price);
    if (updates.is_available !== undefined) allowedUpdates.is_available = updates.is_available;
    if (updates.is_featured !== undefined) allowedUpdates.is_featured = updates.is_featured;
    if (updates.is_popular !== undefined) allowedUpdates.is_popular = updates.is_popular;
    if (updates.stock_qty !== undefined) allowedUpdates.stock_qty = updates.stock_qty;
    if (updates.description !== undefined) allowedUpdates.description = updates.description;
    if (updates.flower_type !== undefined) allowedUpdates.flower_type = updates.flower_type;
    if (updates.images !== undefined) allowedUpdates.images = updates.images;
    if (updates.category_id !== undefined && updates.category_id.length > 20) allowedUpdates.category_id = updates.category_id;
    if (updates.occasion_id !== undefined && updates.occasion_id.length > 20) allowedUpdates.occasion_id = updates.occasion_id;
    allowedUpdates.updated_at = new Date().toISOString();

    // Also sync with stored catalog cache
    try {
      updateStoredGarland(id, updates);
    } catch (e) {
      // ignore
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let updateQuery = supabase.from('garlands').update(allowedUpdates);

    if (isUUID) {
      updateQuery = updateQuery.or(`id.eq.${id},slug.eq.${id}`);
    } else {
      updateQuery = updateQuery.eq('slug', id);
    }

    const { error } = await updateQuery;

    if (error) {
      throw error;
    }

    const { data: updated } = await supabase
      .from('garlands')
      .select('*, category:categories(*), occasion:occasions(*)')
      .order('created_at', { ascending: true });

    return NextResponse.json(
      {
        success: true,
        data: updated || [],
        total: updated?.length || 0,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Error updating garland:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update garland' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

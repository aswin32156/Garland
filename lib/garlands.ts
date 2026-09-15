import { createClient } from '@/lib/supabase/server';
import { getStoredGarlands } from '@/lib/catalog-storage';
import { Garland } from '@/types';

// Fetch available garlands for public storefront (Home & Catalog)
export async function getLiveGarlands(): Promise<Garland[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('garlands')
      .select(`
        *,
        category:categories(*),
        occasion:occasions(*)
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('Supabase query returned empty/error, using fallback:', error?.message);
      return getStoredGarlands().filter((g) => g.is_available);
    }

    return data as Garland[];
  } catch (err) {
    console.error('Error in getLiveGarlands:', err);
    return getStoredGarlands().filter((g) => g.is_available);
  }
}

// Fetch all garlands for Admin Dashboard (includes inactive)
export async function getAllGarlandsAdmin(): Promise<Garland[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('garlands')
      .select(`
        *,
        category:categories(*),
        occasion:occasions(*)
      `)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return getStoredGarlands();
    }

    return data as Garland[];
  } catch (err) {
    console.error('Error in getAllGarlandsAdmin:', err);
    return getStoredGarlands();
  }
}

// Fetch a single garland by slug or UUID
export async function getGarlandBySlug(slug: string): Promise<Garland | null> {
  try {
    const supabase = await createClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    let query = supabase
      .from('garlands')
      .select(`
        *,
        category:categories(*),
        occasion:occasions(*)
      `);

    if (isUUID) {
      query = query.or(`id.eq.${slug},slug.eq.${slug}`);
    } else {
      query = query.eq('slug', slug);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      const fallback = getStoredGarlands();
      return fallback.find((g) => g.slug === slug || g.id === slug) || null;
    }

    return data as Garland;
  } catch (err) {
    console.error('Error in getGarlandBySlug:', err);
    const fallback = getStoredGarlands();
    return fallback.find((g) => g.slug === slug || g.id === slug) || null;
  }
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lhtvbvlkddekfkgnhnla.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxodHZidmxrZGRla2ZrZ25obmxhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTM2OTU2NCwiZXhwIjoyMTA0OTQ1NTY0fQ.vrd01Pd9MHEvinyyVy5koifwKjCIr6_3CC2KkvYzNek';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSlug() {
  const slug = 'rose-with-gold-wrapping-413-3493';
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  let query = supabase.from('garlands').select('id, name, slug, price, images, category:categories(name), occasion:occasions(name)');
  if (isUUID) {
    query = query.or(`id.eq.${slug},slug.eq.${slug}`);
  } else {
    query = query.eq('slug', slug);
  }

  const { data, error } = await query.maybeSingle();
  console.log('Testing newly added garland detail page query:');
  console.log({
    found: !!data,
    name: data?.name,
    price: data?.price,
    category: data?.category?.name,
    images: data?.images,
    error: error?.message
  });
}

testSlug();

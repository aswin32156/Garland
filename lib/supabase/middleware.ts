import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // Skip Supabase auth if env vars are not configured (development without Supabase)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
    // No Supabase configured — allow all routes, auth pages will handle it
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session — do not remove this
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const path = request.nextUrl.pathname;
  const isOwnerRoute = path.startsWith('/owner');
  const isAdminRoute = path.startsWith('/admin');
  const isCustomerRoute =
    path.startsWith('/checkout') ||
    path.startsWith('/orders') ||
    path.startsWith('/wishlist');

  const demoRole = request.cookies.get('demo_session')?.value;
  const hasAuth = !!user || !!demoRole;

  if (!hasAuth && (isOwnerRoute || isAdminRoute || isCustomerRoute)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based restrictions
  if (isAdminRoute && demoRole && demoRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login?redirectTo=/admin/dashboard', request.url));
  }
  if (isOwnerRoute && demoRole && demoRole !== 'OWNER' && demoRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login?redirectTo=/owner/dashboard', request.url));
  }

  return supabaseResponse;
}

// Demo credentials for development (no Supabase required)
// These are used when Supabase auth is not yet configured

export const DEMO_USERS = [
  {
    id: 'demo-admin-001',
    email: 'admin@malligai.in',
    password: 'Admin@1234',
    full_name: 'Admin User',
    phone: '9000000001',
    role: 'ADMIN' as const,
  },
  {
    id: 'demo-owner-001',
    email: 'owner@malligai.in',
    password: 'Owner@1234',
    full_name: 'Shop Owner',
    phone: '9000000002',
    role: 'OWNER' as const,
  },
  {
    id: 'demo-customer-001',
    email: 'customer@malligai.in',
    password: 'Customer@1234',
    full_name: 'Priya Subramaniam',
    phone: '9876543210',
    role: 'CUSTOMER' as const,
  },
] as const;

export function findDemoUser(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check exact configured accounts
  const exact = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === password
  );
  if (exact) return exact;

  // 2. Allow customer login in demo/test mode with any valid email and 4+ char password
  if (cleanEmail && cleanEmail.includes('@') && password && password.length >= 4) {
    // If someone attempts admin or owner with wrong password, don't fallback to customer
    if (cleanEmail === 'admin@malligai.in' || cleanEmail === 'owner@malligai.in') {
      return null;
    }

    const namePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    return {
      id: `cust_${Math.random().toString(36).substring(2, 9)}`,
      email: cleanEmail,
      password,
      full_name: formattedName || 'Valued Customer',
      phone: '9876543210',
      role: 'CUSTOMER' as const,
    };
  }

  return null;
}

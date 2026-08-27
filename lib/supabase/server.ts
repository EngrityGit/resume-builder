import { createServerClient, type CookieOptions } from '@supabase/ssr'; // Added type import
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Fix: Added : CookieOptions to the options parameter
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // called from a Server Component with no writable cookie store; safe to ignore
          }
        },
        // Fix: Added : CookieOptions to the options parameter
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // same as above
          }
        },
      },
    }
  );
}

// Service-role client for privileged operations (invites, admin search).
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client bundle.
export function createServiceClient() {
  // Using dynamic require to ensure this only runs on the server
  const { createClient: createRawClient } = require('@supabase/supabase-js');
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
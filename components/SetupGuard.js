'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isSetupComplete } from '@/lib/config';

export default function SetupGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith('/setup')) {
      setReady(true);
      return;
    }

    if (!isSetupComplete()) {
      router.replace('/setup');
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) return null;

  return children;
}
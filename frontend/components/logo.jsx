import React from 'react';
import Link from 'next/link';
import { Pyramid } from 'lucide-react';

export function Logo({ className = '', linkTo = '/' }) {
  return (
    <Link href={linkTo} className={`flex items-center justify-center gap-2 ${className}`}>
      <Pyramid className="h-8 w-8" />
      <span className="text-3xl font-serif tracking-tighter">Kernel</span>
    </Link>
  );
} 
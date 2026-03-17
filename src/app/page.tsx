// src/app/page.tsx
'use client'

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className='flex flex-col gap-4'>
      <h1>
        ¡Bienvenido a la Veterinaria!
      </h1>
      <Button variant='link'>
        Haz clic aquí
      </Button>
    </main>
  );
}

// src/app/page.tsx
'use client'
import { ThemeToggleButton } from '@/components/ui/ToggleTheme';
import { Button, Heading } from '@chakra-ui/react';

export default function Home() {
  return (
    <main className='flex flex-col gap-4'>
      <Heading as="h1" size="xl" mb={4}>
        ¡Bienvenido a la Veterinaria!
      </Heading>
      <Button colorScheme="teal" size="md">
        Haz clic aquí
      </Button>
      <ThemeToggleButton />
    </main>
  );
}

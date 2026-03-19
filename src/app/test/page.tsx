import { ThemeToggle } from '@/components/shared/themeToggle';
import { createClient } from '@/lib/supabase/server';

export default async function TestPage() {
  const supabase = await createClient();

  // const { data: mascotas, error } = await supabase.from('mascotas').select('*');

  // if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Mascotas en vetPoint:</h1>
      {/* <pre>{JSON.stringify(mascotas, null, 2)}</pre> */}
      <ThemeToggle />
    </div>
  );
}
import { supabase } from './supabase';

export async function askVMAAI(message: string) {
  const { data, error } =
    await supabase.functions.invoke('vma-ai', {
      body: {
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      },
    });

  if (error) {
    throw new Error(error.message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data?.answer ?? '';
}
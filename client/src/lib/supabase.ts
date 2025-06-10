// Supabase Storage configuration for image uploads
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Storage bucket names
export const BUCKETS = {
  AVATARS: 'avatars',
  CHAT_IMAGES: 'chat-images'
} as const;

// Helper function to upload image to Supabase Storage
export async function uploadImage(
  file: File, 
  bucket: string, 
  userId: number,
  folder?: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder ? folder + '/' : ''}${userId}-${Date.now()}.${fileExt}`;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  formData.append('fileName', fileName);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Erro ao fazer upload da imagem');
  }
  
  const { url } = await response.json();
  return url;
}

// Helper function to delete image from Supabase Storage
export async function deleteImage(url: string): Promise<void> {
  const response = await fetch('/api/upload', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  
  if (!response.ok) {
    throw new Error('Erro ao deletar imagem');
  }
}
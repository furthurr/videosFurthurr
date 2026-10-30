export declare function generatePages(options?: {
  directory?: URL;
  supabase?: string;
  publicKey?: string;
  site?: string;
  basePath?: string;
  required?: boolean;
}): Promise<Record<string, string>>;

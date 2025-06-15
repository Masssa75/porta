# Nitter Search Edge Function

## Important: File Extension

The main function file is named `index.ts.edge` to prevent Next.js from trying to compile it during build.

When deploying to Supabase:
1. Copy the contents of `index.ts.edge`
2. Paste into the Supabase Function editor
3. Or rename to `index.ts` if using Supabase CLI

This is necessary because Edge Functions use Deno imports that are incompatible with Next.js TypeScript compilation.
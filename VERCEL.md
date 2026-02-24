# Deploying to Vercel

This project is a monorepo using Turbo and Yarn. To deploy the web application to Vercel, follow these steps:

## Prerequisites

- A [Vercel](https://vercel.com) account.
- Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket).

## Deployment Steps

1. **Import Project**: Go to your Vercel Dashboard and click "New Project".
2. **Select Repository**: Choose your `open-agent-platform` repository.
3. **Configure Project**:
   - **Framework Preset**: Select `Next.js`.
   - **Root Directory**: Select `apps/web`.
   - **Build Command**: Ensure it is set to `yarn build` (which now runs `next build`).
   - **Install Command**: `yarn install`.
   - **Output Directory**: `.next`.
4. **Environment Variables**: Add the following variables (copy values from your `.env` or `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_BASE_API_URL` (Pointing to your LangGraph deployment)
   - `LANGSMITH_API_KEY` (Required for proxying requests to LangGraph)
   - `NEXT_PUBLIC_RAG_API_URL` (Optional)
   - `NEXT_PUBLIC_CRAWL4AI_API_URL` (Optional)
   - `NEXT_PUBLIC_DEPLOYMENTS` (Should be a JSON string)
5. **Deploy**: Click "Deploy".

## Monorepo Configuration

Vercel automatically detects the Turbo monorepo setup. By setting the **Root Directory** to `apps/web`, Vercel will:
- Use `apps/web` as the base for the deployment.
- Still have access to the root of the repo to use Turbo's caching features.
- Install dependencies using the root `yarn.lock`.

## Troubleshooting

- **Build Errors**: Ensure all environment variables are correctly set.
- **Node Version**: Vercel uses Node 20 by default. Ensure your project is compatible (it should be).
- **Standalone Mode**: The `next.config.mjs` has `output: 'standalone'` set. This is compatible with Vercel but primarily intended for Docker. Vercel will ignore it and use its own optimized output.

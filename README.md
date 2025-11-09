# Perfinance

React + TypeScript dashboard used to monitor investment performance. The frontend communicates with the Patrimony Management API hosted at Render.

## Environment Variables

Create a `.env` (or `.env.local`) at the project root with:

```
VITE_API_BASE_URL=https://be-patrimonymanagement.onrender.com
```

During local development you may point the variable at another backend (e.g., `http://localhost:8080`).

## Development

```bash
npm install
npm run dev
```

## Deploying to Vercel (Free Tier)

1. **Prepare the project**
   - Ensure the repository is up to date and includes the `.env.example` or README instructions for setting `VITE_API_BASE_URL`.
   - Build locally with a supported Node version (>= 20.19) to confirm there are no errors.
2. **Create the Vercel project**
   - Sign in to [vercel.com](https://vercel.com/) and click *Add New… → Project*.
   - Import this GitHub repository. Vercel will detect Vite automatically (framework preset: *Vite*).
3. **Set Environment Variables**
   - In the project settings, add a Production (and optionally Preview) env variable:  
     `VITE_API_BASE_URL = https://be-patrimonymanagement.onrender.com`
4. **Configure build settings**
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output Directory: `dist`
   - Ensure the Node.js version is at least 20.19 (Project Settings → General → Node.js Version).
5. **Deploy**
   - Click *Deploy*. Vercel will install dependencies, run the build, and host the static `dist` output on their CDN.
6. **Post-deploy**
   - Visit the generated URL to confirm the frontend works against the Render backend.
   - Whenever you push to the main branch, Vercel will redeploy automatically. Pull requests receive preview deployments.

## Useful Scripts

| Command        | Description                      |
| -------------- | -------------------------------- |
| `npm run dev`  | Start Vite dev server            |
| `npm run build`| Type-check and create production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint                       |

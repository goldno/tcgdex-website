import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set base to your GitHub repo name for GitHub Pages, e.g. '/tcgdex-website/'
// Leave as '/' for local dev or a custom domain
export default defineConfig({
  plugins: [react()],
  base: '/tcgdex-website/',
})

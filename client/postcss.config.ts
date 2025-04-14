import type { Plugin } from 'postcss'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

const config = {
  plugins: [
    tailwindcss as unknown as Plugin,
    autoprefixer
  ]
}

export default config

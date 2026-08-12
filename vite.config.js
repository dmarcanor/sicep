import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// A dónde manda Vite las llamadas a /api durante el desarrollo.
//
// Por defecto, al nginx del contenedor `web` (WEB_PORT, 8080), que ya sabe
// enrutar /api hacia Laravel: así basta con `docker compose up -d` y
// `npm run dev`, sin publicar el puerto de la API en el host.
//
// Si se prefiere levantar el backend a mano con `php artisan serve`:
//   VITE_API_TARGET=http://localhost:8000 npm run dev
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const destino = env.VITE_API_TARGET || `http://localhost:${env.WEB_PORT || 8080}`

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
    ],
    server: {
      proxy: {
        '/api': {
          target: destino,
          changeOrigin: true,
        },
      },
    },
  }
})

import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '~app': fileURLToPath(new URL('./src/app', import.meta.url)),
            '~api': fileURLToPath(new URL('./src/api', import.meta.url)),
            '~components': fileURLToPath(new URL('./src/components', import.meta.url)),
            '~modules': fileURLToPath(new URL('./src/modules', import.meta.url)),
            '~utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
            '@myorg/shared': path.resolve(__dirname, '../../packages/shared/src'),
        },
    },
    plugins: [
        react(),
        babel({ presets: [reactCompilerPreset()] }),
    ],
    // server: {
    //     proxy: { '/api': 'http://localhost:3002' },
    // },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                // rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
    },
});

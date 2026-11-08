import { satteri } from '@astrojs/markdown-satteri';
import { defineConfig } from 'astro/config';
import { hastExternalLinks } from './src/hast/external-links';

export default defineConfig({
  site: 'https://daiksud.me',
  trailingSlash: 'never',
  markdown: {
    processor: satteri({
      features: {
        rawHtml: true,
        gfm: {
          footnotes: {
            label: '脚注',
            backLabel: '本文の参照 {reference} に戻る',
          },
        },
      },
      hastPlugins: [hastExternalLinks],
    }),
  },
});

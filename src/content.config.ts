import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    noIndex: z.boolean().optional().default(false),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    draft: z.boolean().optional().default(false),
    author: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
  }),
});

const designSystemCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/design-system' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.enum(['components', 'styles', 'templates', 'guides']),
    status: z.enum(['stable', 'beta', 'deprecated']).optional().default('stable'),
    order: z.number().optional().default(99),
  }),
});

export const collections = { pages, blog, 'design-system': designSystemCollection };

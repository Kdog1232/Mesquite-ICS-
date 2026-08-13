import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'], theme: { extend: { colors: { navy:'#123052', gold:'#e9ad32', canvas:'#f3f6f9' }, boxShadow:{card:'0 1px 2px rgba(18,48,82,.08), 0 8px 24px rgba(18,48,82,.06)'} } }, plugins: [] } satisfies Config;

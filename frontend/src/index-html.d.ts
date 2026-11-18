// Lets a spec import index.html as text (import ... with { loader: 'text' }), as theme-boot.spec.ts does.
declare module '*/index.html' {
  const text: string;
  export default text;
}

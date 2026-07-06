export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-6 py-8 text-center sm:flex-row sm:text-left">
        <p className="font-mono text-xs text-faint">© 2026 Ferdinan Nathanael</p>
        <p className="font-mono text-xs text-faint">
          Built with Next.js &amp; Tailwind CSS
        </p>
      </div>
    </footer>
  );
}

import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20">
      <h1 className="text-4xl">Esta ruta no existe</h1>
      <p className="mt-2 text-ink-soft">El enlace puede estar incompleto. Volvé a explorar destinos desde el inicio.</p>
      <Link to="/" className="mt-6 inline-flex h-10 items-center rounded-lg bg-magenta px-4 font-medium text-white hover:bg-magenta-strong">
        Explorar destinos
      </Link>
    </div>
  );
}

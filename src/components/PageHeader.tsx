export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return <header className="page-header" role="group"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</header>
}

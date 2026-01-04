import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold font-serif text-text-primary">CRM System</h1>
        <p className="text-text-secondary">System is ready for development.</p>
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/dashboard" className="btn-primary">Get Started</Link>
          <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="btn-secondary">Documentation</a>
        </div>
        <div className="mt-8">
          <div className="card max-w-sm mx-auto">
            <p>Tailwind v4 is working!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

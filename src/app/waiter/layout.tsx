export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-black tracking-[0.15em] uppercase">
          Waiter
        </h1>
      </header>
      <main>{children}</main>
    </div>
  );
}

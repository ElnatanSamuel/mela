export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-6 py-4">
        <h1 className="text-2xl font-black tracking-[0.2em] uppercase">
          Kitchen Display
        </h1>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}

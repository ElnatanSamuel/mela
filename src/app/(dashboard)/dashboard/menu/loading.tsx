import MenuManagerSkeleton from "@/components/dashboard/MenuManagerSkeleton";

export default function Loading() {
  return (
    <div className="animate-in fade-in duration-300">
      <MenuManagerSkeleton />
    </div>
  );
}

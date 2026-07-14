function BulbStrip() {
  const bulbs = Array.from({ length: 24 });

  return (
    <div className="flex justify-center gap-3.5 py-2.5 bg-[#0F0D09] border-b border-border">
      {bulbs.map((_, i) => (
        <div
          key={i}
          className="bulb w-1.5 h-1.5 rounded-full"
          style={{ animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  );
}

export default BulbStrip;
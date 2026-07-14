function StatStrip() {
  const stats = [
    { num: "128", accent: true, label: "people booking right now" },
    { num: "340+", accent: false, label: "shows across 12 cities" },
    { num: "2 min", accent: false, label: "avg. checkout time" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-12 pb-2 flex gap-12">
      {stats.map((s, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <div className="font-display text-3xl">
            <span className={s.accent ? "text-teal" : ""}>{s.num}</span>
          </div>
          <div className="text-xs text-muted">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export default StatStrip;

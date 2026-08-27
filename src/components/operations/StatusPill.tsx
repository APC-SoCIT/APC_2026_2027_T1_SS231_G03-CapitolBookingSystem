type Props = {
  status: string;
  interactive?: boolean;
};

export function StatusPill({ status, interactive }: Props) {
  const cls = status.toLowerCase().replaceAll(" ", "-");
  return (
    <span
      className={`ops-pill ops-pill--${cls} ${interactive ? "ops-pill--interactive" : ""}`}
    >
      <span className="ops-pill__dot" />
      {status}
    </span>
  );
}

export function statusClass(status: string) {
  return status.toLowerCase().replaceAll(" ", "-");
}

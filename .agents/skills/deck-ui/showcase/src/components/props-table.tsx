export interface PropDef {
  name: string;
  type: string;
  default?: string;
  description: string;
}

interface PropsTableProps {
  props: PropDef[];
}

export function PropsTable({ props }: PropsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="text-left px-3 py-2 font-medium">Prop</th>
            <th className="text-left px-3 py-2 font-medium">Type</th>
            <th className="text-left px-3 py-2 font-medium">Default</th>
            <th className="text-left px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr
              key={prop.name}
              className="border-b border-border last:border-0"
            >
              <td className="px-3 py-2 font-mono text-xs font-medium text-foreground whitespace-nowrap">
                {prop.name}
              </td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
                {prop.type}
              </td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                {prop.default ?? "—"}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {prop.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import type { ReactNode } from "react";

/**
 * Tabela das páginas de documentação. O MDX do Storybook não interpreta tabelas em
 * markdown sem o plugin remark-gfm; este componente evita a dependência.
 * Células em texto aceitam `código` entre crases.
 */
export function DocTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <table className="my-4 w-full text-left text-body-sm">
      <thead className="text-secondary">
        <tr>
          {head.map((h) => (
            <th key={h} scope="col" className="py-2 pr-4 font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-t border-subtle align-top">
            {row.map((cell, j) => (
              <td
                key={j}
                className={j === 0 ? "py-2 pr-4 text-primary" : "py-2 pr-4 text-secondary"}
              >
                {typeof cell === "string" ? <Inline text={cell} /> : cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Converte `trechos` entre crases em <code>. */
function Inline({ text }: { text: string }) {
  const parts = text.split("`");
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <code key={i} className="font-mono text-code text-primary">
            {p}
          </code>
        ) : (
          p
        ),
      )}
    </>
  );
}

import { useQuery } from "@tanstack/react-query";
import { healthQuery } from "@/services/health";

/** Página de diagnóstico (`/_health`), sem design: confirma front → API → banco. */
export function HealthPage() {
  const { data, error, isPending } = useQuery(healthQuery());

  if (isPending) return <pre>loading</pre>;
  if (error) return <pre>error: {error.message}</pre>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

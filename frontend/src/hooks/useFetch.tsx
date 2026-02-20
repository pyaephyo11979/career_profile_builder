import { useEffect, useRef, useState } from "react";

type UseFetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

function useFetch<T = unknown>(url: string, init?: RequestInit): UseFetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = useRef<RequestInit | undefined>(init).current;

  useEffect(() => {
    const abortController = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          ...options,
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }

        const payload = (await response.json()) as T;
        setData(payload);
      } catch (err) {
        if (abortController.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Request failed";
        setError(message);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      abortController.abort();
    };
  }, [url, options]);

  return { data, loading, error };
}

export default useFetch;

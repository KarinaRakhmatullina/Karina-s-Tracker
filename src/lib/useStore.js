import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

/* =========================================================================
   STORAGE HOOK — persists to a Supabase table (`app_data`), synced across
   devices for the authenticated user. Same [value, save, loaded, error]
   interface as the original artifact-storage version, so screens don't
   need to know where the data actually lives.
   ========================================================================= */
export function useStore(key, initializer) {
  const [value, setValue] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: selectError } = await supabase
          .from("app_data")
          .select("value")
          .eq("key", key)
          .maybeSingle();
        if (cancelled) return;
        if (selectError) throw selectError;
        if (data && data.value) {
          setValue(data.value);
        } else {
          const init = initializer();
          setValue(init);
          const { error: upsertError } = await supabase
            .from("app_data")
            .upsert({ key, value: init, updated_at: new Date().toISOString() });
          if (upsertError) throw upsertError;
        }
      } catch (e) {
        if (cancelled) return;
        const init = initializer();
        setValue(init);
        setError(String(e.message || e));
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, [key]);

  const save = useCallback((updater) => {
    setValue((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      supabase
        .from("app_data")
        .upsert({ key, value: next, updated_at: new Date().toISOString() })
        .then(({ error: upsertError }) => { if (upsertError) setError(String(upsertError.message || upsertError)); });
      return next;
    });
  }, [key]);

  return [value, save, loaded, error];
}

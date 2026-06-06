import { useState, useCallback } from 'react';

/**
 * Wrapper around fetch for calling the Express backend.
 * Automatically handles JSON and error toasting.
 */
export function useApi(showToast) {
  const [loading, setLoading] = useState(false);

  const callApi = useCallback(async (endpoint, body) => {
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.error(`[useApi] ${endpoint}:`, err);
      showToast?.('Connexion perdue — réessayez');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const getApi = useCallback(async (endpoint) => {
    setLoading(true);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`[useApi] GET ${endpoint}:`, err);
      showToast?.('Connexion perdue — réessayez');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return { callApi, getApi, loading };
}

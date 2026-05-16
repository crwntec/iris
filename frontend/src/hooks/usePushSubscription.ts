import { api } from "@/api/client";
import { urlBase64ToUint8Array } from "@/util";

export function usePushSubscription() {
  const subscribe = async (): Promise<PushSubscription | null> => {
    try {
      const { publicKey } = await api.getPushVapidKey();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          publicKey,
        ),
      });
      return sub;
    } catch {
      return null;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }
      await api.unsubscribePush();
      return true;
    } catch {
      return false;
    }
  };

  const getCurrentSubscription = async (): Promise<PushSubscription | null> => {
    const reg = await navigator.serviceWorker.ready;
    return reg.pushManager.getSubscription();
  };

  return { subscribe, unsubscribe, getCurrentSubscription };
}

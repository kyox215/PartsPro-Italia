export type AdminInventoryQuantitySnapshot = {
  stockOnHand: number;
  stockReserved: number;
  incomingQuantity: number;
  incomingReserved: number;
};

export type AdminInventoryAction =
  | "reserve_stock"
  | "release_reservation"
  | "receive_stock"
  | "mark_missing"
  | "manual_adjust"
  | "allocate_preorder";

export function getAvailableToSell(snapshot: AdminInventoryQuantitySnapshot) {
  return Math.max(0, snapshot.stockOnHand - snapshot.stockReserved);
}

export function getAvailableToPreorder(snapshot: AdminInventoryQuantitySnapshot) {
  return Math.max(0, snapshot.incomingQuantity - snapshot.incomingReserved);
}

export function canRunInventoryAction(
  snapshot: AdminInventoryQuantitySnapshot,
  action: AdminInventoryAction,
  quantity = 1,
) {
  if (quantity <= 0) return false;

  switch (action) {
    case "reserve_stock":
      return getAvailableToSell(snapshot) >= quantity || getAvailableToPreorder(snapshot) >= quantity;
    case "release_reservation":
      return snapshot.stockReserved + snapshot.incomingReserved >= quantity;
    case "receive_stock":
      return snapshot.incomingQuantity >= quantity;
    case "mark_missing":
      return snapshot.incomingQuantity >= quantity;
    case "manual_adjust":
      return true;
    case "allocate_preorder":
      return snapshot.stockOnHand > snapshot.stockReserved && snapshot.incomingReserved > 0;
  }
}

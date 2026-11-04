"use client";

import { useState } from "react";

export default function DeleteButton({ action, title }) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <button aria-label={`Delete ${title}`} className="admin-link-danger" onClick={() => setIsConfirming(true)} type="button">
        Delete
      </button>
    );
  }

  return (
    <form action={action} className="admin-confirm">
      <button aria-label={`Confirm deleting ${title}`} className="admin-link-danger" type="submit">Confirm delete</button>
      <button onClick={() => setIsConfirming(false)} type="button">Cancel</button>
    </form>
  );
}

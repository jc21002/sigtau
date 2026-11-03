import { fetchWithAuth } from "./api";

export async function getReasons() {
    const data = await fetchWithAuth("/reasons");
    return data;
}

export async function createReason(reason) {
  return await fetchWithAuth("/reasons", {
        method: "POST",
        body: JSON.stringify(reason)
    });     
}

export async function deleteReason(id) {
    return await fetchWithAuth(`/reasons/${id}`, {
        method: "DELETE"
    });
}
export const getReason = (id) => fetchWithAuth(`/reasons/${id}`);
export const updateReason = (id, data) => fetchWithAuth(`/reasons/${id}`, { method: "PUT", body: JSON.stringify(data) });

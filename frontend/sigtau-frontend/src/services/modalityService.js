import { fetchWithAuth } from "./api";

export async function getModalities() {
    const data = await fetchWithAuth("/modalities");
    return data;
}
export async function createModality(modality) {
  return await fetchWithAuth("/modalities", {
        method: "POST",
        body: JSON.stringify(modality)
    });     
}

export async function deleteModality(id) {
    return await fetchWithAuth(`/modalities/${id}`, {
        method: "DELETE"
    });
}
export const getModality = (id) => fetchWithAuth(`/modalities/${id}`);
export const updateModality = (id, data) => fetchWithAuth(`/modalities/${id}`, { method: "PUT", body: JSON.stringify(data) });

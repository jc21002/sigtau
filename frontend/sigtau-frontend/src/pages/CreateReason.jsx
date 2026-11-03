import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import { createReason, getReason, updateReason } from "../services/reasonService";

export default function CreateReason() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", description: "" });
    const [ready, setReady] = useState(!id);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    useEffect(() => {
        if (!id) return;
        let active = true;
        getReason(id).then(data => {
            if (active) {
                setForm({ name: data.name, description: data.description || "" });
                setReady(true);
            }
        }).catch(error => {
            if (active) setMsg({ type: "danger", text: error.message });
        });
        return () => { active = false; };
    }, [id]);
    async function submit(event) {
        event.preventDefault();
        if (!form.name.trim()) {
            setMsg({ type: "danger", text: "El nombre es obligatorio" });
            return;
        }
        setSaving(true);
        try {
            const data = { name: form.name.trim(), description: form.description.trim() };
            if (id) await updateReason(id, data);
            else await createReason(data);
            navigate("/reasons");
        } catch (error) {
            setMsg({ type: "danger", text: error.message });
        } finally { setSaving(false); }
    }
    return <>
        <Navbar />
        <main className="container mt-4" style={{ maxWidth: 600 }}>
            <h2>{id ? "Editar motivo" : "Crear motivo"}</h2>
            <Banner msg={msg} onClose={() => setMsg(null)} />
            {!ready && !msg && <p role="status">Cargando...</p>}
            <form onSubmit={submit} className="card card-body shadow-sm">
                <fieldset disabled={!ready || saving}>
                    <label htmlFor="catalog-name" className="form-label">Nombre *</label>
                    <input id="catalog-name" className="form-control mb-3" required maxLength={100}
                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <label htmlFor="catalog-description" className="form-label">Descripción</label>
                    <textarea id="catalog-description" className="form-control mb-3" maxLength={255}
                        value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    <button className="btn btn-primary" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
                </fieldset>
                <button type="button" className="btn btn-outline-secondary mt-2" onClick={() => navigate("/reasons")}>Cancelar</button>
            </form>
        </main>
    </>;
}

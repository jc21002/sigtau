import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import { getRoles } from "../services/roleService";
import { createUser, getUser, updateUser } from "../services/userService";

/** El ADMIN crea tutores, administradores o estudiantes y puede cambiar roles. */
function UserForm() {
    const { id } = useParams();
    const editing = Boolean(id);
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", roleId: "" });
    const [roles, setRoles] = useState([]);
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                setRoles(await getRoles());
                if (editing) {
                    const u = await getUser(id);
                    setForm({ name: u.name, email: u.email, phone: u.phone || "", password: "", roleId: u.roleId });
                }
            } catch (e) {
                setMsg({ type: "danger", text: e.message });
            }
        })();
    }, [id, editing]);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...form, roleId: Number(form.roleId) };
            if (editing && !payload.password) delete payload.password;
            if (editing) await updateUser(id, payload);
            else await createUser(payload);
            navigate("/users");
        } catch (error) {
            setMsg({ type: "danger", text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-5">
                        <div className="card shadow-sm">
                            <div className="card-header bg-primary text-white py-3">
                                <h4 className="mb-0">{editing ? "Editar usuario" : "Nuevo usuario"}</h4>
                            </div>
                            <form className="card-body p-4" onSubmit={handleSubmit}>
                                <Banner msg={msg} onClose={() => setMsg(null)} />
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Nombre *</label>
                                    <input className="form-control" value={form.name} onChange={set("name")} maxLength={100} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Correo *</label>
                                    <input type="email" className="form-control" value={form.email} onChange={set("email")} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Teléfono *</label>
                                    <input className="form-control" value={form.phone} onChange={set("phone")} maxLength={20} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">
                                        Contraseña {editing ? "(dejar vacío para conservar)" : "*"}
                                    </label>
                                    <input type="password" className="form-control" value={form.password} onChange={set("password")}
                                        minLength={6} maxLength={64} required={!editing} />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-semibold">Rol *</label>
                                    <select className="form-select" value={form.roleId} onChange={set("roleId")} required>
                                        <option value="">Seleccione...</option>
                                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="d-grid gap-2">
                                    <button className="btn btn-primary" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/users")}>Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default UserForm;

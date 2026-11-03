import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, deleteUser } from "../services/userService";
import Navbar from "../components/Navbar";
import Banner from "../components/Banner";

const BADGE = { ADMIN: "bg-danger", TUTOR: "bg-info text-dark", STUDENT: "bg-primary" };

function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [msg, setMsg] = useState(null);

    const load = useCallback(() => getUsers()
        .then(setUsers)
        .catch(e => setMsg({ type: "danger", text: e.message })), []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (u) => {
        if (!window.confirm(`¿Eliminar a ${u.name}?`)) return;
        try {
            await deleteUser(u.id);
            setMsg({ type: "success", text: "Usuario eliminado" });
            await load();
        } catch (e) {
            setMsg({ type: "danger", text: e.message });
        }
    };

    return (
        <>
            <Navbar />
            <div className="container">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="text-primary mb-0">Usuarios</h2>
                    <button className="btn btn-success" onClick={() => navigate("/users/new")}>+ Nuevo usuario</button>
                </div>
                <Banner msg={msg} onClose={() => setMsg(null)} />

                {users.length === 0 ? (
                    <div className="alert alert-info text-center">No hay usuarios registrados</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover table-bordered align-middle">
                            <thead className="table-dark">
                                <tr><th>ID</th><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Rol</th><th>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.id}</td>
                                        <td>{u.name}</td>
                                        <td>{u.phone || "N/A"}</td>
                                        <td>{u.email}</td>
                                        <td><span className={`badge ${BADGE[u.roleName] || "bg-secondary"}`}>{u.roleName}</span></td>
                                        <td className="text-nowrap">
                                            <button className="btn btn-primary btn-sm me-1" onClick={() => navigate(`/users/edit/${u.id}`)}>Editar</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

export default Users;

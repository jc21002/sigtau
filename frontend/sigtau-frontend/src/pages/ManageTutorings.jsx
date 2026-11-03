import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import { getMyTutorings, deleteTutoring } from "../services/tutoringService";
import { fmtTime } from "../utils/format";

/** Tutor: sus tutorías. Admin: todas. */
function ManageTutorings() {
    const navigate = useNavigate();
    const role = localStorage.getItem("role");
    const [items, setItems] = useState([]);
    const [msg, setMsg] = useState(null);

    const load = useCallback(() => getMyTutorings()
        .then(setItems)
        .catch(e => setMsg({ type: "danger", text: e.message })), []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (t) => {
        if (!window.confirm(`¿Eliminar la tutoría "${t.title}"?`)) return;
        try {
            await deleteTutoring(t.id);
            setMsg({ type: "success", text: "Tutoría eliminada" });
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
                    <h2 className="text-primary mb-0">{role === "ADMIN" ? "Todas las tutorías" : "Mis tutorías"}</h2>
                    <button className="btn btn-success" onClick={() => navigate("/tutorings/new")}>+ Nueva tutoría</button>
                </div>
                <Banner msg={msg} onClose={() => setMsg(null)} />

                {items.length === 0 ? (
                    <div className="alert alert-info text-center">No hay tutorías registradas</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover table-bordered align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>Título</th><th>Materia</th><th>Fecha</th><th>Horario</th>
                                    {role === "ADMIN" && <th>Tutor</th>}
                                    <th>Inscritos</th><th>Estado</th><th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((t) => (
                                    <tr key={t.id}>
                                        <td>{t.title}</td>
                                        <td>{t.subjectName}</td>
                                        <td>{t.tutoringDate}</td>
                                        <td>{fmtTime(t.startTime)} – {fmtTime(t.endTime)}</td>
                                        {role === "ADMIN" && <td>{t.tutorName}</td>}
                                        <td>{t.capacity - t.availableSpots} / {t.capacity}</td>
                                        <td>
                                            <span className={`badge ${t.status === "OPEN" ? "bg-success" : "bg-secondary"}`}>
                                                {t.status === "OPEN" ? "Abierta" : "Cerrada"}
                                            </span>
                                        </td>
                                        <td className="text-nowrap">
                                            <button className="btn btn-outline-primary btn-sm me-1"
                                                onClick={() => navigate(`/enrollments?tutoringId=${t.id}`)}>Inscritos</button>
                                            <button className="btn btn-primary btn-sm me-1"
                                                onClick={() => navigate(`/tutorings/edit/${t.id}`)}>Editar</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t)}>Eliminar</button>
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

export default ManageTutorings;

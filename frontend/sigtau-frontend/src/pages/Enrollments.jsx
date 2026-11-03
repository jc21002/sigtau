import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import { getEnrollments, cancelEnrollment } from "../services/enrollmentService";
import { fmtDateTime, fmtTime } from "../utils/format";

/** Tutor: inscritos en sus tutorías. Admin: todas las inscripciones (y puede cancelarlas). */
function Enrollments() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const tutoringId = params.get("tutoringId");
    const role = localStorage.getItem("role");
    const [items, setItems] = useState([]);
    const [msg, setMsg] = useState(null);

    const load = useCallback(() => getEnrollments(tutoringId)
        .then(setItems)
        .catch(e => setMsg({ type: "danger", text: e.message })), [tutoringId]);

    useEffect(() => { load(); }, [load]);

    const handleCancel = async (e) => {
        if (!window.confirm(`¿Cancelar la inscripción de ${e.studentName}?`)) return;
        try {
            await cancelEnrollment(e.id, null);
            setMsg({ type: "success", text: "Inscripción cancelada" });
            await load();
        } catch (err) {
            setMsg({ type: "danger", text: err.message });
        }
    };

    return (
        <>
            <Navbar />
            <div className="container">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="text-primary mb-0">{tutoringId ? "Inscritos en la tutoría" : "Inscripciones"}</h2>
                    {tutoringId && (
                        <button className="btn btn-outline-secondary" onClick={() => navigate("/enrollments")}>Ver todas</button>
                    )}
                </div>
                <Banner msg={msg} onClose={() => setMsg(null)} />

                {items.length === 0 ? (
                    <div className="alert alert-info text-center">No hay inscripciones</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover table-bordered align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>Estudiante</th><th>Correo</th><th>Tutoría</th><th>Fecha</th>
                                    <th>Horario</th><th>Inscrito el</th><th>Estado</th>
                                    {role === "ADMIN" && <th></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((e) => (
                                    <tr key={e.id}>
                                        <td>{e.studentName}</td>
                                        <td>{e.studentEmail}</td>
                                        <td>{e.tutoringTitle}</td>
                                        <td>{e.tutoringDate}</td>
                                        <td>{fmtTime(e.startTime)} – {fmtTime(e.endTime)}</td>
                                        <td>{fmtDateTime(e.enrolledAt)}</td>
                                        <td>
                                            <span className={`badge ${e.status === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>
                                                {e.status === "ACTIVE" ? "Activa" : "Cancelada"}
                                            </span>
                                        </td>
                                        {role === "ADMIN" && (
                                            <td>
                                                {e.status === "ACTIVE" && (
                                                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleCancel(e)}>Cancelar</button>
                                                )}
                                            </td>
                                        )}
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

export default Enrollments;

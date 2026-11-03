import { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import { getMyEnrollments, cancelEnrollment } from "../services/enrollmentService";
import { getReasons } from "../services/reasonService";
import { fmtTime } from "../utils/format";

/** Inscripciones del estudiante autenticado, con opción de cancelar. */
function MyEnrollments() {
    const [items, setItems] = useState([]);
    const [reasons, setReasons] = useState([]);
    const [target, setTarget] = useState(null);
    const [reasonId, setReasonId] = useState("");
    const [msg, setMsg] = useState(null);

    const load = useCallback(() => getMyEnrollments()
        .then(setItems)
        .catch(e => setMsg({ type: "danger", text: e.message })), []);

    useEffect(() => {
        load();
        getReasons().then(setReasons).catch(() => {});
    }, [load]);

    const confirmCancel = async () => {
        try {
            await cancelEnrollment(target.id, reasonId ? Number(reasonId) : null);
            setMsg({ type: "success", text: "Inscripción cancelada" });
            setTarget(null);
            setReasonId("");
            await load();
        } catch (e) {
            setMsg({ type: "danger", text: e.message });
        }
    };

    return (
        <>
            <Navbar />
            <div className="container">
                <h2 className="text-primary mb-3">Mis inscripciones</h2>
                <Banner msg={msg} onClose={() => setMsg(null)} />

                {target && (
                    <div className="card border-warning mb-4">
                        <div className="card-body">
                            <h6>Cancelar inscripción en "{target.tutoringTitle}"</h6>
                            <select className="form-select mb-3" value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
                                <option value="">Motivo (opcional)</option>
                                {reasons.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <button className="btn btn-danger me-2" onClick={confirmCancel}>Confirmar cancelación</button>
                            <button className="btn btn-outline-secondary" onClick={() => setTarget(null)}>Volver</button>
                        </div>
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="alert alert-info text-center">Aún no te has inscrito en ninguna tutoría</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover table-bordered align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th>Tutoría</th><th>Materia</th><th>Fecha</th><th>Horario</th>
                                    <th>Tutor</th><th>Estado</th><th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((e) => (
                                    <tr key={e.id}>
                                        <td>{e.tutoringTitle}</td>
                                        <td>{e.subjectName}</td>
                                        <td>{e.tutoringDate}</td>
                                        <td>{fmtTime(e.startTime)} – {fmtTime(e.endTime)}</td>
                                        <td>{e.tutorName}</td>
                                        <td>
                                            <span className={`badge ${e.status === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>
                                                {e.status === "ACTIVE" ? "Activa" : "Cancelada"}
                                            </span>
                                            {e.reasonName && <div className="small text-muted">{e.reasonName}</div>}
                                        </td>
                                        <td>
                                            {e.status === "ACTIVE" && (
                                                <button className="btn btn-outline-danger btn-sm" onClick={() => setTarget(e)}>
                                                    Cancelar
                                                </button>
                                            )}
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

export default MyEnrollments;

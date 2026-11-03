import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import { getSubjects, deleteSubject } from "../services/subjectService";
import { getCareers } from "../services/careerService";

function Subjects() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [careers, setCareers] = useState([]);
    const [careerId, setCareerId] = useState("");
    const [msg, setMsg] = useState(null);

    const load = useCallback(() => getSubjects(careerId || null)
        .then(setItems)
        .catch(e => setMsg({ type: "danger", text: e.message })), [careerId]);

    useEffect(() => { getCareers().then(setCareers).catch(() => {}); }, []);
    useEffect(() => { load(); }, [load]);

    const handleDelete = async (s) => {
        if (!window.confirm(`¿Eliminar la materia "${s.name}"?`)) return;
        try {
            await deleteSubject(s.id);
            setMsg({ type: "success", text: "Materia eliminada" });
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
                    <h2 className="text-primary mb-0">Materias</h2>
                    <button className="btn btn-success" onClick={() => navigate("/subjects/new")}>+ Nueva materia</button>
                </div>
                <Banner msg={msg} onClose={() => setMsg(null)} />

                <select className="form-select mb-3" style={{ maxWidth: 320 }} value={careerId} onChange={(e) => setCareerId(e.target.value)}>
                    <option value="">Todas las carreras</option>
                    {careers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                {items.length === 0 ? (
                    <div className="alert alert-info text-center">No hay materias registradas</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover table-bordered align-middle">
                            <thead className="table-dark">
                                <tr><th>Materia</th><th>Carrera</th><th>Descripción</th><th>Acciones</th></tr>
                            </thead>
                            <tbody>
                                {items.map((s) => (
                                    <tr key={s.id}>
                                        <td>{s.name}</td>
                                        <td>{s.careerName}</td>
                                        <td>{s.description || "—"}</td>
                                        <td className="text-nowrap">
                                            <button className="btn btn-primary btn-sm me-1" onClick={() => navigate(`/subjects/edit/${s.id}`)}>Editar</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s)}>Eliminar</button>
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

export default Subjects;

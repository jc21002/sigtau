import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { deleteReason, getReasons } from "../services/reasonService";

function Reasons() {
    const navigate = useNavigate();
    const [reasons, setReasons] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }

        async function fetchData() {
            try {
                const data = await getReasons();
                setReasons(data);
            } catch (error) {
                console.error(error);
                alert("Error al cargar motivos");
            }
        }
        fetchData();
    }, [navigate]);

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que desea eliminar este motivo?")) {
            return;
        }
        try {
            await deleteReason(id);
            alert("Motivo eliminado");
            setReasons(reasons.filter(r => r.id !== id));
        } catch (error) {
            console.error(error);
            alert("Error al eliminar el motivo");
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-primary">Motivos de Cancelación</h2>
                    <button 
                        className="btn btn-success"
                        onClick={() => navigate("/create-reason")}
                    >
                        + Nuevo Motivo
                    </button>
                </div>

                {reasons.length === 0 ? (
                    <div className="alert alert-info text-center">
                        No hay motivos registrados
                    </div>
                ) : (
                    <div className="row row-cols-1 row-cols-md-3 g-4">
                        {reasons.map(r => (
                            <div key={r.id} className="col">
                                <div className="card h-100 shadow-sm">
                                    <div className="card-body">
                                        <h5 className="card-title text-primary">{r.name}</h5>
                                        <p className="card-text">
                                            {r.description || "Sin descripción"}
                                        </p>
                                    </div>
                                    <div className="card-footer bg-white border-top-0">
                                        <div className="d-flex gap-2">
                                            <button 
                                                className="btn btn-primary btn-sm flex-grow-1"
                                                onClick={() => navigate(`/reasons/edit/${r.id}`)}
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                className="btn btn-danger btn-sm flex-grow-1"
                                                onClick={() => handleDelete(r.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default Reasons;

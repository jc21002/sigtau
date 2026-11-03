import { useEffect, useState } from "react";
import { getModalities, deleteModality } from "../services/modalityService";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Modalities() {
    const navigate = useNavigate();
    const [modalities, setModalities] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }

        async function fetchData() {
            try {
                const data = await getModalities();
                setModalities(data);
            } catch (error) {
                console.error(error);
                alert("Error al cargar modalidades");
            }
        }
        fetchData();
    }, [navigate]);

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que desea eliminar esta modalidad?")) {
            return;
        }
        try {
            await deleteModality(id);
            alert("Modalidad eliminada");
            setModalities(modalities.filter(p => p.id !== id));
        } catch (error) {
            console.error(error);
            alert("Error al eliminar modalidad");
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-primary">Modalidades</h2>
                    <button 
                        className="btn btn-success"
                        onClick={() => navigate("/create-modality")}
                    >
                        + Nueva Modalidad
                    </button>
                </div>

                {modalities.length === 0 ? (
                    <div className="alert alert-info text-center">
                        No hay modalidades registradas
                    </div>
                ) : (
                    <div className="row row-cols-1 row-cols-md-3 g-4">
                        {modalities.map(p => (
                            <div key={p.id} className="col">
                                <div className="card h-100 shadow-sm">
                                    <div className="card-body">
                                        <h5 className="card-title text-primary">{p.name}</h5>
                                        <p className="card-text">
                                            {p.description || "Sin descripción"}
                                        </p>
                                    </div>
                                    <div className="card-footer bg-white border-top-0">
                                        <div className="d-flex gap-2">
                                            <button 
                                                className="btn btn-primary btn-sm flex-grow-1"
                                                onClick={() => navigate(`/modalities/edit/${p.id}`)}
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                className="btn btn-danger btn-sm flex-grow-1"
                                                onClick={() => handleDelete(p.id)}
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

export default Modalities;

import { useEffect, useState } from "react";
import { getCareers, deleteCareer } from "../services/careerService";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Careers() {
    const navigate = useNavigate();
    const [careers, setCareers] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }

        async function fetchData() {
            try {
                const data = await getCareers();
                setCareers(data);
            } catch (error) {
                console.error(error);
                alert("Error al cargar carreras");
            }
        }
        fetchData();
    }, [navigate]);

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que desea eliminar esta carrera?")) {
            return;
        }
        try {
            await deleteCareer(id);
            alert("Carrera eliminada");
            setCareers(careers.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
            alert("Error al eliminar carrera");
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-primary">Carreras</h2>
                    <button 
                        className="btn btn-success"
                        onClick={() => navigate("/create-career")}
                    >
                        + Nueva Carrera
                    </button>
                </div>

                {careers.length === 0 ? (
                    <div className="alert alert-info text-center">
                        No hay carreras registradas
                    </div>
                ) : (
                    <div className="row row-cols-1 row-cols-md-3 g-4">
                        {careers.map(c => (
                            <div key={c.id} className="col">
                                <div className="card h-100 shadow-sm">
                                    <div className="card-body">
                                        <h5 className="card-title text-primary">{c.name}</h5>
                                        <p className="card-text">
                                            {c.description || "Sin descripción"}
                                        </p>
                                    </div>
                                    <div className="card-footer bg-white border-top-0">
                                        <div className="d-flex gap-2">
                                            <button 
                                                className="btn btn-primary btn-sm flex-grow-1"
                                                onClick={() => navigate(`/careers/edit/${c.id}`)}
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                className="btn btn-danger btn-sm flex-grow-1"
                                                onClick={() => handleDelete(c.id)}
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

export default Careers;

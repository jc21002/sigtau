import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Tutorings from "./pages/Tutorings";
import MyEnrollments from "./pages/MyEnrollments";
import ManageTutorings from "./pages/ManageTutorings";
import TutoringForm from "./pages/TutoringForm";
import Enrollments from "./pages/Enrollments";

import Careers from "./pages/Careers";
import CreateCareer from "./pages/CreateCareer";
import EditCareer from "./pages/EditCareer";
import Subjects from "./pages/Subjects";
import SubjectForm from "./pages/SubjectForm";
import Modalities from "./pages/Modalities";
import CreateModality from "./pages/CreateModality";
import Reasons from "./pages/Reasons";
import CreateReason from "./pages/CreateReason";
import Users from "./pages/Users";
import UserForm from "./pages/UserForm";

const ALL = ["STUDENT", "TUTOR", "ADMIN"];
const STAFF = ["TUTOR", "ADMIN"];
const ADMIN = ["ADMIN"];

const guard = (roles, element) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;

function App() {
    return (
        <Routes>
            {/* Públicas */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Estudiante */}
            <Route path="/tutorings" element={guard(ALL, <Tutorings />)} />
            <Route path="/my-enrollments" element={guard(["STUDENT"], <MyEnrollments />)} />

            {/* Tutor / Admin */}
            <Route path="/manage-tutorings" element={guard(STAFF, <ManageTutorings />)} />
            <Route path="/tutorings/new" element={guard(STAFF, <TutoringForm />)} />
            <Route path="/tutorings/edit/:id" element={guard(STAFF, <TutoringForm />)} />
            <Route path="/enrollments" element={guard(STAFF, <Enrollments />)} />

            {/* Solo Admin */}
            <Route path="/careers" element={guard(ADMIN, <Careers />)} />
            <Route path="/create-career" element={guard(ADMIN, <CreateCareer />)} />
            <Route path="/careers/edit/:id" element={guard(ADMIN, <EditCareer />)} />
            <Route path="/subjects" element={guard(ADMIN, <Subjects />)} />
            <Route path="/subjects/new" element={guard(ADMIN, <SubjectForm />)} />
            <Route path="/subjects/edit/:id" element={guard(ADMIN, <SubjectForm />)} />
            <Route path="/modalities" element={guard(ADMIN, <Modalities />)} />
            <Route path="/modalities/edit/:id" element={guard(ADMIN, <CreateModality key="edit" />)} />
            <Route path="/create-modality" element={guard(ADMIN, <CreateModality key="new" />)} />
            <Route path="/reasons" element={guard(ADMIN, <Reasons />)} />
            <Route path="/reasons/edit/:id" element={guard(ADMIN, <CreateReason key="edit" />)} />
            <Route path="/create-reason" element={guard(ADMIN, <CreateReason key="new" />)} />
            <Route path="/users" element={guard(ADMIN, <Users />)} />
            <Route path="/users/new" element={guard(ADMIN, <UserForm />)} />
            <Route path="/users/edit/:id" element={guard(ADMIN, <UserForm />)} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;

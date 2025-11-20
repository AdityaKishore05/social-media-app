import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
    const isAuth = Boolean(useSelector((state) => state.token));

    if (!isAuth) {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;

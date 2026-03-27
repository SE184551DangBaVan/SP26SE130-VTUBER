import { Outlet, Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { showSuccess, showError, showLoading, updateToast } from './toastUtils';

const UserAuthenticated = ({ user }) => {
    useEffect(() => {
        if (user) {
            const id = showLoading("Loading...");

            setTimeout(() => {
                updateToast(id, "error", "You already logged in baka! >_<");
            }, 100);
        }
    }, [user]);

    if (user) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default UserAuthenticated;
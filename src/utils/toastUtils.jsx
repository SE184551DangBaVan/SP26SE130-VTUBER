import { toast } from 'react-toastify';

export const showSuccess = (message) => toast.success(message);
export const showError = (message) => toast.error(message);
export const showLoading = (message = "Loading...") => toast.loading(message);
export const updateToast = (toastId, type = "success", message = "") => {
  toast.update(toastId, {
    render: message,
    type,
    isLoading: false,
    autoClose: 3000,
    closeButton: true,
  });
};
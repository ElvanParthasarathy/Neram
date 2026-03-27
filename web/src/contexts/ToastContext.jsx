import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toastMsg, setToastMsg] = useState('');

    const showToast = useCallback((msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 2500);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toastMsg && createPortal(
                <div className="admin-toast-popup animate-slide-up">
                    {toastMsg}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

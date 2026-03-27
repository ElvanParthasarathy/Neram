import React from 'react';
import { AuthLayout } from '../auth/AuthComponents';
import Logo from '../../assets/branding/neram-full.svg'; // Using the SVG logo like in Login/Signup
import '../../styles/components/splash.css'; // Keep for specific spinner styles if needed, or inline them

const SplashScreen = () => {
    return (
        <AuthLayout>
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                gap: '24px'
            }}>
                {/* Logo */}
                <img
                    src={Logo}
                    alt="Neram"
                    className="animate-zoom auth-logo-themed"
                    style={{ width: '120px', height: 'auto' }}
                />

                {/* Spinner */}
                <div className="splash-spinner animate-enter delay-1">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="bar"></div>
                    ))}
                </div>
            </div>
        </AuthLayout>
    );
};

export default SplashScreen;

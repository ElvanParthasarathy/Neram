import React from 'react';
import Logo from '../assets/neram.svg';
import '../styles/splash.css';

const SplashScreen = () => {
    return (
        <div className="splash-container">
            {/* Logo */}
            <img src={Logo} alt="Neram" className="splash-logo" />

            {/* iOS Spinner (No Text as requested) */}
            <div className="splash-spinner">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="bar"></div>
                ))}
            </div>
        </div>
    );
};

export default SplashScreen;

import React, { useState, useEffect } from "react";
import {
    RiCheckboxCircleFill,
    RiCheckboxBlankCircleLine,
} from "react-icons/ri";
import { SubHeader, SettingsGroup, ToggleSwitch } from "./SettingsShared";

const DisplaySettings = ({ onBack }) => {
    // Read current theme from html class
    const getInitialTheme = () => {
        const saved = localStorage.getItem("neram-theme");
        if (saved) return saved;
        return "auto";
    };

    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        const handleStorageChange = () => {
            setTheme(localStorage.getItem("neram-theme") || "auto");
        };

        window.addEventListener("theme-change", handleStorageChange);
        return () =>
            window.removeEventListener("theme-change", handleStorageChange);
    }, []);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem("neram-theme", newTheme);
        window.dispatchEvent(new Event("theme-change"));

        const html = document.documentElement;

        if (newTheme === "auto") {
            const prefersDark = window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;
            html.classList.toggle("dark", prefersDark);
        } else if (newTheme === "dark") {
            html.classList.add("dark");
        } else {
            html.classList.remove("dark");
        }
    };

    return (
        <>
            <SubHeader title="Display" onBack={onBack} />

            <SettingsGroup>
                {/* Light / Dark Preview */}
                <div className="s2-theme-row">
                    <button
                        className="s2-theme-option"
                        onClick={() => handleThemeChange("light")}
                    >
                        <div
                            className={`s2-theme-preview light-preview ${theme === "light" ? "selected" : ""}`}
                        >
                            <div className="s2-theme-bar" />
                            <div className="s2-theme-line" />
                            <div className="s2-theme-line short" />
                        </div>
                        <span
                            className={`s2-theme-label ${theme === "light" ? "selected" : ""}`}
                        >
                            Light
                        </span>
                        <span
                            className={`s2-theme-radio ${theme === "light" ? "selected" : "unselected"}`}
                        >
                            {theme === "light" ? (
                                <RiCheckboxCircleFill />
                            ) : (
                                <RiCheckboxBlankCircleLine />
                            )}
                        </span>
                    </button>

                    <button
                        className="s2-theme-option"
                        onClick={() => handleThemeChange("dark")}
                    >
                        <div
                            className={`s2-theme-preview dark-preview ${theme === "dark" ? "selected" : ""}`}
                        >
                            <div className="s2-theme-bar" />
                            <div className="s2-theme-line" />
                            <div className="s2-theme-line short" />
                        </div>
                        <span
                            className={`s2-theme-label ${theme === "dark" ? "selected" : ""}`}
                        >
                            Dark
                        </span>
                        <span
                            className={`s2-theme-radio ${theme === "dark" ? "selected" : "unselected"}`}
                        >
                            {theme === "dark" ? (
                                <RiCheckboxCircleFill />
                            ) : (
                                <RiCheckboxBlankCircleLine />
                            )}
                        </span>
                    </button>
                </div>

                {/* Divider */}
                <div
                    style={{
                        height: 1,
                        background: "var(--mac-divider)",
                        margin: "0 24px",
                    }}
                />

                {/* System Auto Toggle */}
                <div className="s2-auto-row" style={{ paddingTop: 16 }}>
                    <div className="s2-auto-text">
                        <div className="s2-auto-title">System Auto</div>
                        <div className="s2-auto-desc">
                            Follow your device's theme settings
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={theme === "auto"}
                        onChange={(v) =>
                            handleThemeChange(v ? "auto" : "light")
                        }
                    />
                </div>
            </SettingsGroup>
        </>
    );
};

export default DisplaySettings;

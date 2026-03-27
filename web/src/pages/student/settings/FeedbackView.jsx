import React, { useState } from "react";
import { auth } from "../../../firebase";
import { firestore } from "../../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
    RiUser3Line,
    RiPhoneLine,
    RiMailLine,
    RiMessage2Line,
    RiSendPlaneFill,
    RiLoader4Line,
    RiCheckboxCircleLine,
    RiErrorWarningLine,
} from "react-icons/ri";
import { SubHeader, InputWithIcon } from "./SettingsShared";

const FeedbackView = ({ userProfile, onBack }) => {
    const user = auth.currentUser;
    const [name, setName] = useState(userProfile?.displayName || user?.displayName || "");
    const [mobile, setMobile] = useState(userProfile?.mobile || "");
    const [email, setEmail] = useState(userProfile?.email || user?.email || "");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState(null); // success, error
    const [statusMsg, setStatusMsg] = useState("");

    // Keep fields in sync if profile matures
    React.useEffect(() => {
        if (userProfile) {
            if (userProfile.displayName && !name) setName(userProfile.displayName);
            if (userProfile.email && !email) setEmail(userProfile.email);
            if (userProfile.mobile && !mobile) setMobile(userProfile.mobile);
        }
    }, [userProfile]);

    const handleSubmit = async () => {
        if (!name || !mobile || !email || !message) {
            setStatus("error");
            setStatusMsg("Please fill in all fields.");
            return;
        }

        setIsSubmitting(true);
        setStatus(null);

        try {
            // 1. Save to Firestore
            await addDoc(collection(firestore, "messages"), {
                name,
                mobile,
                email,
                message,
                userId: user?.uid || "anonymous",
                timestamp: serverTimestamp(),
                displayDate: new Date().toLocaleString()
            });

            // 2. Send Emails via EmailJS
            const templateParams = {
                name,
                mobile,
                email,
                message
            };

            const sendEmail = async (templateId) => {
                await fetch("https://api.emailjs.com/api/v1.0/email/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        service_id: "service_3is5tzm",
                        template_id: templateId,
                        user_id: "xUUhrJixZP50tgnjb",
                        template_params: templateParams
                    })
                });
            };

            await Promise.all([
                sendEmail("template_2bv1fe4"), // Admin
                sendEmail("template_t86inab")  // Auto-reply
            ]);

            setStatus("success");
            setStatusMsg("Feedback sent successfully!");
            // Clear message only, keep contact info
            setMessage("");
        } catch (e) {
            console.error("Feedback failed:", e);
            setStatus("error");
            setStatusMsg("Failed to send feedback. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <SubHeader title="Complaints / Feedback" onBack={onBack} />

            <div className="s2-complaint-form">
                <InputWithIcon
                    icon={RiUser3Line}
                    label="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="s2-input-card-bg"
                />
                <InputWithIcon
                    icon={RiPhoneLine}
                    label="Mobile Number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Mobile Number"
                    type="tel"
                    className="s2-input-card-bg"
                />
                <InputWithIcon
                    icon={RiMailLine}
                    label="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    type="email"
                    className="s2-input-card-bg"
                />
                <InputWithIcon
                    icon={RiMessage2Line}
                    label="Your Message / Review / Query"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Your Message / Review / Query"
                    multiline
                    className="s2-input-card-bg"
                />

                <button
                    className="s2-complaint-submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <RiLoader4Line className="s2-spin" size={20} />
                            Sending...
                        </>
                    ) : (
                        <>
                            Send Message
                            <RiSendPlaneFill size={18} />
                        </>
                    )}
                </button>

                {status && (
                    <div className={`s2-complaint-status ${status}`}>
                        {status === "success" ? <RiCheckboxCircleLine size={18} /> : <RiErrorWarningLine size={18} />}
                        {statusMsg}
                    </div>
                )}
            </div>
        </>
    );
};

export default FeedbackView;

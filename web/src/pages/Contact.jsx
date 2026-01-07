import React, { useState } from "react";
// 1. Import Icons
import { FaPhoneAlt, FaEnvelope, FaLinkedin, FaGithub, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";

// 2. Import Firebase functions
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; 

// 3. Import EmailJS
import emailjs from '@emailjs/browser';

// 4. Import 'firestore' but call it 'db'
import { firestore as db } from "../firebase"; 

const Contact = () => {
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Standard Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const serviceID = import.meta.env.VITE_SERVICE_ID;
    const adminTemplateID = import.meta.env.VITE_TEMPLATE_ID;
    const autoReplyTemplateID = import.meta.env.VITE_AUTO_REPLY_ID;
    const publicKey = import.meta.env.VITE_PUBLIC_KEY;

    const templateParams = {
      name: formData.name,
      mobile: formData.mobile, 
      email: formData.email,
      message: formData.message,
    };

    try {
      await addDoc(collection(db, "messages"), {
        ...formData,
        timestamp: serverTimestamp(),
      });

      await emailjs.send(serviceID, adminTemplateID, templateParams, publicKey);
      await emailjs.send(serviceID, autoReplyTemplateID, templateParams, publicKey);

      alert("Message sent successfully! Please check your email for a confirmation.");
      setFormData({ name: "", mobile: "", email: "", message: "" }); 

    } catch (error) {
      console.error("FAILED...", error);
      alert(`Something went wrong: ${error.text || "Please check your internet connection."}`);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="contact-view">
      
      {/* 👇 NEW PAGE HEADER (Matches College Sites Style) 👇 */}
      <div className="page-header">
        <h1 className="page-title">Contact & Complaints</h1>
        <p className="page-subtitle">Reach out for queries, feedback, or grievance redressal.</p>
      </div>

      <div className="contact-container">
        <main className="contact-content">
          
          {/* LEFT SIDE: Profile + Contact Info */}
          <section className="details-section">
            
            {/* Profile Intro (Inside the box as requested previously) */}
            <header className="hero-header profile-intro">
              <p className="greeting">Hello, I Am</p>
              <h1 className="name-primary">Jaiprakash Parthasarathy</h1>
              <p className="name-alias">(Also known as: Elvan Parthasarathy)</p>
              
              <a 
                href="https://jaiprakashpartha.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="link-portfolio"
              >
                Visit My Portfolio
              </a>
            </header>
            
            <hr className="divider-line" />

            {/* Sub-section Title */}
            <h2 className="section-title">Contact Info</h2>

            <div className="details-list">
              <a href="tel:+919345128797" className="detail-item">
                <FaPhoneAlt className="item-icon" />
                <span className="detail-text">+91 93451 28797</span>
              </a>
              <a href="mailto:jaiprakashpartha@gmail.com" className="detail-item">
                <FaEnvelope className="item-icon" />
                <span className="detail-text">jaiprakashpartha@gmail.com</span>
              </a>
              <a href="https://linkedin.com/in/jaiprakashpartha" target="_blank" rel="noreferrer" className="detail-item">
                <FaLinkedin className="item-icon" />
                <span className="detail-text">/in/jaiprakashpartha</span>
              </a>
              <a href="https://github.com/elvanparthasarathy" target="_blank" rel="noreferrer" className="detail-item">
                <FaGithub className="item-icon" />
                <span className="detail-text">/elvanparthasarathy</span>
              </a>
              <div className="detail-item">
                <FaMapMarkerAlt className="item-icon" />
                <div className="location-info">
                  <div className="location-main">Arani, Tamil Nadu - 632317</div>
                  <div className="location-sub">(Currently in Chennai)</div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT SIDE: Form */}
          <section className="cta-section">
            <h2 className="section-title">Send a Message</h2>
            <p className="cta-text">
              Fill out the form below and it will reach me directly.
            </p>

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Your Name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                 <input 
                  type="tel" 
                  name="mobile" 
                  placeholder="Mobile Number" 
                  value={formData.mobile} 
                  onChange={handleChange} 
                  required 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Email Address" 
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <textarea 
                  name="message" 
                  placeholder="Your Message / Review / Query" 
                  value={formData.message} 
                  onChange={handleChange} 
                  required 
                  className="form-input form-textarea"
                ></textarea>
              </div>

              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"} <FaPaperPlane />
              </button>
            </form>
          </section>

        </main>
      </div>
    </div>
  );
}

export default Contact;
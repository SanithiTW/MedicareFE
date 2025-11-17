// src/Pages/LandingPage/LandingPage.jsx

import React, { useState, useRef } from 'react';
import Slider from 'react-slick';
import { motion, useInView } from 'framer-motion';
import CountUp from 'react-countup';
// *** NEW: Import useNavigate for routing ***
import { useNavigate } from 'react-router-dom'; 

// CRITICAL: Slick Carousel CSS Imports
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css"; 

import { LoginModal } from '../Components/UI/LoginModal';
import { RegisterDropdown } from '../Components/UI/RegisterDropdown'; // NEW Component
import './LandingPage.css';

// --- Import Assets (Ensure these paths are correct) ---
import Logo from '../assets/Logo.jpeg';
import delivary from '../assets/delivary.png';
import analysis from '../assets/analysis.png';
import stock from '../assets/stock.png';
import reminder from '../assets/reminder.png';
import priscription from '../assets/priscription.png';
import online_order from '../assets/online_order.png';
import business_analysis from '../assets/business_analysis.png';
import pharmacy_img from '../assets/pharmacy_img.png'; 
import pharmacy_icon from '../assets/pharmacy.png';
import doctor_img from '../assets/doctor.png';
import medicine_img from '../assets/medicine.png';
import user_icon from '../assets/user.png'; // NEW: Icon for Register button


// --- Lottie Animation ---
import Lottie from "lottie-react";
import ConnectionAnimation from "../assets/animations/connection-animation.json"; // Placeholder for the animation
import TextAnimation from "../assets/animations/connection-animation.json"; // Placeholder for the animation in front of text

// Social Icons (Placeholders)
import FacebookIcon from '../assets/facebook-icon.png';
import InstagramIcon from '../assets/instagram-icon.png';
import LinkedinIcon from '../assets/linkedin-icon.png';

// --- Data Definitions ---
const healthPriorityCards = [
    { title: "Health Records", icon: priscription },
    { title: "Order Medicine", icon: online_order },
    { title: "Delivery Services", icon: delivary },
    { title: "Reminders", icon: reminder },
    { title: "Stock Management", icon: stock },
    { title: "Health Reports", icon: analysis },
];

const localPharmaciesCards = [
    { title: "POS Solution", icon: priscription },
    { title: "Online Presence", icon: online_order },
    { title: "Inventory Management", icon: stock },
    { title: "Business Analysis", icon: business_analysis },
];

// --- Animation Components ---
const AnimatedCounter = ({ endValue, title }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 }); 

    return (
        <div className="count-item" ref={ref}> 
            <span className="count-number">
                {isInView ? <CountUp end={endValue} duration={2.5} separator="," /> : '0'}
                +
            </span>
            <p className="count-title">{title}</p>
        </div>
    );
};

const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { type: "spring", stiffness: 100, damping: 10 } 
    }
};

const textAnimation = {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 1, ease: "easeOut" } }
};
// --- End Animation Components ---


const LandingPage = () => {
    // *** NEW: Initialize useNavigate ***
    const navigate = useNavigate();

    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isRegisterDropdownOpen, setIsRegisterDropdownOpen] = useState(false); 
    const [activeFormTab, setActiveFormTab] = useState('doctor'); 
    
    // Ref for Register button to position the dropdown
    const registerButtonRef = useRef(null);

    // Ref for the forms section to scroll to
    const formsSectionRef = useRef(null);


    // Function to handle navigation click
    const handleNavClick = (tabName) => {
        // 1. Set the active form tab
        setActiveFormTab(tabName);
        
        // 2. Scroll to the forms section
        if (formsSectionRef.current) {
            formsSectionRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                // Adjust block position to leave space for the fixed header
                block: 'start' 
            });
        }
    };
    
    // ************************************************************
    // *** FIX: Updated function to handle registration selection ***
    // ************************************************************
    const handleRegisterSelect = (role) => {
        // CRITICAL: Close the dropdown after selection
        setIsRegisterDropdownOpen(false); 
        
        let path = '';
        
        // Determine the correct path based on the role selected in the dropdown
        if (role === 'Patient') {
            path = '/register-patient'; 
        } else if (role === 'Pharmacy') {
            path = '/register-pharmacy'; 
        } else {
            console.error("Invalid registration role selected:", role);
            return;
        }

        // Navigate to the specific registration page
        navigate(path);
    };

    const sliderSettings = {
        dots: false,
        infinite: true,
        speed: 1000,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        fade: true,
        cssEase: "linear"
    };

    return (
        <div className="landing-page">
            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={() => setIsLoginModalOpen(false)} 
            />

            {/* --- Header & Navigation (White Background) --- */}
            <header className="header">
                <div className="logo-container">
                    <img src={Logo} alt="MEDICARE" className="logo" />
                </div>

                {/* --- Navigation Links --- */}
                <nav className="main-nav">
                    <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); handleNavClick('doctor'); }}
                        className={activeFormTab === 'doctor' ? 'active-nav' : ''}
                    >
                        Doctor
                    </a>
                    <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); handleNavClick('medicine'); }}
                        className={activeFormTab === 'medicine' ? 'active-nav' : ''}
                    >
                        Medicine
                    </a>
                    <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); handleNavClick('pharmacy'); }}
                        className={activeFormTab === 'pharmacy' ? 'active-nav' : ''}
                    >
                        Pharmacy
                    </a>
                </nav>

                {/* Authentication buttons */}
                <div className="auth-buttons">
                    <button 
                        className="auth-button sign-in-btn" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsLoginModalOpen(true);
                            setIsRegisterDropdownOpen(false); // Close dropdown if opening login
                        }}
                    >
                        Sign In
                    </button>
                    <button 
                        className="auth-button register-btn"
                        ref={registerButtonRef}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsRegisterDropdownOpen(prev => !prev);
                            setIsLoginModalOpen(false); // Close login if opening dropdown
                        }}
                    >
                        <img src={user_icon} alt="User Icon" className="register-icon" />
                        Register
                    </button>
                </div>
            </header>
            
            {/* Register Dropdown Component */}
            <RegisterDropdown
                isOpen={isRegisterDropdownOpen}
                onClose={() => setIsRegisterDropdownOpen(false)}
                targetRef={registerButtonRef}
                // *** CRITICAL: Pass the updated handler for registration flow ***
                onSelect={handleRegisterSelect} 
            />

            {/* --- Main Banner/Slider Section (Starts BELOW White Header) --- */}
            <section className="main-banner">
                <Slider {...sliderSettings}>
                    <div className="slide slide-1">
                        <div className="slider-overlay"></div>
                        <motion.div 
                            className="slide-content"
                            initial="initial"
                            animate="animate"
                            variants={textAnimation}
                            key="slide-1-text"
                        >
                            <motion.h1 
                                initial={{ scale: 0.5, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                transition={{ delay: 0.5, duration: 1 }}
                            >
                                Grow Your Pharmacy
                            </motion.h1>
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: 1, duration: 1 }}
                            >
                                Reach More Patients
                            </motion.h2>
                            <button className="primary-button">Learn More</button> 
                        </motion.div>
                    </div>

                    <div className="slide slide-2">
                        <div className="slider-overlay"></div>
                        <motion.div 
                            className="slide-content center-slide-content" 
                            initial="initial"
                            animate="animate"
                            variants={textAnimation}
                            key="slide-2-text"
                        >
                            <motion.h1>Your Complete Digital</motion.h1>
                            <motion.h2>Healthcare & Pharmacy Solution</motion.h2>
                            <p>Order medicine, check availability, book appointments, and more.</p>
                            <button className="primary-button">Start Now</button> 
                        </motion.div>
                    </div>
                </Slider>
            </section>

            {/* ----------------------------------------------------------- */}
            {/* --- More Than Just a Pharmacy Section (ORDER SWAPPED) --- */}
            {/* ----------------------------------------------------------- */}
            <section className="more-than-section">
                <div className="section-content">
                    
                    {/* 1. Text Content (NOW LEFT) */}
                    <div className="text-content">
                        <div className="text-content-header">
                            
                            <h2>More Than Just a Pharmacy.</h2>
                        </div>
                        <p>We are dedicated to providing a complete healthcare ecosystem. Our platform allows users to order a universal patient care platform, delivery, and discussion with doctors.</p>
                        <p>Our goal involves **Better Healthcare, Better Access**, and **Better Convenience** for everyone in need, ensuring quality service and better health outcomes. We are here to serve **Better Health outcomes**.</p>
                    </div>

                    {/* 2. Animation Container (NOW RIGHT) */}
                    <motion.div 
                        className="animated-image-container"
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ type: "spring", stiffness: 50, damping: 10 }}
                    >
                        <Lottie 
                            animationData={ConnectionAnimation} 
                            loop={true} 
                            style={{ width: '100%', height: '100%' }}
                        />
                    </motion.div>
                </div>
            </section>

            {/* --- Your Health, Our Priority Section (Other sections unchanged as requested) --- */}
            <section className="cards-section priority-section">
                <h3>Your Health, Our Priority</h3>
                <p>Easy access to everything you need for better care.</p>
                <div className="cards-grid">
                    {healthPriorityCards.map((card, index) => (
                        <motion.div 
                            key={index} 
                            className="card-item"
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <img src={card.icon} alt={card.title} className="card-icon" />
                            <p className="card-title">{card.title}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- Helping Local Pharmacies Go Digital Section --- */}
            <section className="cards-section digital-section">
                <h3>Helping Local Pharmacies Go Digital</h3>
                <p>Partner with us and grow your pharmacy with technology.</p>
                <div className="cards-grid">
                    {localPharmaciesCards.map((card, index) => (
                        <motion.div 
                            key={index} 
                            className="card-item"
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <img src={card.icon} alt={card.title} className="card-icon" />
                            <p className="card-title">{card.title}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* --- Analysis Section (Count Down) --- */}
            <section className="analysis-section">
                <AnimatedCounter endValue={43} title="Pharmacies" />
                <AnimatedCounter endValue={43} title="Doctors" />
                <AnimatedCounter endValue={43} title="Cities and towns covered" />
            </section>

            {/* --- Ready to Experience Smarter Healthcare? (Forms) --- */}
            {/* CRITICAL CHANGE: Attach ref to the section */}
            <section className="forms-section" ref={formsSectionRef}>
                <h2>Ready to Experience Smarter Healthcare?</h2>
                <div className="form-tabs-container">
                    <div className="tab-buttons">
                        <button 
                            className={`tab-button ${activeFormTab === 'doctor' ? 'active' : ''}`}
                            onClick={() => setActiveFormTab('doctor')}
                        >
                            <img src={doctor_img} alt="Doctor Icon" />
                            Doctor
                        </button>
                        <button 
                            className={`tab-button ${activeFormTab === 'medicine' ? 'active' : ''}`}
                            onClick={() => setActiveFormTab('medicine')}
                        >
                            <img src={medicine_img} alt="Medicine Icon" />
                            Medicine
                        </button>
                        <button 
                            className={`tab-button ${activeFormTab === 'pharmacy' ? 'active' : ''}`}
                            onClick={() => setActiveFormTab('pharmacy')}
                        >
                            <img src={pharmacy_icon} alt="Pharmacy Icon" />
                            Pharmacy
                        </button>
                    </div>

                    <div className="form-content">
                        {activeFormTab === 'doctor' && (
                            <form className="search-form vertical-form doctor-form">
                                <input type="text" placeholder="Doctor Name" />
                                <input type="text" placeholder="Specialization" />
                                <input type="text" placeholder="Time" />
                                <button type="submit" className="search-button">Search Doctor</button>
                            </form>
                        )}
                        {activeFormTab === 'medicine' && (
                            <form className="search-form vertical-form medicine-form">
                                <input type="text" placeholder="Ask drug name" />
                                <input type="text" placeholder="Pharmacy Name (Optional)" />
                                <button type="submit" className="search-button">Search</button>
                            </form>
                        )}
                        {activeFormTab === 'pharmacy' && (
                            <form className="search-form vertical-form pharmacy-form">
                                <input type="text" placeholder="Pharmacy name" />
                                <input type="text" placeholder="Province" />
                                <input type="text" placeholder="City" />
                                <input type="text" placeholder="Related things to search location" />
                                <button type="submit" className="search-button">Search</button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* --- Simple Steps to Better Healthcare --- */}
            <section className="steps-section">
                <h3>Simple Steps to Better Healthcare</h3>
                <ol>
                    <li>Need and distance discussion...</li>
                    <li>Check nearby pharmacy...</li>
                    <li>Take & thank your delivery...</li>
                    <li>Take your medicine...</li>
                </ol>
            </section>

            {/* --- Footer --- */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-links-group">
                        <div className="footer-col">
                            <h4>Quick Links</h4>
                            <ul>
                                <li>About Us</li>
                                <li>Services</li>
                                <li>FAQs</li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4>Contact</h4>
                            <ul>
                                <li>Email: ...</li>
                                <li>Phone: ...</li>
                                <li>Address: ...</li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4>Support</h4>
                            <ul>
                                <li>Help Center</li>
                                <li>Terms & Conditions</li>
                                <li>Privacy Policy</li>
                            </ul>
                        </div>
                    </div>

                    <div className="social-media">
                        <p>Follow Us:</p>
                        <div className="social-icons">
                            <img src={FacebookIcon} alt="Facebook" />
                            <img src={InstagramIcon} alt="Instagram" />
                            <img src={LinkedinIcon} alt="LinkedIn" />
                        </div>
                        <img src={Logo} alt="MEDICARE" className="footer-logo" />
                    </div>
                </div>
                <div className="copyright">
                    <p>© 2025 Medicare. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
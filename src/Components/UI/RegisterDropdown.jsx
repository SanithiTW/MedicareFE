import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RegisterDropdown.css'; // Don't forget to create this CSS file

// Define the registration roles
const roles = [
    { name: 'Patient', description: 'Find doctors and order medicine' },
    
    { name: 'Pharmacy', description: 'Digitalize inventory and reach more customers' },
];

/**
 * A dropdown component for selecting a registration role.
 * It is positioned relative to the targetRef button.
 */
export const RegisterDropdown = ({ isOpen, onClose, targetRef, onSelect }) => {
    // State to hold the position calculated from the target button
    const [position, setPosition] = React.useState({ top: 0, right: 0 });

    // Calculate position when targetRef or isOpen changes
    useEffect(() => {
        if (isOpen && targetRef.current) {
            const rect = targetRef.current.getBoundingClientRect();
            // Position the dropdown below and slightly right of the button
            setPosition({
                top: rect.bottom + window.scrollY + 10, // 10px below the button
                right: window.innerWidth - rect.right - window.scrollX, // Aligned to the right edge of the button
            });
        }

        // Handle click outside to close dropdown
        const handleOutsideClick = (event) => {
            if (isOpen && targetRef.current && !targetRef.current.contains(event.target) && !event.target.closest('.register-dropdown')) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen, targetRef, onClose]);

    const dropdownVariants = {
        hidden: { opacity: 0, scale: 0.9, y: -10 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
        exit: { opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.15 } }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="register-dropdown"
                    style={{ 
                        position: 'absolute',
                        top: position.top, 
                        right: position.right,
                        zIndex: 1000, // Ensure it sits above other content
                    }}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={dropdownVariants}
                >
                    <h4 className="dropdown-title">Join as:</h4>
                    {roles.map((role) => (
                        <button
                            key={role.name}
                            className="dropdown-item"
                            onClick={() => onSelect(role.name)} // Calls the handler from LandingPage
                        >
                            <span className="role-name">
                                {role.name}
                            </span>
                            <span className="role-description">
                                {role.description}
                            </span>
                        </button>
                    ))}
                    <div className="dropdown-arrow" style={{ right: '15px' }}></div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
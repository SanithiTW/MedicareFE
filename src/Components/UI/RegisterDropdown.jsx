import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RegisterDropdown.css'; 

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
    const [position, setPosition] = useState({ top: 0, right: 0 });
    const dropdownRef = useRef(null); // Ref for the dropdown itself

    // Function to calculate and set the dropdown position
    const calculatePosition = useCallback(() => {
        if (targetRef.current) {
            const rect = targetRef.current.getBoundingClientRect();
            
            // Calculate top position: bottom of button + scroll Y position + margin
            const top = rect.bottom + window.scrollY + 10; 

            // Calculate right position: distance from the viewport's right edge to the button's right edge
            // This ensures the right edge of the dropdown aligns with the right edge of the button.
            const right = window.innerWidth - rect.right; 
            
            setPosition({ top, right });
        }
    }, [targetRef]);

    useEffect(() => {
        if (isOpen) {
            // Calculate position when opening
            calculatePosition();

            // Recalculate position on scroll or resize
            window.addEventListener('resize', calculatePosition);
            window.addEventListener('scroll', calculatePosition);
        } else {
            // Cleanup listeners when closed
            window.removeEventListener('resize', calculatePosition);
            window.removeEventListener('scroll', calculatePosition);
        }

        // Handle click outside to close dropdown
        const handleOutsideClick = (event) => {
            // Check if the click is outside the target button AND outside the dropdown itself
            if (
                isOpen && 
                targetRef.current && 
                !targetRef.current.contains(event.target) && 
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target)
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            window.removeEventListener('resize', calculatePosition);
            window.removeEventListener('scroll', calculatePosition);
        };
    }, [isOpen, targetRef, onClose, calculatePosition]);

    const dropdownVariants = {
        hidden: { opacity: 0, scale: 0.9, y: -10 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
        exit: { opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.15 } }
    };
    

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dropdownRef} // Attach ref for outside click handling
                    className="register-dropdown"
                    style={{ 
                        position: 'absolute',
                        top: position.top, 
                        right: position.right,
                        zIndex: 1000, 
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
                            onClick={() => onSelect(role.name)} 
                        >
                            <span className="role-name">
                                {role.name}
                            </span>
                            <span className="role-description">
                                {role.description}
                            </span>
                        </button>
                    ))}
                    {/* The arrow should point up to the register button */}
                    <div className="dropdown-arrow" style={{ right: '20px' }}></div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
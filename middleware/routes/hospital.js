import express from 'express';
import axios from 'axios';
import SYSTEMS from '../config/systems.js';

const router = express.Router();

// Get all doctors
router.get('/doctors', async (req, res) => {
    try {
        const token = req.headers.authorization;
        const authToken = SYSTEMS.hospital.auth.token;

        const response = await axios.get(
            `${SYSTEMS.hospital.baseUrl}/api/doctors`,
            {
                params: { token: authToken },
                headers: token ? { 'Authorization': token } : {},
                timeout: 5000
            }
        );
        res.json({
            code: 0,
            message: 'Doctors from Hospital system',
            success: true,
            source: 'Hospital Management',
            data: response.data.data || response.data
        });
    } catch (error) {
        res.status(500).json({
            code: 5,
            message: 'Error fetching doctors from Hospital',
            success: false,
            error: error.message
        });
    }
});

// Get doctors with filters
router.get('/doctors/department/:dept', async (req, res) => {
    try {
        const token = req.headers.authorization;
        const authToken = SYSTEMS.hospital.auth.token;

        const response = await axios.get(
            `${SYSTEMS.hospital.baseUrl}/api/doctors/department/${req.params.dept}`,
            {
                params: { token: authToken },
                headers: token ? { 'Authorization': token } : {},
                timeout: 5000
            }
        );
        res.json({
            code: 0,
            message: `Doctors in ${req.params.dept}`,
            success: true,
            source: 'Hospital Management',
            data: response.data.data || response.data
        });
    } catch (error) {
        res.status(500).json({
            code: 5,
            message: 'Error fetching doctors from Hospital',
            success: false,
            error: error.message
        });
    }
});

// Get all doctors via HR integration endpoint (with HR token verification)
router.get('/hr/doctors', async (req, res) => {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({
                code: 1,
                message: 'Token required',
                success: false
            });
        }

        const response = await axios.get(
            `${SYSTEMS.hospital.baseUrl}/api/hr/doctors`,
            {
                headers: { 'Authorization': token },
                timeout: 5000
            }
        );

        res.json({
            code: 0,
            message: 'Doctors from Hospital (HR integration)',
            success: true,
            source: 'Hospital Management - HR Integration',
            data: response.data.data || response.data
        });
    } catch (error) {
        res.status(error.response?.status || 500).json({
            code: 5,
            message: 'Error fetching doctors from Hospital HR endpoint',
            success: false,
            error: error.message
        });
    }
});

// Get all employees
router.get('/employees', async (req, res) => {
    try {
        const authToken = SYSTEMS.hospital.auth.token;
        const response = await axios.get(
            `${SYSTEMS.hospital.baseUrl}/api/employees/third-party/all`,
            {
                params: { token: authToken },
                timeout: 5000
            }
        );

        res.json({
            code: 0,
            message: 'Employees from Hospital system',
            success: true,
            source: 'Hospital Management',
            data: response.data.data || response.data
        });
    } catch (error) {
        res.status(500).json({
            code: 5,
            message: 'Error fetching employees from Hospital',
            success: false,
            error: error.message
        });
    }
});

export default router;

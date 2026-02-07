import dotenv from 'dotenv';
dotenv.config();

const SYSTEMS = {
    hospital: {
        name: 'Hospital Management',
        baseUrl: process.env.HOSPITAL_API_URL || 'http://localhost:5000',
        port: 5000,
        type: 'node',
        auth: {
            type: 'jwt-query',
            token: process.env.HOSPITAL_JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NjhmMDExODEyZjY0ZDA0MzQ5NTNiYyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3MDQzMTg2MiwiZXhwIjoxNzcxMDM2NjYyfQ.OSQ1_uIwAtDjNHyAIMGMqbhDROBPwKm5o_7rom1P92I'
        },
        healthCheckPath: '/api/health'
    },
    hr: {
        name: 'HR Management (Java Spring Boot)',
        baseUrl: process.env.HR_API_URL || 'http://localhost:8080',
        port: 8080,
        type: 'java',
        auth: {
            type: 'jwt-query',
            token: process.env.HR_THIRD_PARTY_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0aGlyZF9wYXJ0eV91c2VyIiwiaWF0IjoxNzI4MDAwMDAwLCJleHAiOjMzMDgwMDAwMDB9.thirdpartyfixedtoken123456789'
        },
        healthCheckPath: '/actuator/health'
    },
    hotel: {
        name: 'Hotel Management',
        baseUrl: process.env.HOTEL_API_URL || 'http://localhost:3000',
        port: 3000,
        type: 'unknown',
        status: 'pending', // Chờ nhóm Hotel
        healthCheckPath: '/api/health'
    }
};

export default SYSTEMS;

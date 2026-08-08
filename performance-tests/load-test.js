import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 25 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
    ],

    thresholds: {
        http_req_failed: ['rate<0.05'],
        http_req_duration: ['p(95)<2000'],
    },
};

const BASE_URL =
    'http://smartretailx-alb-1121427889.ap-south-1.elb.amazonaws.com';

export default function () {

    // Test frontend
    let frontend = http.get(`${BASE_URL}/`);

    check(frontend, {
        'frontend status is 200': (r) => r.status === 200,
    });

    // Test product API
    let products = http.get(`${BASE_URL}/products/`);

    check(products, {
        'products status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
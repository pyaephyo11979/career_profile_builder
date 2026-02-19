import {redirect,json} from 'react-router-dom';

const baseURL = 'http://localhost:8000/api';

export async function registerAction({request}) {
    const formData = await request.formData();
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    if (!username || !email || !password) {
        return json({error: 'All fields are required'}, {status: 400});
    }
    const response = await fetch(`${baseURL}/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, email, password})
    });
    if (!response.ok) {
        const errorData = await response.json();
        return json({error: errorData.error || 'Registration failed'}, {status: response.status});
    }
    return redirect('/login');
}
export async function loginAction({request}){
    const formData = await request.formData();
    const username = formData.get('username');
    const password = formData.get('password');
    if (!username || !password) {
        return json({error: 'Username and password are required'}, {status: 400});
    }
    const response = await fetch(`${baseURL}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    });
    if (!response.ok) {
        const errorData = await response.json();
        return json({error: errorData.error || 'Login failed'}, {status: response.status});
    }
    const data = await response.json();
    localStorage.setItem('token', data.access);
    return redirect('/dashboard');
}
export async function logoutAction() {
    localStorage.removeItem('token');
    return redirect('/');
}
export async function ParseResumeAction({request}){
    const formData = await request.formData();
    const resume = formData.get('resume');
    if (!resume) {
        return json({error: 'Resume is required'}, {status: 400});
    }
    const response = await fetch(`${baseURL}/parse`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`},
        body: resume
    });
    if (!response.ok) {
        const errorData = await response.json();
        return json({error: errorData.error || 'Resume parsing failed'}, {status: response.status});
    }
    const data = await response.json();
    return json(data);
}
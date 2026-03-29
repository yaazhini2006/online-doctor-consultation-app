import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'patient', speciality: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      alert('Registration successful. Please login.');
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 style={{ textAlign: 'center' }}>Register</h2>
        <form onSubmit={handleSubmit}>
          <input className="input-field" type="text" placeholder="Name" required onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <input className="input-field" type="email" placeholder="Email" required onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <input className="input-field" type="password" placeholder="Password" required onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <select className="input-field" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
          {formData.role === 'doctor' && (
            <input className="input-field" type="text" placeholder="Speciality (e.g., Cardiologist)" required onChange={(e) => setFormData({...formData, speciality: e.target.value})} />
          )}
          <button className="btn-primary" type="submit">Register</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
};

export default Register;

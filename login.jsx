import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 style={{ textAlign: 'center' }}>Login</h2>
        <form onSubmit={handleSubmit}>
          <input className="input-field" type="email" placeholder="Email" required onChange={(e) => setEmail(e.target.value)} />
          <input className="input-field" type="password" placeholder="Password" required onChange={(e) => setPassword(e.target.value)} />
          <button className="btn-primary" type="submit">Login</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>No account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
};

export default Login;

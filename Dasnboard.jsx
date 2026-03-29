import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Dashboard = ({ user, setUser }) => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [newAppointment, setNewAppointment] = useState({ doctor_id: '', date: '', time: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAppointments();
    if (user.role === 'patient') {
      fetchDoctors();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const res = await api.get(`/appointments/${user.id}`);
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const bookAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', newAppointment);
      fetchAppointments();
      alert('Appointment booked!');
      setNewAppointment({ doctor_id: '', date: '', time: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to book appointment');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      fetchAppointments();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <div className="nav-bar">
        <h2>Welcome, {user.name} ({user.role})</h2>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>

      <div className="grid-2">
        {user.role === 'patient' && (
          <div className="card">
            <h3>Book an Appointment</h3>
            <form onSubmit={bookAppointment}>
              <select className="input-field" required value={newAppointment.doctor_id} onChange={e => setNewAppointment({...newAppointment, doctor_id: e.target.value})}>
                <option value="">Select Doctor</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name} - {doc.speciality}</option>
                ))}
              </select>
              <input type="date" className="input-field" required value={newAppointment.date} onChange={e => setNewAppointment({...newAppointment, date: e.target.value})} />
              <input type="time" className="input-field" required value={newAppointment.time} onChange={e => setNewAppointment({...newAppointment, time: e.target.value})} />
              <button className="btn-primary" type="submit">Book Now</button>
            </form>
          </div>
        )}

        <div className="card">
          <h3>Your Appointments</h3>
          {appointments.length === 0 ? <p>No appointments found.</p> : (
            <ul>
              {appointments.map(app => (
                <li key={app.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                  <strong>{user.role === 'patient' ? `Dr. ${app.doctor_name} (${app.speciality})` : `Patient: ${app.patient_name}`}</strong>
                  <br/>
                  Date: {app.date} | Time: {app.time} | Status: {app.status}
                  <br/>
                  {user.role === 'doctor' && app.status === 'pending' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <button style={{ marginRight: '1rem', background: '#28a745', color: '#fff', padding: '0.25rem 0.5rem', border: 'none' }} onClick={() => updateStatus(app.id, 'confirmed')}>Confirm</button>
                      <button style={{ background: '#dc3545', color: '#fff', padding: '0.25rem 0.5rem', border: 'none' }} onClick={() => updateStatus(app.id, 'cancelled')}>Cancel</button>
                    </div>
                  )}
                  {app.status === 'confirmed' && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <Link to={`/chat/${user.role === 'patient' ? app.doctor_id : app.patient_id}`} style={{ textDecoration: 'none', color: '#007bff' }}>Enter Chat / Add Prescription</Link>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

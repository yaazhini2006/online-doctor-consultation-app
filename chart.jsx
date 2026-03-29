import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const Chat = ({ user }) => {
  const { peerId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [newPrescription, setNewPrescription] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [user, peerId]);

  const fetchData = async () => {
    await fetchMessages();
    await fetchPrescriptions();
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/consultation/chat/${peerId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages');
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await api.get(`/prescriptions/${user.role === 'patient' ? user.id : peerId}`);
      setPrescriptions(res.data);
    } catch (err) {
      console.error('Failed to load prescriptions');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await api.post('/consultation/chat', { receiver_id: peerId, content });
      setContent('');
      fetchMessages();
    } catch (err) {
      alert('Failed to send message');
    }
  };

  const addPrescription = async (e) => {
    e.preventDefault();
    if (!newPrescription.trim()) return;
    try {
      // Note: In real app, we need appointment_id. For simplicity we mock it as 1.
      await api.post('/prescriptions', { appointment_id: 1, patient_id: peerId, details: newPrescription });
      setNewPrescription('');
      alert('Prescription added!');
      fetchPrescriptions();
    } catch (err) {
      alert('Failed to add prescription');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="nav-bar">
        <h2>Consultation</h2>
        <button className="btn-logout" onClick={() => navigate('/')}>Back</button>
      </div>
      
      <div className="grid-2">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
          <h3>Chat</h3>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', border: '1px solid #ddd', padding: '1rem' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ textAlign: msg.sender_id === user.id ? 'right' : 'left', marginBottom: '1rem' }}>
                <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '4px', backgroundColor: msg.sender_id === user.id ? '#007bff' : '#f1f1f1', color: msg.sender_id === user.id ? 'white' : 'black' }}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} style={{ display: 'flex' }}>
            <input className="input-field" style={{ flex: 1, marginBottom: 0, marginRight: '0.5rem' }} value={content} onChange={e => setContent(e.target.value)} placeholder="Type a message..." />
            <button className="btn-primary" style={{ width: 'auto' }} type="submit">Send</button>
          </form>
        </div>

        <div className="card">
          <h3>Prescriptions</h3>
          <ul style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {prescriptions.map(p => (
              <li key={p.id} style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                <small>{new Date(p.created_at).toLocaleString()}</small><br/>
                {p.details}
              </li>
            ))}
          </ul>
          
          {user.role === 'doctor' && (
            <div style={{ marginTop: '1rem' }}>
              <h4>Add Prescription</h4>
              <form onSubmit={addPrescription}>
                <textarea className="input-field" rows="4" placeholder="Enter prescription details..." value={newPrescription} onChange={e => setNewPrescription(e.target.value)} required></textarea>
                <button className="btn-primary" type="submit">Submit</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;

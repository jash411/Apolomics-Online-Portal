import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Certificate.css';

const Certificate = ({ courseId }) => {
  const { user, token } = useAuth();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificate();
  }, [courseId]);

  const fetchCertificate = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/certificates/?course_id=${courseId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const data = await response.json();
      
      if (data.length > 0) {
        setCertificate(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching certificate:', error);
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // Generate PDF certificate (you can implement this with a PDF library)
    alert('Certificate download feature would be implemented here!');
  };

  if (loading) return <div>Loading certificate...</div>;
  if (!certificate) return <div>No certificate found. Complete the course requirements first.</div>;

  return (
    <div className="certificate-container">
      <div className="certificate">
        <div className="certificate-header">
          <h1>Certificate of Completion</h1>
          <div className="decoration">🏆</div>
        </div>
        
        <div className="certificate-body">
          <p className="presented-to">This is to certify that</p>
          <h2 className="student-name">{user?.first_name} {user?.last_name}</h2>
          <p className="completion-text">has successfully completed the course</p>
          <h3 className="course-title">{certificate.course_title}</h3>
          
          <div className="certificate-details">
            <p>Certificate ID: <strong>{certificate.certificate_id}</strong></p>
            <p>Date of Issue: <strong>{new Date(certificate.issued_at).toLocaleDateString()}</strong></p>
          </div>
        </div>
        
        <div className="certificate-footer">
          <div className="signature">
            <div className="signature-line"></div>
            <p>Instructor Signature</p>
          </div>
          <div className="seal">
            <div className="seal-circle">APOLOMICS</div>
          </div>
        </div>
      </div>
      
      <div className="certificate-actions">
        <button onClick={handleDownload} className="download-btn">
          📄 Download Certificate
        </button>
        <button onClick={() => window.print()} className="print-btn">
          🖨️ Print Certificate
        </button>
      </div>
      
      <div className="congratulations">
        <h2>🎉 Congratulations!</h2>
        <p>You have successfully completed the course and earned your certificate.</p>
        <p>Share your achievement with others!</p>
      </div>
    </div>
  );
};

export default Certificate;
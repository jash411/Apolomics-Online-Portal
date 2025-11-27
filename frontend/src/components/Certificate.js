import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Certificate.css';

const Certificate = () => {
  const { courseId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [certificate, setCertificate] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificateData();
  }, [courseId]);

  const fetchCertificateData = async () => {
    try {
      // ✅ FIXED: Use course_id instead of course
      const certificateResponse = await fetch(`http://localhost:8000/api/certificates/?course_id=${courseId}`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      
      console.log('🔍 Fetching certificate for course:', courseId);
      
      if (certificateResponse.ok) {
        const certificates = await certificateResponse.json();
        console.log('📜 Certificates found:', certificates);
        
        if (certificates.length > 0) {
          setCertificate(certificates[0]);
          
          // Fetch course details
          const courseResponse = await fetch(`http://localhost:8000/api/courses/${courseId}/`, {
            headers: { 'Authorization': `Token ${token}` }
          });
          
          if (courseResponse.ok) {
            const courseData = await courseResponse.json();
            setCourse(courseData);
          }
        } else {
          console.log('❌ No certificate found for this course');
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching certificate:', error);
      setLoading(false);
    }
  };

  const downloadCertificate = () => {
    // Create a printable version of the certificate
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${course?.title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .certificate {
              background: white;
              color: #333;
              padding: 50px;
              border-radius: 15px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
              max-width: 800px;
              margin: 0 auto;
              border: 10px solid gold;
            }
            h1 { color: #2c5530; margin-bottom: 30px; }
            .student-name { font-size: 2.5em; color: #2c5530; margin: 20px 0; }
            .course-title { font-size: 1.5em; color: #666; margin: 20px 0; }
            .date { margin-top: 30px; color: #666; }
            .certificate-id { margin-top: 20px; font-family: monospace; color: #999; }
          </style>
        </head>
        <body>
          <div class="certificate">
            <h1>🎓 Certificate of Completion</h1>
            <p>This certifies that</p>
            <div class="student-name">${user?.first_name} ${user?.last_name}</div>
            <p>has successfully completed the course</p>
            <div class="course-title">"${course?.title}"</div>
            <p>with outstanding dedication and achievement</p>
            <div class="date">Issued on: ${new Date().toLocaleDateString()}</div>
            <div class="certificate-id">Certificate ID: ${certificate?.certificate_id}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="loading">Loading certificate...</div>;
  }

  if (!certificate) {
    return (
      <div className="certificate-container">
        <div className="no-certificate">
          <h2>Certificate Not Available</h2>
          <p>You haven't completed all course requirements yet.</p>
          <div className="requirements">
            <h3>Requirements:</h3>
            <ul>
              <li>✅ Complete all video lectures</li>
              <li>✅ Submit and get assignment approved</li>
              <li>✅ Pass the final exam</li>
            </ul>
          </div>
          <button onClick={() => navigate(`/learn-sequential/${courseId}`)} className="btn-primary">
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-container">
      <div className="certificate-header">
        <button onClick={() => navigate('/my-courses')} className="back-button">
          ← Back to My Courses
        </button>
        <h1>Your Certificate</h1>
      </div>

      <div className="certificate-card">
        <div className="certificate-design">
          <div className="certificate-border">
            <div className="certificate-content">
              <h1>🎓 Certificate of Completion</h1>
              <p className="award-text">This certifies that</p>
              <h2 className="student-name">{user?.first_name} {user?.last_name}</h2>
              <p className="completion-text">has successfully completed the course</p>
              <h3 className="course-title">"{course?.title}"</h3>
              <p className="achievement-text">with outstanding dedication and achievement</p>
              
              <div className="certificate-details">
                <div className="detail">
                  <strong>Issued Date:</strong>
                  <span>{new Date(certificate.issued_at).toLocaleDateString()}</span>
                </div>
                <div className="detail">
                  <strong>Certificate ID:</strong>
                  <span className="certificate-id">{certificate.certificate_id}</span>
                </div>
                <div className="detail">
                  <strong>Instructor:</strong>
                  <span>{course?.instructor_name}</span>
                </div>
              </div>

              <div className="signature-section">
                <div className="signature">
                  <div className="signature-line"></div>
                  <p>Instructor Signature</p>
                </div>
                <div className="signature">
                  <div className="signature-line"></div>
                  <p>Apolomics Director</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="certificate-actions">
          <button onClick={downloadCertificate} className="btn-primary">
            📄 Download Certificate
          </button>
          <button onClick={() => navigate('/my-courses')} className="btn-outline">
            🏠 Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
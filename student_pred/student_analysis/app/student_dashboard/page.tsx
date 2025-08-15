"use client";
import Image from "next/image";
import { useRouter } from 'next/navigation';

const mockGrades = [
  { subject: 'Math', grade: 'A' },
  { subject: 'Science', grade: 'B+' },
  { subject: 'History', grade: 'A-' },
];

const StudentDashboard = () => {
  const router = useRouter();

  const handleLogout = () => {
    // Clear user data from local storage (or a more secure method)
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    router.push('/');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Student Dashboard</h1>
      <p>Welcome, Student!</p>

      <h2>Your Grades</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Subject</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Grade</th>
          </tr>
        </thead>
        <tbody>
          {mockGrades.map((grade, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>{grade.subject}</td>
              <td style={{ padding: '8px' }}>{grade.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleLogout}
            className="w-18 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Logout
      </button>
    </div>
  );
};

export default StudentDashboard;
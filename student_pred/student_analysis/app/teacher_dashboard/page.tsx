"use client";
import Image from "next/image";
import { useRouter } from 'next/navigation';

const mockStudents = [
  { id:1,name: 'John Doe', avgGrade: 'A'},
  { id:2,name: 'Jane Smith', avgGrade: 'B+'},
  { id:3,name: 'Alice Johnson', avgGrade: 'A-'},
];
const TeacherDashboard = () => {
  const router = useRouter();
  const totalStudents=mockStudents.length;
  const averageClassGrade = 'B+';
   const handleLogout = () => {
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    router.push('/');
  };
  return (
    <div style={{ padding: '20px' }}>
      <h1>Teacher Dashboard</h1>
      <p>Welcome, Teacher!</p>

      <h2>Class Statistics</h2>
      <p>Total Students: {totalStudents}</p>
      <p>Average Class Grade: {averageClassGrade}</p>

      <h2>Student List</h2>
      <ul>
        {mockStudents.map(student => (
          <li key={student.id} style={{ marginBottom: '10px' }}>
            {student.name} - Average Grade: {student.avgGrade}
          </li>
        ))}
      </ul>

      <button
        onClick={handleLogout}
            className="w-18 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
        Logout
      </button>
    </div>
  );
};

export default TeacherDashboard;
"use client";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useState, useEffect} from 'react';

type Student = {
  name: string;
  id:string;
  risklevel: string;
  last_activity: string;
};
type Grade = {
  score: number;
  date: string;
};
type Prediction = {
  studentId: string;
  risklevel: string;
};

type Stats = {
  totalStudents: number;
  classAverge: number;
  atRiskCount: number;
  recentActivity: number;
};

const TeacherDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [allgrades, setallGrades] = useState<Grade[]>([]);
  const [allPredictions, setallPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [studentsResponse, gradesResponse, predictionsResponse] = await Promise.all(
        [
          fetch('/api/students'),
          fetch('/api/grades'),
          fetch('/api/predictions')
        ]
      );

      const studentsData = await studentsResponse.json();
      const gradesData = await gradesResponse.json();
      const predictionData = await predictionsResponse.json();

      if (studentsData.success) {
        setStudents(studentsData.students);
      }
      if (gradesData.success) {
        setallGrades(gradesData.grades);
      }
      if (predictionData.success) {
        setallPredictions(predictionData.predictions);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load teacher's dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const calculateStats = (): Stats => {
    const totalStudents = students.length;
    const classAverage = allgrades.length > 0 ?
      Math.round(allgrades.reduce((sum, grade) => sum + grade.score, 0) / allgrades.length) : 0;
    const atRiskCount = allPredictions.filter(p => p.risk_level === 'High' || p.risk_level === 'Medium').length;
    const recentActivity = allgrades.filter(grade => {
      if (!grade.date) return false;
      const gradeDate = new Date(grade.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return gradeDate >= weekAgo;
    }).length;

    return { totalStudents, classAverage, atRiskCount, recentActivity };
  };

  const stats = calculateStats();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')"
          }}
        />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')"
          }}
        />
        <div className="relative z-10 text-center">
          <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-xl p-8 max-w-md">
            <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
            <p className="text-white mb-6">{error}</p>
            <button
              onClick={fetchAllData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black font-sans">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')"
        }}
      />
 
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Teacher Dashboard</h1>
            <p className="text-gray-300 text-lg">Class Overview & Student Management 👨‍🏫</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold shadow-lg"
          >
            Logout
          </button>
        </div>

        {/* Stats Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Students Card */}
          <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium uppercase mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-white">{stats.totalStudents}</p>
          </div>
          {/* Class Average Card */}
          <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium uppercase mb-2">Class Average</h3>
            <p className="text-3xl font-bold text-green-400">{stats.classAverage}%</p>
          </div>
          {/* At-Risk Students Card */}
          <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium uppercase mb-2">At-Risk Students</h3>
            <p className="text-3xl font-bold text-yellow-400">{stats.atRiskCount}</p>
          </div>
          {/* Recent Activity Card */}
          <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium uppercase mb-2">Recent Activity</h3>
            <p className="text-3xl font-bold text-purple-400">{stats.recentActivity} Grades</p>
          </div>
        </div>

        {/* Students Grid/List */}
        <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">Student Roster</h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.length > 0 ? (
              students.map(student => (
                <div key={student.id} className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      className="h-12 w-12 rounded-full"
                      src={`https://placehold.co/100x100/${Math.floor(Math.random()*16777215).toString(16)}/white?text=${student.name.charAt(0)}`}
                      alt={student.name}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{student.name}</p>
                    <p className="text-gray-400 text-sm truncate">Risk: <span className={`font-bold ${student.risk_level === 'High' ? 'text-red-400' : student.risk_level === 'Medium' ? 'text-yellow-400' : 'text-green-400'}`}>{student.risk_level}</span></p>
                  </div>
                  <div className="ml-auto">
                    <button className="text-blue-400 hover:text-blue-500 font-medium text-sm">
                      View
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center col-span-full">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-gray-400 text-lg">No students found</p>
                <p className="text-gray-500 text-sm">Student data will appear here once it's available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

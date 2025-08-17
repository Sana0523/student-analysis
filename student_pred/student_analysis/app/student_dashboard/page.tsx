"use client";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useState, useEffect} from "react";


const StudentDashboard = () => {
  type Student = {
    name: string;
    email: string;
    age: number;
    study_hours: number;
    date : string;
  };
  
  const[studentData, setStudentData] = useState<Student | null>(null);
  const[grades, setGrades] = useState([]);
  const[prediction, setprediction] = useState([null]);
  const[loading, setLoading] = useState(true);
  const[error, setError] = useState("");
  const router = useRouter();

  // Temporary studentId
  const studentId='st1';

  useEffect(() => {
    fetchStudentData();
  },[]);
  const fetchStudentData =async () => {
    try {
      setLoading(true);
      const [studentResponse, gradesResponse, predictionResponse] = await Promise.all(
        [
          fetch(`/api/students/${studentId}`),
          fetch(`/api/grades/student/${studentId}`),
          fetch(`/api/predictions/student/${studentId}`)
        ]
      );
      const studentData= await studentResponse.json();
      const gradesData = await gradesResponse.json();
      const predictionData = await predictionResponse.json();
      if(studentData.success)
      {
        setStudentData(studentData.student);
      }
      if(gradesData.success)
      {
        setGrades(gradesData.grades);
      }
      if(predictionData.success)
      {
        setprediction(predictionData.predictions[0]);
      }
    }
    catch(error) {
      console.error("Error fetching student data:", error);
      setError("An error occurred while fetching student data.");
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
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
              onClick={fetchStudentData}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')"
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Student Dashboard</h1>
            <p className="text-gray-300 text-lg">
              Welcome back, {studentData?.name || 'Student'}! 📚
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold shadow-lg"
          >
            Logout
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Student Info Card */}
          <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              👤 Student Information
            </h3>
            {studentData ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white font-medium">{studentData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white font-medium">{studentData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Age:</span>
                  <span className="text-white font-medium">{studentData.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Study Hours:</span>
                  <span className="text-white font-medium">{studentData.study_hours}/week</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Loading student information...</p>
            )}
          </div>

          {/* Performance Prediction Card */}
          <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              🎯 Performance Prediction
            </h3>
            {prediction ? (
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {prediction.predicted_grade || prediction.prediction || 'N/A'}
                </div>
                <p className="text-gray-300 text-sm mb-4">Predicted Final Grade</p>
                <div className="bg-blue-600 bg-opacity-20 rounded-lg p-3">
                  <p className="text-blue-200 text-sm">
                    Based on your current performance and study habits
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <div className="text-2xl mb-2">⏳</div>
                <p>Calculating prediction...</p>
              </div>
            )}
          </div>

          {/* Quick Stats Card */}
          <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              📊 Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Subjects:</span>
                <span className="text-white font-bold text-lg">{grades.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Average Score:</span>
                <span className="text-green-400 font-bold text-lg">
                  {grades.length > 0 
                    ? Math.round(grades.reduce((sum, g) => sum + (g.score || 0), 0) / grades.length)
                    : 'N/A'
                  }%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status:</span>
                <span className="text-blue-400 font-bold">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grades Table */}
        <div className="mt-6">
          <div className="bg-black bg-opacity-70 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white flex items-center">
                📚 Your Grades
              </h3>
            </div>
            <div className="overflow-x-auto">
              {grades.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {grades.map((grade, index) => (
                      <tr key={index} className="hover:bg-gray-800 hover:bg-opacity-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                          {grade.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-blue-400 font-semibold">
                            {grade.score}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-green-100">
                            {grade.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                          {grade.date || new Date().toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-gray-400 text-lg">No grades available yet</p>
                  <p className="text-gray-500 text-sm">Your grades will appear here once they're added</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2024 Student Analysis Dashboard. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
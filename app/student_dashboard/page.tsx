"use client";
import { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register the necessary components for Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type Student = {
  id: string;
  name: string;
  email: string;
  age: number;
  study_hours: number;
  failures: number;
  absences: number;
};

type Grade = {
  subject: string;
  score: number;
  grade: string;
  date: string;
};

type Prediction = {
  predicted_grade: string;
  risk_level: string;
};

const StudentDashboard = () => {
  
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // This is hardcoded for this specific dashboard.
  const studentId='st1';

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if(!token) {
      window.location.href = '/';
      return;
    }
    fetchStudentData(token);
  },[]);

  const fetchStudentData = async (token: string) => {
    try {
      setLoading(true);
      setError("");
      
      const authHeaders = { 'Authorization': `Bearer ${token}` };

      const [studentResponse, gradesResponse] = await Promise.all([
        fetch(`/api/students/${studentId}`, { headers: authHeaders }),
        fetch(`/api/grades/student/${studentId}`, { headers: authHeaders }),
      ]);

      if (!studentResponse.ok || !gradesResponse.ok) {
        throw new Error("Failed to fetch dashboard data. Your session may have expired.");
      }

      const studentJson = await studentResponse.json();
      const gradesJson = await gradesResponse.json();

      // DEBUG: log API responses into browser console
      console.log('studentResponse ok:', studentResponse.ok, 'studentJson:', studentJson);
      console.log('gradesResponse ok:', gradesResponse.ok, 'gradesJson:', gradesJson);

      if (studentJson?.success) setStudentData(studentJson.student ?? studentJson);

      // Normalize grades response: accept either a raw array or { success: true, grades: [...] }
      const parsedGrades: any[] = Array.isArray(gradesJson)
        ? gradesJson
        : Array.isArray(gradesJson?.grades)
          ? gradesJson.grades
          : Array.isArray(gradesJson?.data)
            ? gradesJson.data
            : [];
      setGrades(parsedGrades);
 
      if (studentJson?.success) {
        try {
          const student = studentJson.student ?? studentJson;
          const requiredFeatures = {
            age: student?.age ?? 0,
            failures: student?.failures ?? 0,
            studytime: student?.study_hours ?? 0,
            absences: student?.absences ?? 0,
            G1: parsedGrades?.[0]?.score ?? 0,
            G2: parsedGrades?.[1]?.score ?? 0
          };

          const maxMarks = 100;
          
          const predictionApiResponse = await fetch('/api/predictions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ studentData: requiredFeatures, max_marks: maxMarks })
          });

          if (!predictionApiResponse.ok) {
            // handle auth errors gracefully
            if (predictionApiResponse.status === 401) {
              console.warn('Prediction API unauthorized - token invalid/expired');
              setPrediction({ predicted_grade: 'N/A', risk_level: 'Unauthorized' });
              return;
            }
            // try to read error body safely
            let errBody = {};
            try { errBody = await predictionApiResponse.json(); } catch { /* ignore */ }
            throw new Error((errBody as any).message || "Failed to fetch prediction data.");
          }

          const predictionData = await predictionApiResponse.json();
          console.log('predictionApiResponse ok:', predictionApiResponse.ok, 'predictionData:', predictionData);
          // accept either { success: true, predicted_grade, risk_level } or flat { predicted_grade, risk_level }
          if (predictionData?.success && predictionData?.prediction) {
            setPrediction(predictionData.prediction);
          }
          // Fallback for the old shapes: { success: true, predicted_grade, ... } or { predicted_grade, ... }
          else if (predictionData?.success || ('predicted_grade' in predictionData && 'risk_level' in predictionData)) {
            const pd = predictionData.success ? predictionData : { success: true, predicted_grade: predictionData.predicted_grade, risk_level: predictionData.risk_level };
            setPrediction(pd);
          } 
          else {
            throw new Error(predictionData?.message || "Prediction returned an unexpected shape.");
          }
        } catch (predictionError: any) {
          console.error("Error fetching prediction data:", predictionError);
          setPrediction({ predicted_grade: 'N/A', risk_level: 'Error' });
        }
      }
    } catch (error: any) {
      console.error("Error fetching student data:", error);
      const errorMessage = error.message || "An error occurred while fetching student data.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/';
  }; 

  const getRiskColor = (risk: string | undefined) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'border-red-500 text-red-400';
      case 'medium': return 'border-yellow-500 text-yellow-400';
      case 'low': return 'border-green-500 text-green-400';
      default: return 'border-gray-700 text-gray-400';
    }
  };

  const chartData = {
    labels: grades.map(g => g.subject),
    datasets: [
      {
        label: 'Subject Scores',
        data: grades.map(g => g.score),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Performance Across Subjects', color: '#E5E7EB', font: { size: 16 } },
    },
    scales: {
        y: {
            beginAtZero: true,
            max: 100,
            ticks: { color: '#9CA3AF' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        x: {
            ticks: { color: '#D1D5DB' },
            grid: { display: false }
        }
    }
  };

  if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )
  }

  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-center p-4">
            <div>
                <h2 className="text-2xl text-red-500 mb-4">An Error Occurred</h2>
                <p className="mb-6">{error}</p>
                <button
                    onClick={() => fetchStudentData(localStorage.getItem('accessToken') || '')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                    Try Again
                </button>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            <p className="text-gray-400">Welcome back, {studentData?.name || 'Student'}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold"
          >
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Student Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Name:</span> <span>{studentData?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Email:</span> <span>{studentData?.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Age:</span> <span>{studentData?.age}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Study Hours:</span> <span>{studentData?.study_hours} / week</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Failures:</span> <span>{studentData?.failures || 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Absences:</span> <span>{studentData?.absences || 0}</span></div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">Performance Prediction</h3>
                {prediction ? (
                    <div className={`text-center p-4 rounded-lg border-2 ${getRiskColor(prediction.risk_level)}`}>
                        <p className="text-gray-300 text-sm">Predicted Final Grade</p>
                        <p className="text-4xl font-bold my-2">
                          {isNaN(parseFloat(prediction.predicted_grade))
                            ? prediction.predicted_grade
                            : `${parseFloat(prediction.predicted_grade).toFixed(1)}%`
                          }
                        </p>
                        <p className={`font-semibold py-1 px-3 rounded-full text-sm inline-block ${getRiskColor(prediction.risk_level).replace('border', 'bg').replace('-500', '-900 bg-opacity-50')}`}>
                            Risk Level: {prediction.risk_level}
                        </p>
                    </div>
                ) : (
                    <p>Calculating prediction...</p>
                )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6">
             <h3 className="text-xl font-semibold mb-4">Grade Distribution</h3>
             <div className="h-80 mb-6">
                {grades.length > 0 ? (
                    <Bar options={chartOptions} data={chartData} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">No grades to display</div>
                )}
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">Subject</th>
                            <th scope="col" className="px-6 py-3">Score</th>
                            <th scope="col" className="px-6 py-3">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grades.map((grade, index) => (
                            <tr key={index} className="border-b border-gray-700 hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium">{grade.subject}</td>
                                <td className="px-6 py-4">{grade.score}%</td>
                                <td className="px-6 py-4">{grade.grade}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;


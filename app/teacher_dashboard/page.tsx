"use client";
import { useState, useEffect } from "react";

// --- Type Definitions ---
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
  id: string;
  studentId: string;
  subject: string;
  score: number;
};

type Prediction = {
  studentId: string; // Keep track of which student this prediction is for
  risk_level: string;
  predicted_grade?: string; 
};

type Stats = {
  totalStudents: number;
  classAverage: number;
  atRiskCount: number;
};

const subjects = ["Math", "Science", "English", "History", "Art", "Physical Education", "Computer Science"];

const TeacherDashboard = () => {
  // --- State Management ---
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<Stats>({ totalStudents: 0, classAverage: 0, atRiskCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState('view');
  const [newStudent, setNewStudent] = useState({ name: '', email: '', age: 16, study_hours: 5, failures: 0, absences: 0 });
  const [newGrade, setNewGrade] = useState({ studentId: '', subject: 'Math', score: 80 });
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // --- Data Fetching Logic ---
  const fetchInitialData = async (token: string) => {
    try {
      setLoading(true);
      setError("");
      const authHeaders = { 'Authorization': `Bearer ${token}` };

      const [studentsResponse, gradesResponse] = await Promise.all([
        fetch('/api/students', { headers: authHeaders }),
        fetch('/api/grades', { headers: authHeaders }),
      ]);

      if (!studentsResponse.ok || !gradesResponse.ok) {
        throw new Error("Failed to fetch initial data. Your session may have expired.");
      }

      const studentsJson = await studentsResponse.json();
      const gradesJson = await gradesResponse.json();

      if (studentsJson.success) setStudents(studentsJson.students || []);
      if (gradesJson.success) setGrades(gradesJson.grades || []);

      if (studentsJson.students && studentsJson.students.length > 0) {
        setNewGrade(prev => ({ ...prev, studentId: studentsJson.students[0].id }));
      }
      
    } catch (error: any) {
      console.error("Error fetching initial data:", error);
      setError(error.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPredictions = async (token: string) => {
      if (!token || students.length === 0) return;
      
      const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      const predictionPromises = students.map(student => {
          const studentGrades = grades.filter(g => g.studentId === student.id);
          const requiredFeatures = {
              age: student.age || 0,
              failures: student.failures || 0,
              studytime: student.study_hours || 0,
              absences: student.absences || 0,
              G1: studentGrades[0]?.score || 0,
              G2: studentGrades[1]?.score || 0,
          };

          return fetch('/api/predictions', {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({ studentData: requiredFeatures, max_marks: 100 }),
          }).then(res => res.json());
      });

      try {
        const results = await Promise.all(predictionPromises);
        console.log('API Results:', results);
        const successfulPredictions = results
          .map((result, index) => ({
              // Extract the nested properties from the 'prediction' object
              risk_level: result.prediction?.risk_level, 
              predicted_grade: result.prediction?.predicted_grade,
              // Keep the other properties you need
              success: result.success,
              studentId: students[index].id,
        }))
        // Also, update the filter to ensure risk_level exists
        .filter(p => p.success && p.risk_level); 
        
        setPredictions(successfulPredictions);
      } catch (err) {
          console.error("One or more prediction calls failed:", err);
          setError("Could not fetch all student predictions.");
      }
  };

  // --- useEffect Hooks to Manage Component Lifecycle ---
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetchInitialData(token);
  }, []);

  useEffect(() => {
    if (students.length > 0 && !loading) {
      fetchAllPredictions(localStorage.getItem('accessToken') || '');
    }
  }, [students, grades, loading]);

  useEffect(() => {
    setStats(calculateStats());
  }, [students, grades, predictions]);


  // --- Event Handlers ---
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newStudent),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add student.');

      fetchInitialData(token);
      setActiveTab('view'); 
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
        const response = await fetch('/api/grades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(newGrade),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add grade.');

        fetchInitialData(token);
        setActiveTab('view');
    } catch (error: any) {
        setError(error.message);
    }
  };
  
  // --- Helper Functions ---
  const calculateStats = (): Stats => {
    const totalStudents = students.length;
    const classAverage = grades.length > 0 ?
      Math.round(grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length) : 0;
    const atRiskCount = predictions.filter(p => p.risk_level === 'High' || p.risk_level === 'Medium').length;
    
    return { totalStudents, classAverage, atRiskCount };
  };
  
  const getRiskColor = (risk: string | undefined) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'bg-red-500 text-red-100';
      case 'medium': return 'bg-yellow-500 text-yellow-100';
      case 'low': return 'bg-green-500 text-green-100';
      default: return 'bg-gray-600 text-gray-200';
    }
  };
  
  // --- Render Logic ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
                <button onClick={() => { localStorage.removeItem('accessToken'); window.location.href = '/'; }} className="bg-red-600 px-4 py-2 rounded">Logout</button>
            </header>

            {notification && (
                <div className={`p-4 rounded-md mb-6 flex justify-between items-center ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    <p>{notification.message}</p>
                    <button onClick={() => setNotification(null)} className="font-bold text-xl">&times;</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-gray-400 text-sm font-medium">Total Students</h3>
                    <p className="text-3xl font-semibold">{stats.totalStudents}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-gray-400 text-sm font-medium">Class Average</h3>
                    <p className="text-3xl font-semibold">{stats.classAverage}%</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-gray-400 text-sm font-medium">Students at Risk</h3>
                    <p className="text-3xl font-semibold">{stats.atRiskCount}</p>
                </div>
            </div>

            <div className="mb-6 border-b border-gray-700">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveTab('view')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'view' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Class Overview</button>
                    <button onClick={() => setActiveTab('addStudent')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'addStudent' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Add Student</button>
                    <button onClick={() => setActiveTab('addGrade')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'addGrade' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Add Grade</button>
                </nav>
            </div>

            <div>
                {activeTab === 'view' && (
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Risk Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => {
                                    const prediction = predictions.find(p => p.studentId === s.id);
                                    return (
                                        <tr key={s.id} className="border-b border-gray-700">
                                            <td className="p-4">{s.name}</td>
                                            <td className="p-4">{s.email}</td>
                                            <td className="p-4">
                                                {prediction ? (
                                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRiskColor(prediction.risk_level)}`}>
                                                        {prediction.risk_level}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500">Calculating...</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'addStudent' && (
                    <div className="bg-gray-800 p-8 rounded-lg max-w-md mx-auto">
                        <h2 className="text-2xl font-bold mb-6 text-center">Add New Student</h2>
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <input type="text" placeholder="Name" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} className="w-full bg-gray-700 p-3 rounded" required />
                            <input type="email" placeholder="Email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} className="w-full bg-gray-700 p-3 rounded" required />
                            <input type="number" placeholder="Age" value={newStudent.age} onChange={e => setNewStudent({ ...newStudent, age: parseInt(e.target.value) })} className="w-full bg-gray-700 p-3 rounded" required />
                            <input type="number" placeholder="Study Hours/Week" value={newStudent.study_hours} onChange={e => setNewStudent({ ...newStudent, study_hours: parseInt(e.target.value) })} className="w-full bg-gray-700 p-3 rounded" required />
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-semibold">Add Student</button>
                        </form>
                    </div>
                )}

                {activeTab === 'addGrade' && (
                    <div className="bg-gray-800 p-8 rounded-lg max-w-md mx-auto">
                        <h2 className="text-2xl font-bold mb-6 text-center">Add Grade</h2>
                        <form onSubmit={handleAddGrade} className="space-y-4">
                            <select value={newGrade.studentId} onChange={e => setNewGrade({ ...newGrade, studentId: e.target.value })} className="w-full bg-gray-700 p-3 rounded" required>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select value={newGrade.subject} onChange={e => setNewGrade({ ...newGrade, subject: e.target.value })} className="w-full bg-gray-700 p-3 rounded" required>
                                {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                            </select>
                            <input type="text" placeholder="Subject" value={newGrade.subject} onChange={e => setNewGrade({ ...newGrade, subject: e.target.value })} className="w-full bg-gray-700 p-3 rounded" required />
                            <input type="number" placeholder="Score" value={newGrade.score} onChange={e => setNewGrade({ ...newGrade, score: parseInt(e.target.value) })} className="w-full bg-gray-700 p-3 rounded" max="100" min="0" required />
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-semibold">Add Grade</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default TeacherDashboard;


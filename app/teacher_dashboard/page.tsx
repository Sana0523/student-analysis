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
  grade?: string;
};

type Prediction = {
  studentId: string;
  risk_level: string;
  predicted_grade?: string; 
};

type Stats = {
  totalStudents: number;
  classAverage: number;
  atRiskCount: number;
};

// Modal Types
type EditStudentModal = {
  open: boolean;
  student: Student | null;
};

type EditGradeModal = {
  open: boolean;
  grade: Grade | null;
};

type DeleteModal = {
  open: boolean;
  type: 'student' | 'grade';
  id: string;
  name: string;
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
  const [activeTab, setActiveTab] = useState('students');
  const [newStudent, setNewStudent] = useState({ name: '', email: '', age: 16, study_hours: 5, failures: 0, absences: 0 });
  const [newGrade, setNewGrade] = useState({ studentId: '', subject: 'Math', score: 80 });
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Modal States
  const [editStudentModal, setEditStudentModal] = useState<EditStudentModal>({ open: false, student: null });
  const [editGradeModal, setEditGradeModal] = useState<EditGradeModal>({ open: false, grade: null });
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({ open: false, type: 'student', id: '', name: '' });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  
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

        setNotification({ type: 'success', message: 'Grade added successfully!' });
        fetchInitialData(token);
        setActiveTab('grades');
    } catch (error: any) {
        setNotification({ type: 'error', message: error.message });
    }
  };

  // --- Edit Handlers ---
  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(editingStudent),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update student.');

      setNotification({ type: 'success', message: 'Student updated successfully!' });
      setEditStudentModal({ open: false, student: null });
      setEditingStudent(null);
      fetchInitialData(token);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    }
  };

  const handleEditGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(`/api/grades/${editingGrade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          subject: editingGrade.subject, 
          score: editingGrade.score 
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update grade.');

      setNotification({ type: 'success', message: 'Grade updated successfully!' });
      setEditGradeModal({ open: false, grade: null });
      setEditingGrade(null);
      fetchInitialData(token);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    }
  };

  // --- Delete Handlers ---
  const handleDelete = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const endpoint = deleteModal.type === 'student' 
        ? `/api/students/${deleteModal.id}` 
        : `/api/grades/${deleteModal.id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to delete ${deleteModal.type}.`);

      setNotification({ type: 'success', message: `${deleteModal.type === 'student' ? 'Student' : 'Grade'} deleted successfully!` });
      setDeleteModal({ open: false, type: 'student', id: '', name: '' });
      fetchInitialData(token);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    }
  };

  const openEditStudentModal = (student: Student) => {
    setEditingStudent({ ...student });
    setEditStudentModal({ open: true, student });
  };

  const openEditGradeModal = (grade: Grade) => {
    setEditingGrade({ ...grade });
    setEditGradeModal({ open: true, grade });
  };

  const openDeleteModal = (type: 'student' | 'grade', id: string, name: string) => {
    setDeleteModal({ open: true, type, id, name });
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
  if (error && !notification) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
                <button onClick={() => { localStorage.removeItem('accessToken'); window.location.href = '/'; }} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">Logout</button>
            </header>

            {notification && (
                <div className={`p-4 rounded-md mb-6 flex justify-between items-center ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    <p>{notification.message}</p>
                    <button onClick={() => setNotification(null)} className="font-bold text-xl hover:opacity-80">&times;</button>
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
                    <button onClick={() => setActiveTab('students')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'students' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Students</button>
                    <button onClick={() => setActiveTab('grades')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'grades' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Grades</button>
                    <button onClick={() => setActiveTab('addStudent')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'addStudent' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Add Student</button>
                    <button onClick={() => setActiveTab('addGrade')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'addGrade' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Add Grade</button>
                </nav>
            </div>

            <div>
                {/* Students Tab */}
                {activeTab === 'students' && (
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Age</th>
                                    <th className="p-4">Study Hours</th>
                                    <th className="p-4">Risk Level</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => {
                                    const prediction = predictions.find(p => p.studentId === s.id);
                                    return (
                                        <tr key={s.id} className="border-b border-gray-700 hover:bg-gray-750">
                                            <td className="p-4 font-medium">{s.name}</td>
                                            <td className="p-4 text-gray-300">{s.email}</td>
                                            <td className="p-4">{s.age}</td>
                                            <td className="p-4">{s.study_hours}/week</td>
                                            <td className="p-4">
                                                {prediction ? (
                                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRiskColor(prediction.risk_level)}`}>
                                                        {prediction.risk_level}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500">Calculating...</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <button 
                                                    onClick={() => openEditStudentModal(s)}
                                                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm mr-2"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal('student', s.id, s.name)}
                                                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Grades Tab */}
                {activeTab === 'grades' && (
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="p-4">Student</th>
                                    <th className="p-4">Subject</th>
                                    <th className="p-4">Score</th>
                                    <th className="p-4">Grade</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.map(g => {
                                    const student = students.find(s => s.id === g.studentId);
                                    return (
                                        <tr key={g.id} className="border-b border-gray-700 hover:bg-gray-750">
                                            <td className="p-4 font-medium">{student?.name || 'Unknown'}</td>
                                            <td className="p-4">{g.subject}</td>
                                            <td className="p-4">{g.score}%</td>
                                            <td className="p-4">{g.grade || '-'}</td>
                                            <td className="p-4">
                                                <button 
                                                    onClick={() => openEditGradeModal(g)}
                                                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm mr-2"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => openDeleteModal('grade', g.id, `${student?.name}'s ${g.subject}`)}
                                                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add Student Tab */}
                {activeTab === 'addStudent' && (
                    <div className="bg-gray-800 p-8 rounded-lg max-w-md mx-auto">
                        <h2 className="text-2xl font-bold mb-6 text-center">Add New Student</h2>
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div>
                                <label htmlFor="studentName" className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                                <input id="studentName" type="text" placeholder="e.g., John Doe" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div>
                                <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                                <input id="studentEmail" type="email" placeholder="e.g., john.doe@example.com" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="studentAge" className="block text-sm font-medium text-gray-400 mb-1">Age</label>
                                    <input id="studentAge" type="number" placeholder="e.g., 17" value={newStudent.age} onChange={e => setNewStudent({ ...newStudent, age: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" required min="5" max="100" />
                                </div>
                                <div>
                                    <label htmlFor="studyHours" className="block text-sm font-medium text-gray-400 mb-1">Study Hours/Week</label>
                                    <input id="studyHours" type="number" placeholder="e.g., 8" value={newStudent.study_hours} onChange={e => setNewStudent({ ...newStudent, study_hours: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" required min="0" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="failures" className="block text-sm font-medium text-gray-400 mb-1">Past Failures</label>
                                    <input id="failures" type="number" placeholder="e.g., 1" value={newStudent.failures} onChange={e => setNewStudent({ ...newStudent, failures: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
                                </div>
                                <div>
                                    <label htmlFor="absences" className="block text-sm font-medium text-gray-400 mb-1">Absences</label>
                                    <input id="absences" type="number" placeholder="e.g., 3" value={newStudent.absences} onChange={e => setNewStudent({ ...newStudent, absences: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-semibold transition-colors">Add Student</button>
                        </form>
                    </div>
                )}

                {/* Add Grade Tab */}
                {activeTab === 'addGrade' && (
                    <div className="bg-gray-800 p-8 rounded-lg max-w-md mx-auto">
                        <h2 className="text-2xl font-bold mb-6 text-center">Add Grade</h2>
                        <form onSubmit={handleAddGrade} className="space-y-4">
                            <select value={newGrade.studentId} onChange={e => setNewGrade({ ...newGrade, studentId: e.target.value })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" required>
                                <option value="">Select Student</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <select value={newGrade.subject} onChange={e => setNewGrade({ ...newGrade, subject: e.target.value })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" required>
                                {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                            </select>
                            <input type="number" placeholder="Score (0-100)" value={newGrade.score} onChange={e => setNewGrade({ ...newGrade, score: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" max="100" min="0" required />
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-semibold transition-colors">Add Grade</button>
                        </form>
                    </div>
                )}
            </div>

            {/* Edit Student Modal */}
            {editStudentModal.open && editingStudent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6">Edit Student</h2>
                        <form onSubmit={handleEditStudent} className="space-y-4">
                            <input type="text" placeholder="Name" value={editingStudent.name} onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                            <input type="email" placeholder="Email" value={editingStudent.email} onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" required />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="Age" value={editingStudent.age} onChange={e => setEditingStudent({ ...editingStudent, age: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" required min="5" max="100" />
                                <input type="number" placeholder="Study Hours" value={editingStudent.study_hours} onChange={e => setEditingStudent({ ...editingStudent, study_hours: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" required min="0" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="Failures" value={editingStudent.failures} onChange={e => setEditingStudent({ ...editingStudent, failures: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
                                <input type="number" placeholder="Absences" value={editingStudent.absences} onChange={e => setEditingStudent({ ...editingStudent, absences: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => { setEditStudentModal({ open: false, student: null }); setEditingStudent(null); }} className="flex-1 bg-gray-600 hover:bg-gray-700 p-3 rounded font-semibold transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 p-3 rounded font-semibold transition-colors">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Grade Modal */}
            {editGradeModal.open && editingGrade && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6">Edit Grade</h2>
                        <form onSubmit={handleEditGrade} className="space-y-4">
                            <select value={editingGrade.subject} onChange={e => setEditingGrade({ ...editingGrade, subject: e.target.value })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" required>
                                {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                            </select>
                            <input type="number" placeholder="Score (0-100)" value={editingGrade.score} onChange={e => setEditingGrade({ ...editingGrade, score: parseInt(e.target.value) || 0 })} className="w-full bg-gray-700 p-3 rounded focus:ring-2 focus:ring-blue-500 outline-none" max="100" min="0" required />
                            <div className="flex gap-4">
                                <button type="button" onClick={() => { setEditGradeModal({ open: false, grade: null }); setEditingGrade(null); }} className="flex-1 bg-gray-600 hover:bg-gray-700 p-3 rounded font-semibold transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 p-3 rounded font-semibold transition-colors">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-lg w-full max-w-md text-center">
                        <h2 className="text-2xl font-bold mb-4">Confirm Delete</h2>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to delete <span className="font-semibold text-white">{deleteModal.name}</span>?
                            {deleteModal.type === 'student' && (
                                <span className="block text-red-400 mt-2 text-sm">This will also delete all associated grades and predictions.</span>
                            )}
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setDeleteModal({ open: false, type: 'student', id: '', name: '' })} className="flex-1 bg-gray-600 hover:bg-gray-700 p-3 rounded font-semibold transition-colors">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 p-3 rounded font-semibold transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default TeacherDashboard;


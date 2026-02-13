"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// --- Type Definitions ---
type Student = {
  id: string;
  name: string;
  email: string;
  age: number;
  study_hours: number;
  failures?: number;
  absences?: number;
};

type Grade = {
  id: string;
  student_id: string; // Matches DB property
  subject: string;
  score: number;
  grade?: string;
};

type Prediction = {
  studentId: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  probability: number;
};

// --- Modal Types ---
type EditStudentModal = { open: boolean; student: Student | null; };
type EditGradeModal = { open: boolean; grade: Grade | null; };
type DeleteModal = { open: boolean; type: 'student' | 'grade'; id: string; name: string; };

const subjects = ["Math", "Science", "English", "History", "Art", "Physical Education", "Computer Science"];

const TeacherDashboard = () => {
  const router = useRouter();
  
  // --- State Management ---
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState('students');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form states
  const [newStudent, setNewStudent] = useState({ name: '', email: '', age: 16, study_hours: 5, failures: 0, absences: 0 });
  const [newGrade, setNewGrade] = useState({ student_id: '', subject: 'Math', score: 15 });
  
  // Modal States
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [editStudentModal, setEditStudentModal] = useState<EditStudentModal>({ open: false, student: null });
  const [editGradeModal, setEditGradeModal] = useState<EditGradeModal>({ open: false, grade: null });
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({ open: false, type: 'student', id: '', name: '' });

  // --- Calculate Stats Safely ---
  // Using Number() ensures the average calculates even if DB returns strings
  const classAverage = grades.length > 0 
    ? grades.reduce((acc, g) => acc + Number(g.score), 0) / grades.length 
    : 0;

  const studentsAtRisk = predictions.filter(p => p.riskLevel === 'High').length;

  // --- Data Fetching ---
  const fetchData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '/';
        return;
    }

    try {
      setLoading(true);
      const authHeaders = { 'Authorization': `Bearer ${token}` };

      // Unified fetching logic using Promise.all
      const [studentsRes, gradesRes, predictionsRes] = await Promise.all([
        fetch('/api/students', { headers: authHeaders }),
        fetch('/api/grades', { headers: authHeaders }),
        fetch('/api/predictions', { headers: authHeaders }) // Using the new GET endpoint
      ]);

      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data.students || data);
      }

      if (gradesRes.ok) {
        const data = await gradesRes.json();
        setGrades(data.grades || data);
      }

      if (predictionsRes.ok) {
        const data = await predictionsRes.json();
        setPredictions(data);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to sync dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Helper Functions ---
  const getRiskLevel = (studentId: string) => {
    // String comparison solves UUID vs Integer mismatch
    const prediction = predictions.find(p => String(p.studentId) === String(studentId));
    return prediction?.riskLevel || 'Low';
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-600 text-green-100';
      case 'Medium': return 'bg-yellow-600 text-yellow-100';
      case 'High': return 'bg-red-600 text-red-100';
      default: return 'bg-gray-600 text-gray-200';
    }
  };

  // --- Event Handlers (Add/Edit/Delete) ---
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/');
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newStudent),
      });
      if (!res.ok) throw new Error('Failed to add student');
      setNotification({ type: 'success', message: 'Student added!' });
      fetchData();
      setActiveTab('students');
    } catch (err: any) { setNotification({ type: 'error', message: err.message }); }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newGrade),
      });
      if (!res.ok) throw new Error('Failed to add grade');
      setNotification({ type: 'success', message: 'Grade added!' });
      fetchData();
      setActiveTab('grades');
    } catch (err: any) { setNotification({ type: 'error', message: err.message }); }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('accessToken');
    try {
      const endpoint = deleteModal.type === 'student' ? `/api/students/${deleteModal.id}` : `/api/grades/${deleteModal.id}`;
      const res = await fetch(endpoint, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Delete failed');
      setDeleteModal({ open: false, type: 'student', id: '', name: '' });
      fetchData();
    } catch (err: any) { setNotification({ type: 'error', message: err.message }); }
  };

  // Modal helpers
  const openEditStudentModal = (s: Student) => { setEditingStudent({ ...s }); setEditStudentModal({ open: true, student: s }); };
  const openEditGradeModal = (g: Grade) => { setEditingGrade({ ...g }); setEditGradeModal({ open: true, grade: g }); };
  const openDeleteModal = (type: 'student' | 'grade', id: string, name: string) => setDeleteModal({ open: true, type, id, name });

  const downloadStudentReport = async (studentId: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/reports/student/${studentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Report generation error:', errorData);
        throw new Error(errorData.error || 'Failed to generate report');
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_${studentId}_report.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setNotification({ type: 'success', message: 'Report downloaded successfully!' });
    } catch (error) {
      console.error('Download error:', error);
      setNotification({ type: 'error', message: 'Failed to download report. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-xl">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded hover:bg-red-700">Logout</button>
        </header>

        {notification && (
          <div className={`p-4 rounded-md mb-6 flex justify-between items-center ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            <p>{notification.message}</p>
            <button onClick={() => setNotification(null)} className="font-bold text-xl">&times;</button>
          </div>
        )}

        {/* --- Grade Scale Disclaimer --- */}
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-blue-200 text-sm">
              <span className="font-semibold">Grade Scale Notice:</span> The system currently uses a 0-20 grading scale (Portuguese system). 
              When adding grades, please enter values between 0-20. The displayed percentages are automatically converted for clarity.
            </p>
          </div>
        </div>

        {/* --- Metrics Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Students</h3>
            <p className="text-4xl font-bold mt-2">{students.length}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Class Average</h3>
            <p className="text-4xl font-bold mt-2 text-blue-400">
                {grades.length > 0 ? `${classAverage.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Students at Risk</h3>
            <p className="text-4xl font-bold mt-2 text-red-500">{studentsAtRisk}</p>
          </div>
        </div>

        {/* --- Navigation Tabs --- */}
        <div className="mb-6 border-b border-gray-700">
          <nav className="-mb-px flex space-x-6">
            {['students', 'grades', 'addStudent', 'addGrade'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium capitalize transition-all ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
              >
                {tab.replace('add', 'Add ')}
              </button>
            ))}
          </nav>
        </div>

        {/* --- Tab Content --- */}
        <main>
          {activeTab === 'students' && (
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-gray-700 text-gray-300">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Study Hours</th>
                    <th className="p-4">Risk Level</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-gray-750 transition-colors">
                      <td className="p-4 font-medium">{s.name}</td>
                      <td className="p-4 text-gray-400">{s.email}</td>
                      <td className="p-4">{s.study_hours}h/wk</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getRiskBadgeColor(getRiskLevel(s.id))}`}>
                          {getRiskLevel(s.id)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => downloadStudentReport(s.id)} className="text-green-400 hover:underline mr-4" disabled={loading}>📄 Report</button>
                        <button onClick={() => openEditStudentModal(s)} className="text-blue-400 hover:underline mr-4">Edit</button>
                        <button onClick={() => openDeleteModal('student', s.id, s.name)} className="text-red-400 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-gray-700 text-gray-300">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Grade</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {grades.map(g => {
                    const student = students.find(s => String(s.id) === String(g.student_id));
                    return (
                      <tr key={g.id} className="hover:bg-gray-750">
                        <td className="p-4">{student?.name || 'Unknown'}</td>
                        <td className="p-4">{g.subject}</td>
                        <td className="p-4 font-semibold text-blue-300">{g.score}%</td>
                        <td className="p-4">{g.grade || '-'}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => openEditGradeModal(g)} className="text-blue-400 hover:underline mr-4">Edit</button>
                          <button onClick={() => openDeleteModal('grade', g.id, `${student?.name}'s ${g.subject}`)} className="text-red-400 hover:underline">Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Forms */}
          {activeTab === 'addStudent' && (
            <div className="bg-gray-800 p-8 rounded-lg max-w-md mx-auto border border-gray-700">
              <h2 className="text-xl font-bold mb-6">Register New Student</h2>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <input type="text" placeholder="Full Name" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} className="w-full bg-gray-700 p-3 rounded outline-none border border-gray-600 focus:border-blue-500" required />
                <input type="email" placeholder="Email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} className="w-full bg-gray-700 p-3 rounded outline-none border border-gray-600 focus:border-blue-500" required />
                <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Age" value={newStudent.age} onChange={e => setNewStudent({ ...newStudent, age: Number(e.target.value) })} className="bg-gray-700 p-3 rounded border border-gray-600" required />
                    <input type="number" placeholder="Study Hours" value={newStudent.study_hours} onChange={e => setNewStudent({ ...newStudent, study_hours: Number(e.target.value) })} className="bg-gray-700 p-3 rounded border border-gray-600" required />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold">Add Student</button>
              </form>
            </div>
          )}

          {activeTab === 'addGrade' && (
            <div className="bg-gray-800 p-8 rounded-lg max-w-md mx-auto border border-gray-700">
              <h2 className="text-xl font-bold mb-6">Assign Grade</h2>
              
              {/* Grade Scale Reminder */}
              <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-3 mb-4 text-sm">
                <p className="text-yellow-200">
                  <span className="font-semibold">⚠️ Important:</span> Enter grades on a <strong>0-20 scale</strong> (Portuguese grading system).
                </p>
              </div>

              <form onSubmit={handleAddGrade} className="space-y-4">
                <select value={newGrade.student_id} onChange={e => setNewGrade({ ...newGrade, student_id: e.target.value })} className="w-full bg-gray-700 p-3 rounded border border-gray-600" required>
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={newGrade.subject} onChange={e => setNewGrade({ ...newGrade, subject: e.target.value })} className="w-full bg-gray-700 p-3 rounded border border-gray-600" required>
                  {subjects.map(s => <option key={s.key} value={s}>{s}</option>)}
                </select>
                <input type="number" placeholder="Score (0-20)" min="0" max="20" step="0.1" value={newGrade.score} onChange={e => setNewGrade({ ...newGrade, score: Number(e.target.value) })} className="w-full bg-gray-700 p-3 rounded border border-gray-600" required />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold">Submit Grade</button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* --- Delete Modal --- */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-8 rounded-lg w-full max-w-sm border border-gray-700 text-center shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-400 mb-8">Delete <span className="text-white font-semibold">{deleteModal.name}</span>? This cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteModal({ ...deleteModal, open: false })} className="flex-1 bg-gray-700 py-3 rounded hover:bg-gray-600">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 py-3 rounded hover:bg-red-700 font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
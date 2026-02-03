/**
 * GradeTable Component
 * ====================
 * Reusable table for displaying grade data with optional actions.
 */

'use client';

interface Grade {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  grade?: string;
  date?: string;
}

interface Student {
  id: string;
  name: string;
}

interface GradeTableProps {
  grades: Grade[];
  students?: Student[];
  onEdit?: (grade: Grade) => void;
  onDelete?: (id: string, displayName: string) => void;
  showActions?: boolean;
  showStudent?: boolean;
}

export default function GradeTable({ 
  grades, 
  students = [],
  onEdit, 
  onDelete,
  showActions = true,
  showStudent = true
}: GradeTableProps) {
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown';
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-700">
          <tr>
            {showStudent && <th className="p-4">Student</th>}
            <th className="p-4">Subject</th>
            <th className="p-4">Score</th>
            <th className="p-4">Grade</th>
            {grades.some(g => g.date) && <th className="p-4">Date</th>}
            {showActions && <th className="p-4">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {grades.map(grade => {
            const studentName = getStudentName(grade.studentId);
            return (
              <tr key={grade.id} className="border-b border-gray-700 hover:bg-gray-750">
                {showStudent && <td className="p-4 font-medium">{studentName}</td>}
                <td className="p-4">{grade.subject}</td>
                <td className="p-4">{grade.score}%</td>
                <td className="p-4">{grade.grade || '-'}</td>
                {grades.some(g => g.date) && <td className="p-4 text-gray-400">{grade.date || '-'}</td>}
                {showActions && (
                  <td className="p-4">
                    {onEdit && (
                      <button 
                        onClick={() => onEdit(grade)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm mr-2 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(grade.id, `${studentName}'s ${grade.subject}`)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
          {grades.length === 0 && (
            <tr>
              <td colSpan={showActions ? 6 : 5} className="p-8 text-center text-gray-500">
                No grades found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

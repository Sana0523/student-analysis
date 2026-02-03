/**
 * StudentTable Component
 * =======================
 * Reusable table for displaying student data with optional actions.
 */

'use client';

interface Student {
  id: string;
  name: string;
  email: string;
  age: number;
  study_hours: number;
  failures: number;
  absences: number;
}

interface Prediction {
  studentId: string;
  risk_level: string;
  predicted_grade?: string;
}

interface StudentTableProps {
  students: Student[];
  predictions?: Prediction[];
  onEdit?: (student: Student) => void;
  onDelete?: (id: string, name: string) => void;
  showActions?: boolean;
}

const getRiskColor = (risk: string | undefined) => {
  switch (risk?.toLowerCase()) {
    case 'high': return 'bg-red-500 text-red-100';
    case 'medium': return 'bg-yellow-500 text-yellow-100';
    case 'low': return 'bg-green-500 text-green-100';
    default: return 'bg-gray-600 text-gray-200';
  }
};

export default function StudentTable({ 
  students, 
  predictions = [], 
  onEdit, 
  onDelete,
  showActions = true 
}: StudentTableProps) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-700">
          <tr>
            <th className="p-4">Name</th>
            <th className="p-4">Email</th>
            <th className="p-4">Age</th>
            <th className="p-4">Study Hours</th>
            <th className="p-4">Failures</th>
            <th className="p-4">Absences</th>
            {predictions.length > 0 && <th className="p-4">Risk Level</th>}
            {showActions && <th className="p-4">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {students.map(student => {
            const prediction = predictions.find(p => p.studentId === student.id);
            return (
              <tr key={student.id} className="border-b border-gray-700 hover:bg-gray-750">
                <td className="p-4 font-medium">{student.name}</td>
                <td className="p-4 text-gray-300">{student.email}</td>
                <td className="p-4">{student.age}</td>
                <td className="p-4">{student.study_hours}/week</td>
                <td className="p-4">{student.failures}</td>
                <td className="p-4">{student.absences}</td>
                {predictions.length > 0 && (
                  <td className="p-4">
                    {prediction ? (
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRiskColor(prediction.risk_level)}`}>
                        {prediction.risk_level}
                      </span>
                    ) : (
                      <span className="text-gray-500">Calculating...</span>
                    )}
                  </td>
                )}
                {showActions && (
                  <td className="p-4">
                    {onEdit && (
                      <button 
                        onClick={() => onEdit(student)}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm mr-2 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(student.id, student.name)}
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
          {students.length === 0 && (
            <tr>
              <td colSpan={showActions ? 8 : 7} className="p-8 text-center text-gray-500">
                No students found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

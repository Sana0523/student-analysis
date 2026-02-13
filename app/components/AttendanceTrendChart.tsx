'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AttendanceTrendProps {
  studentName: string;
  data: {
    weeks: string[];
    attendance_rate: number[];
    predicted_grades: number[];
  };
}

export default function AttendanceTrendChart({ studentName, data }: AttendanceTrendProps) {
  const chartData = {
    labels: data.weeks,
    datasets: [
      {
        label: 'Attendance Rate (%)',
        data: data.attendance_rate,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Predicted Grade (%)',
        data: data.predicted_grades,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        yAxisID: 'y1',
        tension: 0.3,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Attendance Impact Analysis - ${studentName}`,
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y.toFixed(1) + '%';
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Attendance Rate (%)'
        },
        min: 0,
        max: 100
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Predicted Grade (%)'
        },
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const currentAttendance = data.attendance_rate[data.attendance_rate.length - 1];
  const attendanceThreshold = 75;

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div style={{ height: '400px' }}>
        <Line data={chartData} options={options} />
      </div>
      
      {currentAttendance < attendanceThreshold && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Alert:</strong> Current attendance rate ({currentAttendance.toFixed(1)}%) 
            is below the recommended {attendanceThreshold}% threshold. 
            Intervention recommended to prevent grade decline.
          </p>
        </div>
      )}
      
      {currentAttendance >= attendanceThreshold && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            <strong>✅ Good Standing:</strong> Attendance rate is healthy at {currentAttendance.toFixed(1)}%. 
            Continue maintaining good attendance to support academic success.
          </p>
        </div>
      )}
    </div>
  );
}

"""
PDF Report Generator for Student Progress Reports
Uses ReportLab to create professional PDF documents
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime
import io

def generate_student_report(student_data, grades_data, prediction_data):
    """
    Generate a professional PDF report for a student
    
    Args:
        student_data: dict with student info (id, name, email, age, studytime, failures, absences)
        grades_data: list of grade records [{subject, score, max_marks, grade, date}, ...]
        prediction_data: dict with prediction results (predicted_grade, risk_level, explanation)
    
    Returns:
        BytesIO buffer containing the PDF
    """
    # Create PDF buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Container for PDF elements
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Custom title style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Custom heading style
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold'
    )
    
    # ==================== PAGE 1: HEADER & STUDENT INFO ====================
    
    # Title
    title = Paragraph(f"Student Progress Report", title_style)
    story.append(title)
    
    # Student name (prominent)
    name_style = ParagraphStyle('StudentName', parent=styles['Normal'], fontSize=18, 
                                 textColor=colors.HexColor('#1e40af'), alignment=TA_CENTER,
                                 fontName='Helvetica-Bold', spaceAfter=20)
    student_name = Paragraph(student_data['name'], name_style)
    story.append(student_name)
    
    story.append(Spacer(1, 0.3*inch))
    
    # Student Information Table
    info_data = [
        ['Student ID', str(student_data['id'])],
        ['Email', student_data.get('email', 'N/A')],
        ['Age', f"{student_data['age']} years"],
        ['Study Time Level', f"{student_data['studytime']}/4"],
        ['Previous Failures', str(student_data['failures'])],
        ['Absences', str(student_data['absences'])],
        ['Report Generated', datetime.now().strftime('%B %d, %Y at %H:%M')]
    ]
    
    info_table = Table(info_data, colWidths=[2.5*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
    ]))
    story.append(info_table)
    
    story.append(Spacer(1, 0.4*inch))
    
    # ==================== ACADEMIC PERFORMANCE SECTION ====================
    
    perf_heading = Paragraph("Academic Performance", heading_style)
    story.append(perf_heading)
    
    if grades_data and len(grades_data) > 0:
        # Grades table
        grade_headers = [['Subject', 'Score', 'Max Marks', 'Percentage', 'Grade']]
        grade_rows = grade_headers.copy()
        
        for grade in grades_data:
            percentage = (grade['score'] / grade['max_marks']) * 100 if grade['max_marks'] > 0 else 0
            grade_rows.append([
                str(grade['subject']),
                str(grade['score']),
                str(grade['max_marks']),
                f"{percentage:.1f}%",
                str(grade['grade'])
            ])
        
        grades_table = Table(grade_rows, colWidths=[1.8*inch, 1*inch, 1.2*inch, 1.2*inch, 0.8*inch])
        grades_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('FONTSIZE', (0, 1), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 10),
            ('TOPPADDING', (0, 1), (-1, -1), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f3f4f6')),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
        ]))
        story.append(grades_table)
    else:
        no_grades = Paragraph("No grades recorded yet.", styles['Normal'])
        story.append(no_grades)
    
    story.append(Spacer(1, 0.4*inch))
    
    # ==================== AI PREDICTION ANALYSIS ====================
    
    pred_heading = Paragraph("AI Prediction Analysis", heading_style)
    story.append(pred_heading)
    
    # Prediction summary box
    pred_grade = prediction_data.get('predicted_grade', 'N/A')
    risk_level = prediction_data.get('risk_level', 'Unknown')
    
    # Risk level color
    risk_colors = {
        'Low': colors.HexColor('#10b981'),
        'Medium': colors.HexColor('#f59e0b'),
        'High': colors.HexColor('#ef4444')
    }
    risk_color = risk_colors.get(risk_level, colors.grey)
    
    pred_data = [
        ['Predicted Final Grade', f"{pred_grade}%"],
        ['Risk Level', risk_level],
    ]
    
    pred_table = Table(pred_data, colWidths=[2.5*inch, 3*inch])
    pred_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e5e7eb')),
        ('BACKGROUND', (1, 1), (1, 1), risk_color),
        ('TEXTCOLOR', (1, 1), (1, 1), colors.whitesmoke),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 1), (1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
    ]))
    story.append(pred_table)
    
    story.append(Spacer(1, 0.3*inch))
    
    # ==================== FEATURE IMPORTANCE (SHAP) ====================
    
    if 'explanation' in prediction_data and 'top_factors' in prediction_data['explanation']:
        factors_heading = Paragraph("Key Factors Influencing Prediction", heading_style)
        story.append(factors_heading)
        
        # Explanation summary
        summary_text = prediction_data['explanation'].get('summary', '')
        summary_para = Paragraph(summary_text, styles['Normal'])
        story.append(summary_para)
        story.append(Spacer(1, 0.2*inch))
        
        # Top factors table
        factors = prediction_data['explanation']['top_factors'][:5]
        
        factor_headers = [['Factor', 'Value', 'Impact', 'Contribution']]
        factor_rows = factor_headers.copy()
        
        for factor in factors:
            impact_symbol = '↑' if factor['impact'] == 'positive' else '↓'
            factor_rows.append([
                factor['factor'],
                str(factor['value']),
                impact_symbol + ' ' + factor['impact'].title(),
                factor['contribution_percentage']
            ])
        
        factors_table = Table(factor_rows, colWidths=[2*inch, 1.2*inch, 1.5*inch, 1.3*inch])
        factors_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9fafb')),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
        ]))
        story.append(factors_table)
    
    story.append(Spacer(1, 0.3*inch))
    
    # ==================== RECOMMENDATIONS ====================
    
    rec_heading = Paragraph("Recommendations", heading_style)
    story.append(rec_heading)
    
    # Risk-based recommendations
    recommendations = {
        'High': "<b>Immediate Action Required:</b> This student is at high risk of academic difficulties. "
                "Schedule an urgent counseling session to address attendance issues and study habits. "
                "Consider additional tutoring support and regular progress monitoring.",
        
        'Medium': "<b>Monitor Closely:</b> This student shows some areas of concern. "
                  "Schedule a check-in meeting to discuss study habits and attendance. "
                  "Early intervention can prevent the situation from worsening.",
        
        'Low': "<b>On Track:</b> This student is performing well and is on track to meet academic goals. "
               "Continue to encourage current study habits and maintain regular communication."
    }
    
    rec_text = recommendations.get(risk_level, "Continue monitoring student progress.")
    rec_para = Paragraph(rec_text, styles['Normal'])
    story.append(rec_para)
    
    # ==================== FOOTER ====================
    
    story.append(Spacer(1, 0.5*inch))
    
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, 
                                   textColor=colors.grey, alignment=TA_CENTER)
    footer = Paragraph(
        f"Generated by Student Analysis Dashboard | {datetime.now().strftime('%B %d, %Y')}<br/>"
        "This report uses AI-powered predictions and should be used as one factor in academic planning.",
        footer_style
    )
    story.append(footer)
    
    # Build PDF
    doc.build(story)
    
    # Return buffer
    buffer.seek(0)
    return buffer


# Example usage function
def create_sample_report():
    """
    Create a sample report for testing
    """
    sample_student = {
        'id': 101,
        'name': 'John Doe',
        'email': 'john.doe@school.edu',
        'age': 16,
        'studytime': 2,
        'failures': 1,
        'absences': 10
    }
    
    sample_grades = [
        {'subject': 'Mathematics', 'score': 15, 'max_marks': 20, 'grade': 'B+'},
        {'subject': 'Portuguese', 'score': 12, 'max_marks': 20, 'grade': 'C+'},
        {'subject': 'Science', 'score': 16, 'max_marks': 20, 'grade': 'A-'},
        {'subject': 'History', 'score': 14, 'max_marks': 20, 'grade': 'B'}
    ]
    
    sample_prediction = {
        'predicted_grade': '72.50',
        'risk_level': 'Medium',
        'explanation': {
            'summary': 'Medium Risk: Primary concerns are Absences (10), Failures (1)',
            'top_factors': [
                {'factor': 'G2', 'value': 13, 'impact': 'positive', 'contribution_percentage': '+8.2%'},
                {'factor': 'Absences', 'value': 10, 'impact': 'negative', 'contribution_percentage': '-6.5%'},
                {'factor': 'G1', 'value': 12, 'impact': 'positive', 'contribution_percentage': '+7.1%'},
                {'factor': 'Failures', 'value': 1, 'impact': 'negative', 'contribution_percentage': '-4.3%'}
            ]
        }
    }
    
    pdf_buffer = generate_student_report(sample_student, sample_grades, sample_prediction)
    
    # Save to file for testing
    with open('sample_student_report.pdf', 'wb') as f:
        f.write(pdf_buffer.read())
    
    print("Sample report generated: sample_student_report.pdf")

if __name__ == '__main__':
    create_sample_report()

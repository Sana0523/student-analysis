import { NextResponse} from 'next/server';
import { PythonShell } from 'python-shell';
import jwt from 'jsonwebtoken';
const SECRET_KEY = "key should match the one in the login route";
const verifyToken = (token:string) => {
      try{
            jwt.verify(token, SECRET_KEY);
            return true;
      } catch (error) {
            return false;
      }
};

export async function POST(request:Request) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.split(' ')[1];
      if(!token || !verifyToken(token)) {
            return NextResponse.json({  message: 'Unauthorized' }, { status: 401 });
      }
      try{
            const body=request.json();
            const { studentData,max_Marks } = body;
             const options = {
                  mode='json',
                  pythonOptions: ['-u'],
                  scriptPath: './',
                  args: [JSON.stringify(studentData), max_marks.toString()]
             };
             const results= await PythonShell.run('predict_script.py',options);
             const predictionresult=results[0];
             if(predictionresult.success) {
                  return NextResponse.json({ success: true, predictions: predictionresult });
            } else {
                  return NextResponse.json({ success: false, message: predictionresult.message }, { status: 500 });
            }
      }

      catch (error) {
        console.error('Prediction API Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to get prediction.' }, { status: 500 });
    }
}
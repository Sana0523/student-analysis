import { NextResponse} from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://127.0.0.1:5000/predict';
const SECRET_KEY = process.env.JWT_SECRET_KEY || "my-super-secret-key-for-development";

export async function POST(request:Request) {
      try{
            const headersList=headers();
            const authHeader = headersList.get('authorization');
            if(!authHeader || !authHeader.startsWith('Bearer ')){
                  return NextResponse.json({ success:false,message:'Unauthorized: No token provided'},{status:401});
            }
            const token = authHeader.split(' ')[1];
            try{
                  jwt.verify(token, SECRET_KEY);
            } catch (error) {
                  return NextResponse.json({ success:false,message:'Unauthorized: Invalid token'},{status:401});
            }
            const body=await request.json();
            const { studentData,max_marks } = body;
            if(!studentData || !max_marks) {
                  return NextResponse.json({ success:false,message:'Bad Request: Missing studentData or max_Marks'},{status:400});
            }
            const flaskResponse = await fetch(FLASK_API_URL, {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ studentData, max_marks }),
                  signal: AbortSignal.timeout(10000), // 10 seconds timeout
            });
            const predictionData= await flaskResponse.json();
            if(!flaskResponse.ok) {
                  console.error('Error from Flask API:', predictionData.message || 'Unkown error');
                  throw new Error(predictionData.message || 'Error from prediction service');
            }
            return NextResponse.json(predictionData);
      }

      catch (error:any) {
        console.error('Error in /api/predictions route:', error.message);
        return NextResponse.json({ success: false, message: `An internal server error occurred: ${error.message}` }, { status: 500 });
    }
}
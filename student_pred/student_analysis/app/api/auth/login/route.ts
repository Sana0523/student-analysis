import { NextResponse } from "next/server";
import { users } from "@/app/lib/mockData";
export async function POST(request: Request) {
  const body=await request.json();
  const { email, password } = body;
  // Extracted data from response
  
  const user =users.find(
    (u) => u.email==email && u.password==password 
  );
  if(user){
    const userWithoutPasswrod={
      id:user.id,
      email:user.email,
      role:user.role
    };
    return NextResponse.json
    ({success: true,
      token: "fake-token-123456",
      user: userWithoutPasswrod});
  }
  else{
    return NextResponse.json(
      {success: false, message: "Invalid credentials"},
      { status: 401 }
    );
  }
  }
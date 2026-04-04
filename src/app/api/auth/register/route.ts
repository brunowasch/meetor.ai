import { NextResponse } from "next/server";

export async function GET() {
  const connectSkillsUrl = process.env.CONNECT_SKILLS_URL || "http://localhost:3000";
  return NextResponse.redirect(`${connectSkillsUrl}/register?origin=mentorconnect`);
}
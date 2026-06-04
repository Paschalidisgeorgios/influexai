import { NextRequest, NextResponse } from "next/server";
import { akoolAuthHeaders, getAkoolToken } from "@/lib/akool";

const AKOOL_BASE_URL = "https://openapi.akool.com/api/open/v3";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = await akoolAuthHeaders();

    const response = await fetch(`${AKOOL_BASE_URL}/content/video/lipsync`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok || data.code !== 1000) {
      return NextResponse.json(
        {
          success: false,
          error: data.msg ?? "Akool request failed",
          data,
        },
        { status: response.status >= 400 ? response.status : 502 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Akool request failed";
    if (message.includes("authentication")) {
      return NextResponse.json(
        { success: false, error: "Akool authentication failed" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const videoModelId = request.nextUrl.searchParams.get("video_model_id");
    if (!videoModelId) {
      return NextResponse.json(
        { success: false, error: "video_model_id required" },
        { status: 400 }
      );
    }

    const token = await getAkoolToken();
    if (!token && !process.env.AKOOL_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Akool authentication failed" },
        { status: 401 }
      );
    }

    const headers = await akoolAuthHeaders();
    const url = `${AKOOL_BASE_URL}/content/video/infobymodelid?video_model_id=${encodeURIComponent(videoModelId)}`;
    const response = await fetch(url, { method: "GET", headers });
    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Akool status failed",
      },
      { status: 500 }
    );
  }
}

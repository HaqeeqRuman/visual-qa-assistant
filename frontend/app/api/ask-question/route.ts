import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File
    const question = formData.get("question") as string

    if (!image || !question) {
      return NextResponse.json({ error: "Image and question are required" }, { status: 400 })
    }

    // Create FormData to send to your Python backend
    const pythonBackendFormData = new FormData()
    pythonBackendFormData.append("image", image)
    pythonBackendFormData.append("question", question)

    // Replace 'YOUR_PYTHON_BACKEND_URL' with your actual Python backend URL
    // For example: 'http://localhost:8000/ask-question' or 'https://your-python-api.com/ask-question'
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000/ask-question"

    const response = await fetch(pythonBackendUrl, {
      method: "POST",
      body: pythonBackendFormData,
    })

    if (!response.ok) {
      throw new Error(`Python backend responded with status: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({ answer: data.answer })
  } catch (error) {
    console.error("Error communicating with Python backend:", error)
    return NextResponse.json({ error: "Failed to process the question. Please try again." }, { status: 500 })
  }
}

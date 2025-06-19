"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Send, ImageIcon, MessageCircle, Sparkles, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface Message {
  id: string;
  type: "question" | "answer";
  content: string;
  timestamp: Date;
}

export default function ImageQAApp() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setMessages([]);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.start();
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !imageFile) return;

    const questionMessage: Message = {
      id: Date.now().toString(),
      type: "question",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, questionMessage]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("question", question);

      const response = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      const data = await response.json();

      const answerMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "answer",
        content: data.answer || "Sorry, I could not process your question.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, answerMessage]);

      // 🔊 Play the voice response
      if (data.audio) {
        const audio = new Audio(`http://localhost:5000${data.audio}`);
        audio.play();
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "answer",
        content: "Sorry, there was an error processing your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setQuestion("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-emerald-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Visual Q&A Assistant
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Upload an image and ask questions by typing or speaking</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Upload Card */}
          <Card className="border-2 border-dashed border-emerald-200 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                  <ImageIcon className="h-6 w-6 text-emerald-600" />
                  Upload Image
                </h2>

                {!uploadedImage ? (
                  <div
                    className="border-2 border-dashed border-emerald-300 rounded-lg p-12 cursor-pointer hover:border-emerald-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg mb-2">Click to upload an image</p>
                    <p className="text-gray-400 text-sm">Supports JPG, PNG, GIF up to 10MB</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden shadow-lg">
                      <Image
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Uploaded image"
                        width={500}
                        height={400}
                        className="w-full h-auto object-contain max-h-96"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Change Image
                    </Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Chat Card */}
          <Card className="bg-white/70 backdrop-blur-sm h-[600px] flex flex-col">
            <CardContent className="p-6 h-full flex flex-col">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-teal-600" />
                Ask Questions
              </h2>

              {/* Scrollable Message Area */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Upload an image and start asking questions!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "question" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-lg ${
                          message.type === "question"
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">
                          {message.type === "question" ? "You" : "AI Assistant"}
                        </p>
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 max-w-[80%] p-4 rounded-lg">
                      <p className="text-sm font-medium mb-1">AI Assistant</p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        </div>
                        <span className="text-sm text-gray-500">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area with voice button */}
              <form onSubmit={handleQuestionSubmit} className="flex gap-2 mt-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={uploadedImage ? "Ask a question about the image..." : "Upload an image first"}
                  disabled={!uploadedImage || isLoading}
                  className="flex-1 border-emerald-200 focus:border-emerald-400"
                />
                <Button
                  type="button"
                  onClick={startVoiceInput}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                  disabled={!uploadedImage || isLoading}
                  title="Speak your question"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  disabled={!uploadedImage || !question.trim() || isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

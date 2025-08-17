"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertCircle,
  FileText,
  MapPin,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  VideoIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Message {
  id: string;
  phoneNumber: string;
  messageText: string;
  messageType: "text" | "template" | "location_request" | "media";
  direction: "incoming" | "outgoing";
  whatsappMessageId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  mediaId?: string;
  teamId?: number;
  sentByTeamMemberId?: number;
  contact?: {
    name: string;
    phoneNumber: string;
  };
}

interface Contact {
  id: string;
  phoneNumber: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  teamId: number;
  createdAt: string;
  updatedAt: string;
  name?: string;
  avatar?: string;
}

interface MediaFile {
  id: string;
  filename: string;
  url: string;
  type: string;
  uploadedAt: string;
}

interface Template {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  components: Array<{
    type: string;
    text?: string;
    format?: string;
    example?: any;
    buttons?: Array<{
      type: string;
      text: string;
      url?: string;
      example?: string[];
    }>;
  }>;
}

export default function LiveChatPage() {
  const router = useRouter();
  const { authData, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading_api, setIsLoading_api] = useState(false);
  const [messageType, setMessageType] = useState<
    "text" | "template" | "location"
  >("text");
  const [templateName, setTemplateName] = useState("");
  const [languageCode, setLanguageCode] = useState("en_US");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [showApiTest, setShowApiTest] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  useEffect(() => {
    if (!isLoading && !authData.username) {
      router.push("/login");
    }

    // Check if user has a team selected
    if (!isLoading && authData.username && !authData.ownerUsername) {
      router.push("/dashboard");
    }
  }, [authData.username, authData.ownerUsername, isLoading, router]);

  // Fetch conversations on component mount
  useEffect(() => {
    if (authData.ownerUsername && authData.token) {
      fetchConversations();
      fetchTemplates();
    }
  }, [authData.ownerUsername, authData.token]);

  // Fetch conversations from API
  const fetchConversations = async () => {
    if (!authData.ownerUsername || !authData.token) return;

    try {
      setIsLoadingConversations(true);
      setError(null);

      console.log(
        "Fetching conversations from:",
        `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/conversations`
      );

      const response = await fetch(
        `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/conversations`,
        {
          headers: {
            Authorization: `Bearer ${authData.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Expected JSON but got:", text.substring(0, 200));
          setError(
            "Server returned invalid response format. Please check if the API server is running correctly."
          );
          return;
        }

        const data = await response.json();
        if (data.success) {
          const conversations = data.data.conversations.map((conv: any) => ({
            id: conv.id.toString(),
            phoneNumber: conv.phoneNumber,
            lastMessage: conv.lastMessage || "",
            lastMessageTime: conv.lastMessageTime,
            unreadCount: conv.unreadCount || 0,
            teamId: conv.teamId,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            name: conv.contact?.name || `Contact ${conv.phoneNumber}`,
            avatar: "/placeholder.svg",
          }));
          setContacts(conversations);
        } else {
          setError(data.error || "Failed to fetch conversations");
        }
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          setError(
            errorData.error ||
              `API Error: ${response.status} ${response.statusText}`
          );
        } else {
          const text = await response.text();
          console.error("Error response:", text.substring(0, 200));
          setError(
            `API Error: ${response.status} ${response.statusText}. Server may be down or endpoint incorrect.`
          );
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      if (
        error instanceof SyntaxError &&
        error.message.includes("Unexpected token")
      ) {
        setError(
          "API server returned HTML instead of JSON. Please check if the API base URL is correct and the server is running."
        );
      } else {
        setError(
          "Network error while fetching conversations. Please check your connection and API server status."
        );
      }
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Fetch message history for selected contact
  const fetchMessageHistory = async (phoneNumber: string) => {
    if (!authData.ownerUsername || !authData.token) return;

    try {
      setError(null);

      console.log(
        "Fetching messages from:",
        `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/messages/${phoneNumber}`
      );

      const response = await fetch(
        `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/messages/${phoneNumber}`,
        {
          headers: {
            Authorization: `Bearer ${authData.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Expected JSON but got:", text.substring(0, 200));
          setError("Server returned invalid response format for messages.");
          return;
        }

        const data = await response.json();
        if (data.success) {
          setMessages(data.data.messages);
          // Mark messages as read
          markMessagesAsRead(phoneNumber);
        } else {
          setError(data.error || "Failed to fetch message history");
        }
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          setError(errorData.error || "Failed to fetch message history");
        } else {
          const text = await response.text();
          console.error("Error response:", text.substring(0, 200));
          setError(
            `Failed to fetch messages: ${response.status} ${response.statusText}`
          );
        }
      }
    } catch (error) {
      console.error("Error fetching message history:", error);
      if (
        error instanceof SyntaxError &&
        error.message.includes("Unexpected token")
      ) {
        setError(
          "API server returned HTML instead of JSON for messages. Please check the API configuration."
        );
      } else {
        setError("Network error while fetching messages");
      }
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (phoneNumber: string) => {
    if (!authData.ownerUsername || !authData.token) return;

    try {
      const response = await fetch(
        `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/messages/${phoneNumber}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authData.token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state to reflect read status
          setContacts((prev) =>
            prev.map((contact) =>
              contact.phoneNumber === phoneNumber
                ? { ...contact, unreadCount: 0 }
                : contact
            )
          );
        }
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  useEffect(() => {
    if (selectedContact) {
      fetchMessageHistory(selectedContact.phoneNumber);
      setError(null); // Clear any previous errors when switching contacts
      // Reset message form when switching contacts
      setNewMessage("");
      setTemplateName("");
      setSelectedTemplate(null);
      setMessageType("text");
    }
  }, [selectedContact]);

  // Clear error when user changes message type or starts typing
  useEffect(() => {
    if (error) {
      setError(null);
    }
    if (successMessage) {
      setSuccessMessage(null);
    }
  }, [messageType, newMessage, templateName, languageCode]);

  // Auto-refresh conversations every 30 seconds
  useEffect(() => {
    if (authData.ownerUsername && authData.token) {
      const interval = setInterval(() => {
        fetchConversations();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [authData.ownerUsername, authData.token]);

  // Helper function to get template preview text
  const getTemplatePreview = (template: Template) => {
    const bodyComponent = template.components.find(
      (comp) => comp.type === "BODY"
    );
    const headerComponent = template.components.find(
      (comp) => comp.type === "HEADER"
    );

    if (headerComponent?.text) {
      return headerComponent.text;
    }
    if (bodyComponent?.text) {
      return bodyComponent.text.length > 50
        ? bodyComponent.text.substring(0, 50) + "..."
        : bodyComponent.text;
    }
    return "No content";
  };

  // Handle template selection
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setTemplateName(template.name);
  };

  // Test API connection
  const testApiConnection = async () => {
    if (!authData.ownerUsername || !authData.token) {
      setError("Missing owner username or token for API test");
      return;
    }

    try {
      setError(null);
      const testUrl = `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/conversations`;
      console.log("Testing API connection to:", testUrl);

      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authData.token}`,
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers.get("content-type");
      const responseText = await response.text();

      console.log("Test Response:", {
        status: response.status,
        statusText: response.statusText,
        contentType,
        responsePreview: responseText.substring(0, 500),
      });

      if (contentType && contentType.includes("application/json")) {
        const data = JSON.parse(responseText);
        setSuccessMessage(
          `API Test Successful! Got ${
            data.data?.conversations?.length || 0
          } conversations`
        );
      } else {
        setError(
          `API returned HTML instead of JSON. Response: ${responseText.substring(
            0,
            200
          )}...`
        );
      }
    } catch (error) {
      console.error("API Test Error:", error);
      setError(
        `API Test Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Fetch templates from API
  const fetchTemplates = async () => {
    if (!authData.ownerUsername || !authData.token) return;

    try {
      setIsLoadingTemplates(true);
      const response = await fetch(
        `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/templates`,
        {
          headers: {
            Authorization: `Bearer ${authData.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setTemplates(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sendMessage = async () => {
    if (!selectedContact || !authData.ownerUsername || !authData.token) return;

    // Validate based on message type
    if (messageType === "text" && !newMessage.trim()) return;
    if (messageType === "template" && !selectedTemplate) {
      setError("Please select a template to send");
      return;
    }
    if (messageType === "location" && !newMessage.trim()) {
      setError("Location request message is required");
      return;
    }

    setIsLoading_api(true);
    setError(null);

    try {
      let endpoint = "";
      let body: any = {};

      switch (messageType) {
        case "text":
          endpoint = `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/sendtext`;
          body = {
            to: selectedContact.phoneNumber,
            message: newMessage,
          };
          break;
        case "template":
          endpoint = `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/sendtemplate`;
          body = {
            to: selectedContact.phoneNumber,
            template_name: selectedTemplate?.name,
            language_code: selectedTemplate?.language || "en_US",
          };
          break;
        case "location":
          endpoint = `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/location/request`;
          body = {
            to: selectedContact.phoneNumber,
            message: newMessage,
          };
          break;
      }

      console.log("Sending message to:", endpoint);
      console.log("Request body:", body);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify(body),
      });

      console.log("Send message response status:", response.status);

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Expected JSON but got:", text.substring(0, 200));
          setError(
            "Server returned invalid response format when sending message."
          );
          return;
        }

        const data = await response.json();
        if (data.success) {
          // Add the message to local state immediately for better UX
          const newMsg: Message = {
            id: data.data.messageId.toString(),
            phoneNumber: selectedContact.phoneNumber,
            messageText:
              messageType === "template"
                ? `Template: ${selectedTemplate?.name}`
                : newMessage,
            messageType:
              messageType === "location" ? "location_request" : messageType,
            direction: "outgoing",
            isRead: true,
            createdAt: data.data.timestamp || new Date().toISOString(),
            updatedAt: data.data.timestamp || new Date().toISOString(),
            whatsappMessageId:
              data.data.whatsappMessageId || data.data.messageId.toString(),
          };
          setMessages((prev) => [...prev, newMsg]);
          setNewMessage("");
          setTemplateName("");
          setSelectedTemplate(null);

          // Show success message
          const typeText =
            messageType === "template"
              ? "Template message"
              : messageType === "location"
              ? "Location request"
              : "Message";
          setSuccessMessage(`${typeText} sent successfully!`);

          // Clear success message after 3 seconds
          setTimeout(() => setSuccessMessage(null), 3000);

          // Refresh conversations to update last message
          fetchConversations();
        } else {
          setError(data.error || "Failed to send message");
        }
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          setError(
            errorData.error ||
              `Failed to send message: ${response.status} ${response.statusText}`
          );
        } else {
          const text = await response.text();
          console.error("Error response:", text.substring(0, 200));
          setError(
            `Failed to send message: ${response.status} ${response.statusText}. Check API endpoint.`
          );
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      if (
        error instanceof SyntaxError &&
        error.message.includes("Unexpected token")
      ) {
        setError(
          "API server returned HTML instead of JSON when sending message. Please check the API configuration."
        );
      } else {
        setError("Network error while sending message");
      }
    } finally {
      setIsLoading_api(false);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    if (!authData.ownerUsername || !authData.token) return;

    try {
      const response = await fetch(
        `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/media/${mediaId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authData.token}`,
          },
        }
      );

      if (response.ok) {
        setMediaFiles((prev) => prev.filter((media) => media.id !== mediaId));
      }
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      (contact.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(searchQuery)
  );

  if (!authData.username) {
    return null;
  }

  return (
    <div className="h-screen flex bg-background">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Chat Interface */}
      <div className="flex-1 flex bg-gray-100">
        {/* Left Sidebar - Contacts */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/abstract-geometric-shapes.png" />
                <AvatarFallback>
                  {authData.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search or start a new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Loading conversations...
                </span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-sm text-gray-500">No conversations found</p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    selectedContact?.id === contact.id ? "bg-gray-100" : ""
                  }`}
                >
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={contact.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {(contact.name || "?").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {contact.name || contact.phoneNumber}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(contact.lastMessageTime).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {contact.lastMessage}
                      </p>
                      {contact.unreadCount > 0 && (
                        <Badge className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage
                      src={selectedContact.avatar || "/placeholder.svg"}
                    />
                    <AvatarFallback>
                      {(
                        selectedContact.name || selectedContact.phoneNumber
                      ).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-medium text-gray-900">
                      {selectedContact.name || selectedContact.phoneNumber}
                    </h2>
                    <p className="text-sm text-gray-500">online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <VideoIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Encryption Notice */}
              <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-center">
                <p className="text-xs text-yellow-800">
                  🔒 Messages are end-to-end encrypted. No one outside of this
                  chat, not even WhatsApp, can read or listen to them.
                </p>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 chat-background">
                <div className="text-center mb-4">
                  <span className="bg-white px-3 py-1 rounded-lg text-xs text-gray-600 shadow-sm">
                    TODAY
                  </span>
                </div>

                <div className="space-y-2">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.direction === "outgoing"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-sm ${
                          message.direction === "outgoing"
                            ? "bg-green-500 text-white rounded-br-none"
                            : "bg-white text-gray-900 rounded-bl-none"
                        }`}
                      >
                        {/* Message Type Indicator */}
                        {message.messageType !== "text" && (
                          <div
                            className={`flex items-center gap-1 mb-1 text-xs ${
                              message.direction === "outgoing"
                                ? "text-green-100"
                                : "text-gray-500"
                            }`}
                          >
                            {message.messageType === "template" && (
                              <>
                                <FileText className="h-3 w-3" />
                                Template Message
                              </>
                            )}
                            {message.messageType === "location_request" && (
                              <>
                                <MapPin className="h-3 w-3" />
                                Location Request
                              </>
                            )}
                          </div>
                        )}

                        <p className="text-sm">{message.messageText}</p>
                        <div className="flex items-center justify-end mt-1 gap-1">
                          <span
                            className={`text-xs ${
                              message.direction === "outgoing"
                                ? "text-green-100"
                                : "text-gray-500"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                          {message.direction === "outgoing" && (
                            <span className="text-green-100 text-xs">
                              {message.isRead ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="bg-gray-50 border-t border-gray-200 p-4 space-y-3">
                {/* API Debug Info - Remove this after fixing the issue */}
                {error && error.includes("HTML instead of JSON") && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Debug Info:</strong>
                      <br />
                      API Base URL:{" "}
                      {process.env.NEXT_PUBLIC_API_BASE_URL || "Not set"}
                      <br />
                      Owner Username: {authData.ownerUsername}
                      <br />
                      Token: {authData.token ? "Present" : "Missing"}
                      <br />
                      Expected endpoint: {process.env.NEXT_PUBLIC_API_BASE_URL}/
                      {authData.ownerUsername}/conversations
                      <br />
                      <Button
                        onClick={testApiConnection}
                        size="sm"
                        className="mt-2 bg-blue-600 hover:bg-blue-700"
                      >
                        Test API Connection
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success Message Display */}
                {successMessage && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {successMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Display */}
                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Message Type Selection */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    Type:
                  </span>
                  <Select
                    value={messageType}
                    onValueChange={(value: "text" | "template" | "location") =>
                      setMessageType(value)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Text Message
                        </div>
                      </SelectItem>
                      <SelectItem value="template">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Template
                        </div>
                      </SelectItem>
                      <SelectItem value="location">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location Request
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Template Inputs */}
                {messageType === "template" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Select Template
                      </label>
                      <Select
                        value={selectedTemplate?.id || ""}
                        onValueChange={(value) => {
                          const template = templates.find(
                            (t) => t.id === value
                          );
                          if (template) {
                            handleTemplateSelect(template);
                          }
                        }}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Choose a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingTemplates ? (
                            <SelectItem value="" disabled>
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                Loading templates...
                              </div>
                            </SelectItem>
                          ) : templates.length === 0 ? (
                            <SelectItem value="" disabled>
                              No templates available
                            </SelectItem>
                          ) : (
                            templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                <div className="flex flex-col items-start gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {template.name}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                      {template.category}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500 truncate max-w-xs">
                                    {getTemplatePreview(template)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedTemplate && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileText className="h-3 w-3 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-blue-900 mb-1">
                              {selectedTemplate.name}
                            </h4>
                            <p className="text-xs text-blue-700 mb-2">
                              {getTemplatePreview(selectedTemplate)}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                {selectedTemplate.category}
                              </span>
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                {selectedTemplate.language}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Message Input */}
                <div className="flex items-end gap-2">
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                    <Paperclip className="h-5 w-5 text-gray-500" />
                  </Button>
                  <div className="flex-1 bg-white rounded-full border border-gray-300 px-4 py-2">
                    <Input
                      placeholder={
                        messageType === "text"
                          ? "Type a message here..."
                          : messageType === "location"
                          ? "Enter location request message..."
                          : "Template will be sent automatically"
                      }
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      disabled={messageType === "template"}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={
                      isLoading_api ||
                      (messageType === "text" && !newMessage.trim()) ||
                      (messageType === "template" && !selectedTemplate) ||
                      (messageType === "location" && !newMessage.trim())
                    }
                    className="h-10 w-10 p-0 rounded-full bg-green-500 hover:bg-green-600"
                  >
                    {isLoading_api ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* No Contact Selected */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-64 h-64 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-6xl">💬</span>
                  </div>
                </div>
                <h2 className="text-2xl font-light text-gray-600 mb-2">
                  WhatsApp Web
                </h2>
                <p className="text-gray-500 max-w-md">
                  Send and receive messages without keeping your phone online.
                  <br />
                  Use WhatsApp on up to 4 linked devices and 1 phone at the same
                  time.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

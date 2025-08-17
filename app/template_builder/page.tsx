"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

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

interface CreateTemplateData {
  name: string;
  language: string;
  category: string;
  bodyText: string;
}

export default function TemplateBuilderPage() {
  const { authData, isLoading } = useAuth();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [isTemplateDetailOpen, setIsTemplateDetailOpen] = useState(false);
  const [isSendTemplateOpen, setIsSendTemplateOpen] = useState(false);
  const [selectedTemplateToSend, setSelectedTemplateToSend] =
    useState<Template | null>(null);
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [templateVariableValues, setTemplateVariableValues] = useState<
    string[]
  >([]);
  const [isSendingTemplate, setIsSendingTemplate] = useState(false);
  const [sendToPhone, setSendToPhone] = useState("");
  const [sendLanguage, setSendLanguage] = useState("en_US");

  const [formData, setFormData] = useState<CreateTemplateData>({
    name: "",
    language: "en_US",
    category: "UTILITY",
    bodyText: "",
  });

  // Fetch templates on component mount
  useEffect(() => {
    if (authData.ownerUsername) {
      fetchTemplates();
    }
  }, [authData.ownerUsername]);

  const fetchTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const response = await fetch(
        `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/templates`,
        {
          headers: {
            Authorization: `Bearer ${authData.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      setTemplates(data.data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to fetch templates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.bodyText) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch(
        `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/templates/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authData.token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create template");
      }

      toast({
        title: "Success",
        description: "Template created successfully!",
      });

      // Reset form and close dialog
      setFormData({
        name: "",
        language: "en_US",
        category: "UTILITY",
        bodyText: "",
      });
      setIsCreateDialogOpen(false);

      // Refresh templates list
      fetchTemplates();
    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTemplate = async (templateName: string) => {
    try {
      setIsDeleting(templateName);
      const response = await fetch(
        `http://localhost:PORT/${authData.ownerUsername}/templates/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authData.token}`,
          },
          body: JSON.stringify({ name: templateName }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      toast({
        title: "Success",
        description: "Template deleted successfully!",
      });

      // Refresh templates list
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "default";
      case "PENDING":
        return "secondary";
      case "REJECTED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "MARKETING":
        return "default";
      case "UTILITY":
        return "secondary";
      case "AUTHENTICATION":
        return "outline";
      default:
        return "outline";
    }
  };

  const handleRowClick = (template: Template) => {
    setSelectedTemplate(template);
    setIsTemplateDetailOpen(true);
  };

  const getComponentText = (components: Template["components"]) => {
    const bodyComponent = components.find((comp) => comp.type === "BODY");
    const headerComponent = components.find((comp) => comp.type === "HEADER");

    if (headerComponent?.text) {
      return `${headerComponent.text} - ${bodyComponent?.text || ""}`;
    }
    return bodyComponent?.text || "No text content";
  };

  const formatComponentType = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  const extractVariablesFromText = (text: string): string[] => {
    const variableRegex = /\{\{(\d+)\}\}/g;
    const matches = text.match(variableRegex);
    if (!matches) return [];

    const variables = matches.map((match) => {
      const num = match.replace(/\{\{|\}\}/g, "");
      return `Variable ${num}`;
    });

    return [...new Set(variables)]; // Remove duplicates
  };

  const handleSendTemplate = (template: Template) => {
    setSelectedTemplateToSend(template);

    // Extract variables from template components
    const bodyComponent = template.components.find(
      (comp) => comp.type === "BODY"
    );
    const variables = bodyComponent?.text
      ? extractVariablesFromText(bodyComponent.text)
      : [];
    setTemplateVariables(variables);

    // Initialize variable values
    const initialValues = variables.map(() => "");
    setTemplateVariableValues(initialValues);

    setIsSendTemplateOpen(true);
  };

  const sendTemplateMessage = async () => {
    if (
      !selectedTemplateToSend ||
      !sendToPhone.trim() ||
      !authData.ownerUsername ||
      !authData.token
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingTemplate(true);

    try {
      const response = await fetch(
        `https://ai.rajatkhandelwal.com/wa/${authData.ownerUsername}/sendtemplate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authData.token}`,
          },
          body: JSON.stringify({
            to: sendToPhone,
            template_name: selectedTemplateToSend.name,
            language_code: sendLanguage,
            variables:
              templateVariableValues.length > 0
                ? templateVariableValues
                : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send template");
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Template message sent successfully!",
        });

        // Reset form
        setSendToPhone("");
        setTemplateVariables([]);
        setTemplateVariableValues([]);
        setSelectedTemplateToSend(null);
        setIsSendTemplateOpen(false);
      } else {
        throw new Error(data.error || "Failed to send template");
      }
    } catch (error) {
      console.error("Error sending template:", error);
      toast({
        title: "Error",
        description: "Failed to send template message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingTemplate(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authData.username) {
    return null;
  }

  return (
    <div className="h-screen flex bg-background">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Template Builder
              </h1>
              <p className="text-muted-foreground">
                Create and manage your WhatsApp message templates
              </p>
              {authData.username !== authData.ownerUsername && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Team Member Access:</span> You
                    can view and send templates, but only team owners can create
                    new templates.
                  </p>
                </div>
              )}
            </div>
            {authData.username === authData.ownerUsername && (
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 px-6 py-2 h-11">
                    <Plus className="h-4 w-4" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Template Name *
                      </label>
                      <Input
                        placeholder="Enter template name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Language
                      </label>
                      <Input
                        placeholder="en_US"
                        value={formData.language}
                        onChange={(e) =>
                          setFormData({ ...formData, language: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Category
                      </label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTILITY">UTILITY</SelectItem>
                          <SelectItem value="MARKETING">MARKETING</SelectItem>
                          <SelectItem value="AUTHENTICATION">
                            AUTHENTICATION
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Body Text *
                      </label>
                      <Textarea
                        placeholder="Enter your message template. Use {'{{1}}'}, {'{{2}}'}, etc. for variables."
                        value={formData.bodyText}
                        onChange={(e) =>
                          setFormData({ ...formData, bodyText: e.target.value })
                        }
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use {"{{1}}"}, {"{{2}}"}, etc. to add variables to your
                        template
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateTemplate}
                      disabled={isCreating}
                      className="flex items-center gap-2"
                    >
                      {isCreating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      {isCreating ? "Creating..." : "Create Template"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-muted/20">
          <div className="w-full">
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Message Templates
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {templates.length} template
                      {templates.length !== 1 ? "s" : ""} available
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Live</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {isLoadingTemplates ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">
                        Loading templates...
                      </p>
                    </div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No templates yet
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Create your first message template to get started with
                      automated messaging
                    </p>
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="px-6"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border/50">
                          <TableHead className="w-1/5 font-semibold text-foreground">
                            Template Name
                          </TableHead>
                          <TableHead className="w-1/5 font-semibold text-foreground">
                            Category
                          </TableHead>
                          <TableHead className="w-1/5 font-semibold text-foreground">
                            Status
                          </TableHead>
                          <TableHead className="w-1/5 font-semibold text-foreground">
                            Language
                          </TableHead>
                          <TableHead className="w-1/5 text-right font-semibold text-foreground">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {templates.map((template) => (
                          <TableRow
                            key={template.id}
                            className="cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/30"
                            onClick={() => handleRowClick(template)}
                          >
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">
                                    {template.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    ID: {template.id}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge
                                variant={getCategoryBadgeVariant(
                                  template.category
                                )}
                                className="font-medium"
                              >
                                {template.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge
                                variant={getStatusBadgeVariant(template.status)}
                                className="font-medium"
                              >
                                {template.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4">
                              <Badge variant="outline" className="font-medium">
                                {template.language}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendTemplate(template);
                                  }}
                                  className="text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTemplate(template.name);
                                  }}
                                  disabled={isDeleting === template.name}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                >
                                  {isDeleting === template.name ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Template Detail Dialog */}
      <Dialog
        open={isTemplateDetailOpen}
        onOpenChange={setIsTemplateDetailOpen}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Template Details</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-muted/30 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Template Name
                    </label>
                    <p className="text-lg font-semibold text-foreground">
                      {selectedTemplate.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Template ID
                    </label>
                    <p className="text-sm font-mono bg-background px-3 py-1 rounded border">
                      {selectedTemplate.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Category
                    </label>
                    <Badge
                      variant={getCategoryBadgeVariant(
                        selectedTemplate.category
                      )}
                      className="text-sm"
                    >
                      {selectedTemplate.category}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Status
                    </label>
                    <Badge
                      variant={getStatusBadgeVariant(selectedTemplate.status)}
                      className="text-sm"
                    >
                      {selectedTemplate.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Language
                    </label>
                    <Badge variant="outline" className="text-sm">
                      {selectedTemplate.language}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Components */}
              <div>
                <label className="text-lg font-semibold text-foreground mb-4 block">
                  Template Components
                </label>
                <div className="space-y-4">
                  {selectedTemplate.components.map((component, index) => (
                    <div
                      key={index}
                      className="border border-border rounded-lg p-5 bg-card"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <Badge
                          variant="secondary"
                          className="text-sm font-medium"
                        >
                          {formatComponentType(component.type)}
                        </Badge>
                        {component.format && (
                          <Badge variant="outline" className="text-xs">
                            {component.format}
                          </Badge>
                        )}
                      </div>

                      {component.text && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Content
                          </label>
                          <div className="bg-muted/50 p-4 rounded-lg border">
                            <p className="text-sm font-mono whitespace-pre-wrap text-foreground">
                              {component.text}
                            </p>
                          </div>
                        </div>
                      )}

                      {component.example && component.example.body_text && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Example Values
                          </label>
                          <div className="bg-muted/50 p-4 rounded-lg border">
                            {component.example.body_text.map(
                              (example: string[], idx: number) => (
                                <div
                                  key={idx}
                                  className="font-mono text-sm text-foreground"
                                >
                                  {example.join(", ")}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {component.buttons && component.buttons.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground mb-3 block">
                            Interactive Buttons
                          </label>
                          <div className="space-y-3">
                            {component.buttons.map((button, btnIndex) => (
                              <div
                                key={btnIndex}
                                className="border border-border rounded-lg p-4 bg-muted/30"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-medium"
                                  >
                                    {button.type}
                                  </Badge>
                                  <span className="text-sm font-semibold text-foreground">
                                    {button.text}
                                  </span>
                                </div>
                                {button.url && (
                                  <div className="mb-2">
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                      URL
                                    </label>
                                    <p className="text-xs font-mono break-all bg-background px-3 py-2 rounded border">
                                      {button.url}
                                    </p>
                                  </div>
                                )}
                                {button.example &&
                                  button.example.length > 0 && (
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                        Example URLs
                                      </label>
                                      <div className="space-y-1">
                                        {button.example.map((example, idx) => (
                                          <p
                                            key={idx}
                                            className="text-xs font-mono break-all bg-background px-3 py-2 rounded border"
                                          >
                                            {example}
                                          </p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Template Dialog */}
      <Dialog open={isSendTemplateOpen} onOpenChange={setIsSendTemplateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Send Template Message</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Send a template message to a specific phone number
            </p>
          </DialogHeader>
          {selectedTemplateToSend && (
            <div className="space-y-6">
              {/* Template Preview */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {selectedTemplateToSend.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplateToSend.category}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getComponentText(selectedTemplateToSend.components)}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    To Phone Number *
                  </label>
                  <Input
                    placeholder="Enter phone number (e.g., 919876543210)"
                    value={sendToPhone}
                    onChange={(e) => setSendToPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include country code without + symbol
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Language Code
                  </label>
                  <Select
                    value={sendLanguage}
                    onValueChange={(value) => setSendLanguage(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_US">English (US)</SelectItem>
                      <SelectItem value="en_GB">English (UK)</SelectItem>
                      <SelectItem value="es_ES">Spanish (Spain)</SelectItem>
                      <SelectItem value="fr_FR">French (France)</SelectItem>
                      <SelectItem value="de_DE">German (Germany)</SelectItem>
                      <SelectItem value="it_IT">Italian (Italy)</SelectItem>
                      <SelectItem value="pt_BR">Portuguese (Brazil)</SelectItem>
                      <SelectItem value="hi_IN">Hindi (India)</SelectItem>
                      <SelectItem value="ar_SA">
                        Arabic (Saudi Arabia)
                      </SelectItem>
                      <SelectItem value="ja_JP">Japanese (Japan)</SelectItem>
                      <SelectItem value="ko_KR">
                        Korean (South Korea)
                      </SelectItem>
                      <SelectItem value="zh_CN">
                        Chinese (Simplified)
                      </SelectItem>
                      <SelectItem value="zh_TW">
                        Chinese (Traditional)
                      </SelectItem>
                      <SelectItem value="ru_RU">Russian (Russia)</SelectItem>
                      <SelectItem value="tr_TR">Turkish (Turkey)</SelectItem>
                      <SelectItem value="nl_NL">Dutch (Netherlands)</SelectItem>
                      <SelectItem value="sv_SE">Swedish (Sweden)</SelectItem>
                      <SelectItem value="da_DK">Danish (Denmark)</SelectItem>
                      <SelectItem value="fi_FI">Finnish (Finland)</SelectItem>
                      <SelectItem value="nb_NO">Norwegian (Norway)</SelectItem>
                      <SelectItem value="pl_PL">Polish (Poland)</SelectItem>
                      <SelectItem value="cs_CZ">
                        Czech (Czech Republic)
                      </SelectItem>
                      <SelectItem value="hu_HU">Hungarian (Hungary)</SelectItem>
                      <SelectItem value="ro_RO">Romanian (Romania)</SelectItem>
                      <SelectItem value="sk_SK">Slovak (Slovakia)</SelectItem>
                      <SelectItem value="sl_SI">
                        Slovenian (Slovenia)
                      </SelectItem>
                      <SelectItem value="el_GR">Greek (Greece)</SelectItem>
                      <SelectItem value="he_IL">Hebrew (Israel)</SelectItem>
                      <SelectItem value="id_ID">
                        Indonesian (Indonesia)
                      </SelectItem>
                      <SelectItem value="ms_MY">Malay (Malaysia)</SelectItem>
                      <SelectItem value="th_TH">Thai (Thailand)</SelectItem>
                      <SelectItem value="vi_VN">
                        Vietnamese (Vietnam)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {templateVariables.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">
                      Template Variables ({templateVariables.length})
                    </label>
                    <div className="space-y-3">
                      {templateVariables.map((variable, index) => (
                        <div key={index} className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">
                            {variable} (Variable {index + 1})
                          </label>
                          <Input
                            type="text"
                            placeholder={`Enter value for ${variable}`}
                            value={templateVariableValues[index] || ""}
                            onChange={(e) => {
                              const newValues = [...templateVariableValues];
                              newValues[index] = e.target.value;
                              setTemplateVariableValues(newValues);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {templateVariables.length === 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      This template has no variables. It will be sent as-is.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSendTemplateOpen(false);
                    setSendToPhone("");
                    setTemplateVariables([]);
                    setTemplateVariableValues([]);
                    setSelectedTemplateToSend(null);
                  }}
                  disabled={isSendingTemplate}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendTemplateMessage}
                  disabled={isSendingTemplate || !sendToPhone.trim()}
                  className="flex items-center gap-2"
                >
                  {isSendingTemplate ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isSendingTemplate ? "Sending..." : "Send Template"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

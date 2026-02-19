"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Save, 
  Eye,
  GripVertical
} from "lucide-react";
import { toast } from "sonner";
import { useSessionUser } from "@/hooks/use-session-user";
import { PrivacyPolicyDialog } from "@/components/dialogs/privacy-policy-dialog";
import { HelpCenterDialog } from "@/components/dialogs/help-center-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: string;
}

interface PrivacySection {
  id: string;
  title: string;
  content: string;
  icon: string;
}

export default function ContentManagementPage() {
  const { user } = useSessionUser();
  const isAdmin = user?.role === "admin";

  // Privacy Policy State
  const [privacySections, setPrivacySections] = useState<PrivacySection[]>([
    {
      id: "1",
      title: "Information We Collect",
      content: "We collect information you provide directly to us, including your X-Number, contact information, appointment details, and medical history necessary for healthcare services.",
      icon: "Shield"
    },
    {
      id: "2",
      title: "How We Protect Your Data",
      content: "We implement industry-standard security measures including encryption, secure OTP verification, and access controls. Your data is stored securely and only accessible to authorized healthcare personnel.",
      icon: "Lock"
    },
    {
      id: "3",
      title: "How We Use Your Information",
      content: "To schedule and manage your appointments. To provide medical surveillance and healthcare services. To send appointment reminders and health notifications. To comply with legal and regulatory requirements.",
      icon: "Eye"
    },
    {
      id: "4",
      title: "Your Rights",
      content: "You have the right to access, correct, or delete your personal information. You may also request a copy of your data or withdraw consent for certain processing activities.",
      icon: "FileText"
    },
    {
      id: "5",
      title: "Contact Us",
      content: "If you have any questions about this Privacy Policy or our data practices, please contact our Data Protection Officer through the Help Center or your healthcare provider.",
      icon: "Mail"
    }
  ]);

  // Help Center State
  const [faqItems, setFaqItems] = useState<FAQItem[]>([
    {
      id: "1",
      question: "How do I log in?",
      answer: "Enter your X-Number in the format X12345/67 on the login page. You'll receive a one-time password (OTP) via SMS to verify your identity.",
      icon: "Key"
    },
    {
      id: "2",
      question: "How do I book an appointment?",
      answer: "After logging in, navigate to the Appointments section and click 'New Appointment'. Select your preferred department, date, and time slot.",
      icon: "Calendar"
    },
    {
      id: "3",
      question: "What is an X-Number?",
      answer: "Your X-Number is your unique identifier in our system, formatted as X followed by 5 digits, a slash, and 2 more digits (e.g., X12345/67).",
      icon: "User"
    },
    {
      id: "4",
      question: "I didn't receive my OTP",
      answer: "Please wait a few minutes and check your SMS messages. If you still haven't received it, click 'Use a different X-Number' and try again.",
      icon: "Phone"
    }
  ]);

  const [supportPhone, setSupportPhone] = useState("+1 (555) 123-4567");
  const [supportHours, setSupportHours] = useState("Available 8AM - 6PM");
  const [lastUpdated, setLastUpdated] = useState("February 2026");

  const handleSavePrivacy = () => {
    toast.success("Privacy policy updated successfully");
  };

  const handleSaveHelpCenter = () => {
    toast.success("Help center content updated successfully");
  };

  const handleAddPrivacySection = () => {
    const newSection: PrivacySection = {
      id: Date.now().toString(),
      title: "New Section",
      content: "",
      icon: "FileText"
    };
    setPrivacySections([...privacySections, newSection]);
  };

  const handleRemovePrivacySection = (id: string) => {
    setPrivacySections(privacySections.filter(s => s.id !== id));
  };

  const handleUpdatePrivacySection = (id: string, field: keyof PrivacySection, value: string) => {
    setPrivacySections(privacySections.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleAddFAQ = () => {
    const newFAQ: FAQItem = {
      id: Date.now().toString(),
      question: "New Question",
      answer: "",
      icon: "HelpCircle"
    };
    setFaqItems([...faqItems, newFAQ]);
  };

  const handleRemoveFAQ = (id: string) => {
    setFaqItems(faqItems.filter(f => f.id !== id));
  };

  const handleUpdateFAQ = (id: string, field: keyof FAQItem, value: string) => {
    setFaqItems(faqItems.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this page. Content management is restricted to administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Management</h1>
        <p className="text-muted-foreground">
          Manage privacy policy, help center content, and public-facing information
        </p>
      </div>

      <Tabs defaultValue="privacy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="privacy" className="gap-2">
            <FileText className="h-4 w-4" />
            Privacy Policy
          </TabsTrigger>
          <TabsTrigger value="help" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Help Center
          </TabsTrigger>
        </TabsList>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Privacy Policy Editor
                  </CardTitle>
                  <CardDescription>
                    Edit the privacy policy sections displayed in the login dialog
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[85vh]">
                      <DialogHeader>
                        <DialogTitle>Privacy Policy Preview</DialogTitle>
                        <DialogDescription>
                          This is how the privacy policy appears to users
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <PrivacyPolicyDialog />
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={handleSavePrivacy} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="last-updated">Last Updated</Label>
                <Input
                  id="last-updated"
                  value={lastUpdated}
                  onChange={(e) => setLastUpdated(e.target.value)}
                  placeholder="e.g., February 2026"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Sections</Label>
                  <Button variant="outline" size="sm" onClick={handleAddPrivacySection} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Section
                  </Button>
                </div>

                <div className="space-y-4">
                  {privacySections.map((section, index) => (
                    <Card key={section.id} className="border-dashed">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start gap-4">
                          <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Section Title</Label>
                                <Input
                                  value={section.title}
                                  onChange={(e) => handleUpdatePrivacySection(section.id, 'title', e.target.value)}
                                  placeholder="Section title"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Icon Name</Label>
                                <Input
                                  value={section.icon}
                                  onChange={(e) => handleUpdatePrivacySection(section.id, 'icon', e.target.value)}
                                  placeholder="e.g., Shield, Lock, Eye"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Content</Label>
                              <Textarea
                                value={section.content}
                                onChange={(e) => handleUpdatePrivacySection(section.id, 'content', e.target.value)}
                                placeholder="Section content..."
                                rows={3}
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleRemovePrivacySection(section.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Help Center Editor
                  </CardTitle>
                  <CardDescription>
                    Manage FAQ items and support contact information
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[85vh]">
                      <DialogHeader>
                        <DialogTitle>Help Center Preview</DialogTitle>
                        <DialogDescription>
                          This is how the help center appears to users
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <HelpCenterDialog />
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={handleSaveHelpCenter} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="support-phone">Support Phone</Label>
                  <Input
                    id="support-phone"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-hours">Support Hours</Label>
                  <Input
                    id="support-hours"
                    value={supportHours}
                    onChange={(e) => setSupportHours(e.target.value)}
                    placeholder="Available 8AM - 6PM"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>FAQ Items</Label>
                  <Button variant="outline" size="sm" onClick={handleAddFAQ} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add FAQ
                  </Button>
                </div>

                <div className="space-y-4">
                  {faqItems.map((faq, index) => (
                    <Card key={faq.id} className="border-dashed">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start gap-4">
                          <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Question</Label>
                                <Input
                                  value={faq.question}
                                  onChange={(e) => handleUpdateFAQ(faq.id, 'question', e.target.value)}
                                  placeholder="Enter question"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Icon Name</Label>
                                <Input
                                  value={faq.icon}
                                  onChange={(e) => handleUpdateFAQ(faq.id, 'icon', e.target.value)}
                                  placeholder="e.g., Key, Calendar, User"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Answer</Label>
                              <Textarea
                                value={faq.answer}
                                onChange={(e) => handleUpdateFAQ(faq.id, 'answer', e.target.value)}
                                placeholder="Enter answer..."
                                rows={2}
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleRemoveFAQ(faq.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

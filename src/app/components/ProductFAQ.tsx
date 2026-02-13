import { useState, useEffect } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { createFAQ, getFAQs, getOrCreateContact } from "../lib/firestoreService";
import { FAQ } from "../lib/types";
import { toast } from "sonner";
import { useAuthStore } from "../lib/authStore";

interface ProductFAQProps {
  productId: string;
  productName: string;
}

export function ProductFAQ({ productId, productName }: ProductFAQProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    question: "",
  });

  useEffect(() => {
    loadFAQs();
  }, [productId]);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const data = await getFAQs({
        productId,
        status: "answered",
        isPublished: true,
      });
      setFaqs(data);
    } catch (error) {
      console.error("Error loading FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateMobile = (mobile: string): boolean => {
    const cleaned = mobile.replace(/\D/g, "");
    return cleaned.length >= 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!validateMobile(formData.mobile)) {
      toast.error("Please enter a valid mobile number (min 10 digits)");
      return;
    }

    if (!formData.question.trim()) {
      toast.error("Please enter your question");
      return;
    }

    try {
      setSubmitting(true);

      // Create or update contact
      const contactId = await getOrCreateContact(
        formData.mobile,
        formData.name,
        productId
      );

      // Create FAQ
      await createFAQ({
        productId,
        productName,
        question: formData.question,
        askedBy: formData.name,
        mobile: formData.mobile.replace(/\D/g, ""),
        contactId,
      });

      toast.success("Your question has been submitted! We'll answer it soon.");

      // Reset form
      setFormData({
        name: "",
        mobile: "",
        question: "",
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting question:", error);
      toast.error("Failed to submit question. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Product Questions & Answers
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Have a question? Get answers from our team
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2"
              variant="outline"
            >
              <MessageSquare className="h-4 w-4" />
              Ask a Question
            </Button>
          )}
        </div>
      </div>

      {/* Ask Question Form */}
      {showForm && (
        <div className="border-b bg-muted/30 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">
                  Your Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Rahul Sharma"
                  required
                />
              </div>
              <div>
                <Label htmlFor="mobile">
                  Mobile Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  placeholder="+91 9876543210"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="question">
                Your Question <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="question"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                placeholder="Ask anything about this product..."
                rows={3}
                required
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={submitting}
                className="gap-2 bg-blue-accent hover:bg-blue-accent/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Question
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* FAQ List */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : faqs.length > 0 ? (
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.id} className="rounded-lg border bg-muted/30 p-5">
                <div className="mb-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="mt-1 h-5 w-5 flex-shrink-0 text-blue-accent" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {faq.question}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Asked by {faq.askedBy} on{" "}
                        {faq.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                {faq.answer && (
                  <div className="ml-7 rounded-lg bg-background p-4">
                    <p className="text-sm font-medium text-blue-accent">
                      Answer:
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {faq.answer}
                    </p>
                    {faq.answeredAt && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Answered on {faq.answeredAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm text-muted-foreground">
              No questions asked yet. Be the first to ask!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
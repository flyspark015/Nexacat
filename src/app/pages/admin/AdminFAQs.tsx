import { useState, useEffect } from "react";
import { Search, Filter, MessageSquare, Eye, EyeOff, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import { getFAQs, getProducts, updateFAQ, deleteFAQ } from "../../lib/firestoreService";
import { FAQ, Product } from "../../lib/types";
import { toast } from "sonner";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { AuthDebug } from "../../components/AuthDebug";

export function AdminFAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFAQs, setFilteredFAQs] = useState<FAQ[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "answered">("all");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [faqs, searchTerm, statusFilter, selectedProductId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [faqsData, productsData] = await Promise.all([
        getFAQs(),
        getProducts(),
      ]);
      setFaqs(faqsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...faqs];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((faq) => faq.status === statusFilter);
    }

    // Product filter
    if (selectedProductId !== "all") {
      filtered = filtered.filter((faq) => faq.productId === selectedProductId);
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(term) ||
          faq.answer?.toLowerCase().includes(term) ||
          faq.askedBy.toLowerCase().includes(term) ||
          faq.mobile.includes(term) ||
          faq.productName.toLowerCase().includes(term)
      );
    }

    setFilteredFAQs(filtered);
  };

  const handleEditClick = (faq: FAQ) => {
    setEditingFAQ(faq);
    setAnswerText(faq.answer || "");
  };

  const handleSaveAnswer = async () => {
    if (!editingFAQ) return;

    if (!answerText.trim()) {
      toast.error("Please enter an answer");
      return;
    }

    try {
      setSaving(true);
      await updateFAQ(editingFAQ.id, {
        answer: answerText,
        isPublished: true,
      });
      
      toast.success("Answer saved successfully!");
      setEditingFAQ(null);
      setAnswerText("");
      loadData(); // Reload data
    } catch (error) {
      console.error("Error saving answer:", error);
      toast.error("Failed to save answer");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (faq: FAQ) => {
    try {
      await updateFAQ(faq.id, {
        isPublished: !faq.isPublished,
      });
      toast.success(
        faq.isPublished ? "FAQ hidden successfully" : "FAQ published successfully"
      );
      loadData();
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Failed to update FAQ");
    }
  };

  const handleDelete = async (faq: FAQ) => {
    if (!confirm(`Are you sure you want to delete this FAQ from "${faq.askedBy}"?`)) {
      return;
    }

    try {
      await deleteFAQ(faq.id);
      toast.success("FAQ deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast.error("Failed to delete FAQ");
    }
  };

  const pendingCount = faqs.filter((f) => f.status === "pending").length;
  const answeredCount = faqs.filter((f) => f.status === "answered").length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Auth Debug - Remove after fixing */}
      <AuthDebug />

      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Product FAQs
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage customer questions and provide helpful answers
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="rounded-lg border bg-background px-4 py-2">
                <p className="text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-accent">{pendingCount}</p>
              </div>
              <div className="rounded-lg border bg-background px-4 py-2">
                <p className="text-muted-foreground">Answered</p>
                <p className="text-2xl font-bold text-green-accent">{answeredCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by question, answer, customer, mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-accent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="answered">Answered</option>
              </select>
            </div>

            {/* Product Filter */}
            <div>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-accent"
              >
                <option value="all">All Products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="container mx-auto px-4 py-8">
        {filteredFAQs.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-4 text-xl font-semibold">No FAQs found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm || statusFilter !== "all" || selectedProductId !== "all"
                ? "Try adjusting your filters"
                : "Customer questions will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                {/* FAQ Header */}
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant={faq.status === "pending" ? "outline" : "default"}
                        className={
                          faq.status === "pending"
                            ? "bg-orange-accent/10 text-orange-accent"
                            : "bg-green-accent/10 text-green-accent"
                        }
                      >
                        {faq.status === "pending" ? "Pending" : "Answered"}
                      </Badge>
                      {faq.isPublished ? (
                        <Badge className="bg-blue-accent/10 text-blue-accent">
                          <Eye className="mr-1 h-3 w-3" />
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Hidden
                        </Badge>
                      )}
                      <Badge variant="secondary">{faq.productName}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {faq.question}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Asked by: {faq.askedBy}</span>
                      <span>Mobile: {faq.mobile}</span>
                      <span>Date: {faq.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {faq.status === "answered" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePublish(faq)}
                      >
                        {faq.isPublished ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(faq)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(faq)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Answer Section */}
                {editingFAQ?.id === faq.id ? (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <label className="mb-2 block text-sm font-medium">
                      Your Answer
                    </label>
                    <Textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Type your detailed answer here..."
                      rows={5}
                      className="mb-3"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveAnswer}
                        disabled={saving}
                        className="gap-2 bg-blue-accent hover:bg-blue-accent/90"
                      >
                        <Check className="h-4 w-4" />
                        {faq.answer ? "Update Answer" : "Save & Publish"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingFAQ(null);
                          setAnswerText("");
                        }}
                        disabled={saving}
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : faq.answer ? (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="mb-1 text-sm font-medium text-blue-accent">
                      Answer:
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {faq.answer}
                    </p>
                    {faq.answeredAt && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Answered on {faq.answeredAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No answer yet. Click "Edit" to provide an answer.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
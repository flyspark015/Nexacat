import { useState, useEffect } from "react";
import { getSettings, updateSettings } from "../../lib/firestoreService";
import { SystemSettings } from "../../lib/types";
import { Settings, Save, Upload } from "lucide-react";
import { toast } from "sonner";

export function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    id: "app-settings",
    companyName: "ANUSHAKTI INFOTECH PVT. LTD.",
    whatsappNumber: "+91-9461785001",
    currency: "INR",
    supportEmail: "contact@anushakti.com",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setPermissionError(false);
    try {
      const data = await getSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      // Check if it's a permission error
      if (error?.code === "permission-denied") {
        setPermissionError(true);
        // Don't show toast - we have a better UI for this
      } else {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateSettings(settings);
      setMessage({ type: "success", text: "Settings saved successfully!" });
      
      // Reload page after 1 second to reflect logo changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  // Show permission error UI with instructions
  if (permissionError) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-blue-accent" />
              <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
            </div>
          </div>

          {/* Permission Error Card */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-xl font-bold text-destructive mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Firestore Permission Error
            </h2>
            
            <p className="text-foreground mb-6">
              The Firestore security rules haven't been deployed yet. You need to deploy them to Firebase Console to enable settings functionality.
            </p>

            <div className="bg-background/50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-foreground mb-3">📋 Quick Fix Steps:</h3>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Open <strong className="text-foreground">Firebase Console</strong> → Firestore Database → Rules</li>
                <li>Copy the rules from <code className="bg-muted px-2 py-1 rounded text-foreground">/FIRESTORE_SECURITY_RULES.txt</code></li>
                <li>Paste into Firebase Console and click <strong className="text-foreground">Publish</strong></li>
                <li>Wait 10-30 seconds for deployment</li>
                <li>Refresh this page</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPermissionError(false);
                  loadSettings();
                }}
                className="px-4 py-2 bg-blue-accent text-blue-accent-foreground rounded-lg hover:bg-blue-accent/90 transition-colors"
              >
                Try Again
              </button>
              <a
                href="https://console.firebase.google.com/project/_/firestore/rules"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-surface border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                Open Firebase Console
              </a>
            </div>

            <div className="mt-6 pt-6 border-t border-destructive/20">
              <p className="text-sm text-muted-foreground">
                📚 For detailed instructions, see <code className="bg-muted px-2 py-1 rounded text-foreground">/FIREBASE_RULES_DEPLOYMENT.md</code>
              </p>
            </div>
          </div>

          {/* Temporary Settings (View Only) */}
          <div className="mt-6 bg-surface/50 rounded-lg border border-border/50 p-6">
            <h3 className="font-semibold text-muted-foreground mb-4">Current Settings (Read-Only)</h3>
            <div className="grid gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Company Name:</span>
                <span className="ml-2 text-foreground font-medium">{settings.companyName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Currency:</span>
                <span className="ml-2 text-foreground font-medium">{settings.currency}</span>
              </div>
              <div>
                <span className="text-muted-foreground">WhatsApp:</span>
                <span className="ml-2 text-foreground font-medium">{settings.whatsappNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Support Email:</span>
                <span className="ml-2 text-foreground font-medium">{settings.supportEmail}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              These are default values. Deploy security rules to load and edit actual settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-blue-accent" />
            <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Configure your application settings, branding, and contact information
          </p>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Branding Section */}
          <div className="bg-surface rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Branding</h2>
            
            <div className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Company Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                  required
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Logo URL
                  <span className="text-muted-foreground text-xs ml-2">
                    (Direct image URL or GitHub hosted)
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={settings.logoUrl || ""}
                    onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-surface border border-border rounded-lg text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                    title="Upload to image hosting service and paste URL"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload your logo to an image hosting service (e.g., GitHub, Imgur) and paste the direct image URL here
                </p>
                {settings.logoUrl && (
                  <div className="mt-3 p-3 bg-background border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Logo Preview:</p>
                    <img
                      src={settings.logoUrl}
                      alt="Logo preview"
                      className="h-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "";
                        e.currentTarget.alt = "Failed to load image";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Favicon URL */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Favicon URL
                  <span className="text-muted-foreground text-xs ml-2">
                    (Optional - .ico or .png)
                  </span>
                </label>
                <input
                  type="url"
                  value={settings.faviconUrl || ""}
                  onChange={(e) => handleInputChange("faviconUrl", e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-surface rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Contact Information</h2>
            
            <div className="space-y-4">
              {/* WhatsApp Number */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  WhatsApp Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  value={settings.whatsappNumber}
                  onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                  placeholder="+919876543210"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Include country code (e.g., +91 for India)
                </p>
              </div>

              {/* Support Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Support Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleInputChange("supportEmail", e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                  required
                />
              </div>

              {/* Footer Address */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Footer Address
                  <span className="text-muted-foreground text-xs ml-2">(Optional)</span>
                </label>
                <textarea
                  value={settings.footerAddress || ""}
                  onChange={(e) => handleInputChange("footerAddress", e.target.value)}
                  placeholder="123 Business Street, City, State, PIN Code"
                  rows={3}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>

              {/* Company Address */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Company Address
                  <span className="text-muted-foreground text-xs ml-2">(Full address)</span>
                </label>
                <textarea
                  value={settings.companyAddress || ""}
                  onChange={(e) => handleInputChange("companyAddress", e.target.value)}
                  placeholder="E-317, Siddhraj Z-Square, Podar International School Road, Kudasan, Gandhinagar, Gujarat - 382421, India"
                  rows={4}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>

              {/* GST Number */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  GST Number
                  <span className="text-muted-foreground text-xs ml-2">(GSTIN)</span>
                </label>
                <input
                  type="text"
                  value={settings.gstNumber || ""}
                  onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                  placeholder="24ABCCA1331J1Z5"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>

              {/* IEC Code */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  IEC Code
                  <span className="text-muted-foreground text-xs ml-2">(Import Export Code)</span>
                </label>
                <input
                  type="text"
                  value={settings.iecCode || ""}
                  onChange={(e) => handleInputChange("iecCode", e.target.value)}
                  placeholder="ABCCA1331J"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-surface rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Payment Information</h2>
            
            <div className="space-y-4">
              {/* Bank Account Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bank Account Name
                </label>
                <input
                  type="text"
                  value={settings.bankAccountName || ""}
                  onChange={(e) => handleInputChange("bankAccountName", e.target.value)}
                  placeholder="ANUSHAKTI INFOTECH PVT. LTD."
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>

              {/* Bank Account Number */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={settings.bankAccountNumber || ""}
                  onChange={(e) => handleInputChange("bankAccountNumber", e.target.value)}
                  placeholder="63773716130"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>

              {/* Bank IFSC Code */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={settings.bankIfscCode || ""}
                  onChange={(e) => handleInputChange("bankIfscCode", e.target.value)}
                  placeholder="IDFB0040303"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>

              {/* Bank UCIC */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  UCIC
                  <span className="text-muted-foreground text-xs ml-2">(Universal Customer ID)</span>
                </label>
                <input
                  type="text"
                  value={settings.bankUcic || ""}
                  onChange={(e) => handleInputChange("bankUcic", e.target.value)}
                  placeholder="6583633571"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={settings.bankName || ""}
                  onChange={(e) => handleInputChange("bankName", e.target.value)}
                  placeholder="IDFC FIRST Bank"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>

              {/* UPI ID */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={settings.upiId || ""}
                  onChange={(e) => handleInputChange("upiId", e.target.value)}
                  placeholder="anushaktiinfotech@idfcbank"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
              </div>

              {/* Payment QR Code URL */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Payment QR Code URL
                  <span className="text-muted-foreground text-xs ml-2">(Direct image URL)</span>
                </label>
                <input
                  type="url"
                  value={settings.paymentQrCodeUrl || ""}
                  onChange={(e) => handleInputChange("paymentQrCodeUrl", e.target.value)}
                  placeholder="https://example.com/qr-code.png"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload QR code to image hosting service and paste URL (leave empty to use default)
                </p>
              </div>
            </div>
          </div>

          {/* Currency Settings */}
          <div className="bg-surface rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Currency Settings</h2>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Currency <span className="text-destructive">*</span>
              </label>
              <select
                value={settings.currency}
                onChange={(e) => handleInputChange("currency", e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-accent"
                required
              >
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Currently using: <strong>INR (₹)</strong> - Multi-currency support ready for future expansion
              </p>
            </div>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div
              className={`p-4 rounded-lg border ${
                message.type === "success"
                  ? "bg-success/10 border-success/20 text-success"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={loadSettings}
              className="px-6 py-2 bg-surface border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
              disabled={saving}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-accent text-white rounded-lg hover:bg-blue-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-accent/10 border border-blue-accent/20 rounded-lg">
          <p className="text-sm text-foreground">
            <strong>💡 Tip:</strong> Logo and favicon changes will reflect immediately after saving.
            For best results, use direct image URLs from GitHub or image hosting services like Imgur.
          </p>
        </div>
      </div>
    </div>
  );
}
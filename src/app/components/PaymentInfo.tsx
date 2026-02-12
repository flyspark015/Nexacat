import { useState } from 'react';
import { Copy, Check, Building2, CreditCard, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import paymentQrCode from 'figma:asset/63c5a730f9885cfcfaff56a259e004f594587214.png';

interface PaymentInfoProps {
  settings?: {
    companyName?: string;
    companyAddress?: string;
    gstNumber?: string;
    iecCode?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankUcic?: string;
    bankName?: string;
    upiId?: string;
    paymentQrCodeUrl?: string;
  };
}

export function PaymentInfo({ settings }: PaymentInfoProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const CopyButton = ({ text, fieldName }: { text: string; fieldName: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-2"
      onClick={() => copyToClipboard(text, fieldName)}
    >
      {copiedField === fieldName ? (
        <Check className="h-3 w-3 text-success" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-blue-accent" />
            Company Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Company Name</p>
            <p className="font-medium">{settings?.companyName || 'ANUSHAKTI INFOTECH PVT. LTD.'}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Address</p>
            <p className="text-sm leading-relaxed">
              {settings?.companyAddress || (
                <>
                  E-317, Siddhraj Z-Square,<br />
                  Podar International School Road,<br />
                  Kudasan, Gandhinagar,<br />
                  Gujarat - 382421, India
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">GST Number</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm">{settings?.gstNumber || '24ABCCA1331J1Z5'}</p>
                <CopyButton 
                  text={settings?.gstNumber || '24ABCCA1331J1Z5'} 
                  fieldName="GST Number" 
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">IEC Code</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm">{settings?.iecCode || 'ABCCA1331J'}</p>
                <CopyButton 
                  text={settings?.iecCode || 'ABCCA1331J'} 
                  fieldName="IEC Code" 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-blue-accent" />
            Bank Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Account Name</p>
            <p className="font-medium">{settings?.bankAccountName || 'ANUSHAKTI INFOTECH PVT. LTD.'}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Account Number</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-lg font-semibold">
                {settings?.bankAccountNumber || '63773716130'}
              </p>
              <CopyButton 
                text={settings?.bankAccountNumber || '63773716130'} 
                fieldName="Account Number" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">IFSC Code</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-semibold">
                  {settings?.bankIfscCode || 'IDFB0040303'}
                </p>
                <CopyButton 
                  text={settings?.bankIfscCode || 'IDFB0040303'} 
                  fieldName="IFSC Code" 
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">UCIC</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm">
                  {settings?.bankUcic || '6583633571'}
                </p>
                <CopyButton 
                  text={settings?.bankUcic || '6583633571'} 
                  fieldName="UCIC" 
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Bank Name</p>
            <p className="font-medium">{settings?.bankName || 'IDFC FIRST Bank'}</p>
          </div>
        </CardContent>
      </Card>

      {/* UPI Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-blue-accent" />
            UPI Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">UPI ID</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm font-semibold text-blue-accent">
                {settings?.upiId || 'anushaktiinfotech@idfcbank'}
              </p>
              <CopyButton 
                text={settings?.upiId || 'anushaktiinfotech@idfcbank'} 
                fieldName="UPI ID" 
              />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Scan QR Code to Pay</p>
            <div className="inline-block bg-white p-4 rounded-lg">
              <img
                src={settings?.paymentQrCodeUrl || paymentQrCode}
                alt="Payment QR Code"
                className="w-64 h-64 object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Scan this QR code with any UPI app to transfer
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      <Card className="bg-blue-accent/5 border-blue-accent/20">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3 text-sm">Payment Instructions:</h4>
          <ol className="text-sm space-y-2 text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-semibold text-blue-accent">1.</span>
              <span>Transfer the total amount to the bank account or UPI ID mentioned above</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-blue-accent">2.</span>
              <span>Share payment screenshot via WhatsApp to confirm your order</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-blue-accent">3.</span>
              <span>Our team will verify and confirm your order within 24 hours</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-blue-accent">4.</span>
              <span>For any payment queries, contact us on WhatsApp</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

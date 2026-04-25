import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, X, Printer, Download } from "lucide-react";

interface RationDetailsProps {
  token: any;
  onBack: () => void;
  onClose: () => void;
}

export const RationDetails = ({ token, onBack, onClose }: RationDetailsProps) => {
  const { rationDetails } = token;
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintableHTML(token, rationDetails);
    
    if (printWindow && printContent) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ration Slip - ${token.tokenNumber}</title>
          <style>
            @media print {
              body { margin: 20px; font-family: 'Courier New', monospace; }
              table { page-break-inside: avoid; }
              .no-print { display: none !important; }
            }
            body { font-family: Arial, sans-serif; line-height: 1.4; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .entitlement-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .entitlement-table th, .entitlement-table td { border: 1px solid #000; padding: 10px; text-align: left; }
            .entitlement-table th { background-color: #f5f5f5; font-weight: bold; }
            .official-message { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; font-family: monospace; white-space: pre-line; font-size: 12px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #000; font-size: 12px; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };
  
  const handleDownloadPDF = () => {
    // For now, we'll use the print functionality as PDF download
    // In a real implementation, you'd use a library like jsPDF
    handlePrint();
  };
  
  const generatePrintableHTML = (token: any, rationDetails: any) => {
    const rationMessage = generateRationMessage(
      token.rationCardNumber,
      rationDetails.cardType,
      rationDetails.familyMembers,
      rationDetails.shopName
    );
    
    return `
      <div class="header">
        <h1>🏛️ PUBLIC DISTRIBUTION SYSTEM</h1>
        <h2>FOOD & CIVIL SUPPLIES KARNATAKA</h2>
        <p>OFFICIAL RATION ENTITLEMENT SLIP</p>
      </div>
      
      <div class="section">
        <h3>TOKEN INFORMATION</h3>
        <p><strong>Token Number:</strong> ${token.tokenNumber}</p>
        <p><strong>Date:</strong> ${new Date(token.createdAt).toLocaleDateString('en-IN')}</p>
        <p><strong>Ration Card:</strong> ${token.rationCardNumber}</p>
        <p><strong>Card Type:</strong> ${rationDetails.cardType}</p>
        <p><strong>Family Members:</strong> ${rationDetails.familyMembers}</p>
        <p><strong>Status:</strong> ${token.status.toUpperCase()}</p>
      </div>
      
      <div class="section">
        <h3>MONTHLY ENTITLEMENT</h3>
        <table class="entitlement-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>🍚 Rice</td>
              <td><strong>${rationDetails.entitlement.rice} KG</strong></td>
              <td>FREE</td>
            </tr>
            <tr>
              <td>🌾 Ragi/Jowar</td>
              <td><strong>${rationDetails.entitlement.ragiWheat} KG</strong></td>
              <td>FREE</td>
            </tr>
            ${rationDetails.entitlement.sugar > 0 ? `
            <tr>
              <td>🍰 Sugar</td>
              <td><strong>${rationDetails.entitlement.sugar} KG</strong></td>
              <td>FREE</td>
            </tr>
            ` : ''}
            ${rationDetails.entitlement.kerosene > 0 ? `
            <tr>
              <td>⛽ Kerosene</td>
              <td><strong>${rationDetails.entitlement.kerosene} L</strong></td>
              <td>FREE</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h3>OFFICIAL RATION SLIP</h3>
        <div class="official-message">
${rationMessage}
        </div>
      </div>
      
      <div class="footer">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <div>
            <strong>Fair Price Shop:</strong> ${rationDetails.shopName}
          </div>
          <div>
            <strong>Helpline:</strong> 1967, 1800-425-6900
          </div>
        </div>
        <div style="text-align: center; font-size: 11px; margin-top: 20px;">
          <p>This is a computer-generated slip. No signature required.</p>
          <p>Valid for ${rationDetails.month} ${rationDetails.year} only.</p>
          <p><strong>FCSKAR - Food & Civil Supplies Karnataka</strong></p>
        </div>
      </div>
    `;
  };
  
  const generateRationMessage = (rationCardNumber: string, cardType: string, familyMembers: number, shopName: string) => {
    const entitlement = rationDetails.entitlement;
    const currentMonth = rationDetails.month;
    const currentYear = rationDetails.year;
    
    return `🏛️ PUBLIC DISTRIBUTION SYSTEM - RATION ENTITLEMENT

DEAR BENEFICIARIES,
FOR YOUR RATION CARD NO. ${rationCardNumber} OF TYPE ${cardType};
FAMILY MEMBERS: ${familyMembers}

MONTHLY ENTITLEMENT FOR ${currentMonth}:
🍚 RICE: ${entitlement.rice} KG
🌾 RAGI/JOWAR: ${entitlement.ragiWheat} KG  
🍰 SUGAR: ${entitlement.sugar} KG
⛽ KEROSNE: ${entitlement.kerosene} LITERS

DISTRIBUTION: FREE OF COST (NFS Act, 2013)
FAIR PRICE SHOP: ${shopName}
TOLL FREE COMPLAINTS: 1967, 1800-425-6900

ಆತ್ಮೀಯ ಫಲಾನುಭವಿಗಳೇ,
ನಿಮ್ಮ ${cardType} ಪಡಿತರ ಚೀಟಿ ಸಂಖ್ಯೆ. ${rationCardNumber}
ಕುಟುಂಬ ಸದಸ್ಯರು: ${familyMembers}

${currentMonth} ತಿಂಗಳ ಮಂಜೂರಾತಿ:
🍚 ಅಕ್ಕಿ: ${entitlement.rice} ಕೆಜಿ
🌾 ರಾಗಿ/ಜೋಳ: ${entitlement.ragiWheat} ಕೆಜಿ
🍰 ಸಕ್ಕರೆ: ${entitlement.sugar} ಕೆಜಿ
⛽ ಕೇರೋಸಿನ್: ${entitlement.kerosene} ಲೀಟರ್

ಉಚಿತ ವಿತರಣೆ (ರಾಷ್ಟ್ರೀಯ ಆಹಾರ ಭದ್ರತಾ ಕಾಯ್ದೆ, 2013)
ನ್ಯಾಯಾಲಯ ದುಕಾಣ: ${shopName}
ದೂರುಗಳಿಗೆ: 1967, 1800-425-6900

📅 Valid: ${currentMonth} ${currentYear}
🏪 FCSKAR - Food & Civil Supplies Karnataka`;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h2 className="text-xl font-bold">🏛️ Ration Entitlement Details</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Token Info */}
      <Card>
        <CardHeader>
          <CardTitle>Token Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Token Number</span>
              <div className="font-semibold">{token.tokenNumber}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="font-semibold capitalize">{token.status}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Ration Card</span>
              <div className="font-semibold">{token.rationCardNumber}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Card Type</span>
              <div className="font-semibold">{rationDetails.cardType}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Family Members</span>
              <div className="font-semibold">{rationDetails.familyMembers}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Fair Price Shop</span>
              <div className="font-semibold">{rationDetails.shopName}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Entitlement Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
          <div className="text-2xl font-bold text-yellow-800">
            {rationDetails.entitlement.rice} KG
          </div>
          <div className="text-sm text-yellow-600">🍚 Rice</div>
          <div className="text-xs text-yellow-500 mt-1">
            {rationDetails.familyMembers} × {rationDetails.entitlement.rice / rationDetails.familyMembers} KG
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 text-center">
          <div className="text-2xl font-bold text-orange-800">
            {rationDetails.entitlement.ragiWheat} KG
          </div>
          <div className="text-sm text-orange-600">🌾 Ragi/Jowar</div>
          <div className="text-xs text-orange-500 mt-1">
            {rationDetails.familyMembers} × {rationDetails.entitlement.ragiWheat / rationDetails.familyMembers} KG
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
          <div className="text-2xl font-bold text-blue-800">
            {rationDetails.entitlement.sugar} KG
          </div>
          <div className="text-sm text-blue-600">🍰 Sugar</div>
          <div className="text-xs text-blue-500 mt-1">Per Family</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-800">
            {rationDetails.entitlement.kerosene} L
          </div>
          <div className="text-sm text-gray-600">⛽ Kerosene</div>
          <div className="text-xs text-gray-500 mt-1">Per Family</div>
        </div>
      </div>
      
      {/* Official Message */}
      <Card>
        <CardHeader>
          <CardTitle>Official Ration Slip</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded border font-mono text-sm whitespace-pre-line max-h-64 overflow-y-auto">
            {generateRationMessage(
              token.rationCardNumber,
              rationDetails.cardType,
              rationDetails.familyMembers,
              rationDetails.shopName
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Ration Slip
        </Button>
        <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to Tokens
        </Button>
      </div>
    </div>
  );
};

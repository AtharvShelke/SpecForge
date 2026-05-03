"use client";

import { useState } from "react";
import { 
  Download, 
  FileText, 
  Share2, 
  Printer, 
  Image,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface BuildExportPanelProps {
  cart: CartItem[];
  buildName?: string;
  className?: string;
}

interface ExportOptions {
  includeSpecs: boolean;
  includePrices: boolean;
  includeCompatibility: boolean;
  format: 'json' | 'csv' | 'pdf';
}

export default function BuildExportPanel({ 
  cart, 
  buildName = "My PC Build", 
  className = "" 
}: BuildExportPanelProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeSpecs: true,
    includePrices: true,
    includeCompatibility: true,
    format: 'json'
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const totalPrice = cart.reduce((sum, item) => 
    sum + (item.selectedVariant?.price || 0) * item.quantity, 0
  );

  const generateBuildData = () => {
    return {
      name: buildName,
      created: new Date().toISOString(),
      totalPrice,
      components: cart.map(item => ({
        name: item.name,
        category: item.category,
        brand: item.product?.brand?.name,
        price: exportOptions.includePrices ? (item.selectedVariant?.price || 0) : undefined,
        quantity: item.quantity,
        specs: exportOptions.includeSpecs ? item.specs : undefined,
        image: item.image || item.images?.[0],
      })),
      compatibility: exportOptions.includeCompatibility ? {
        estimatedPower: calculatePowerUsage(),
        issues: checkCompatibilityIssues()
      } : undefined
    };
  };

  const calculatePowerUsage = () => {
    let wattage = 50; // Base wattage
    
    cart.forEach(item => {
      const specs = item.specs || [];
      const tdp = specs.find(spec => spec.name === 'TDP' || spec.name === 'Power Draw')?.value;
      if (tdp) {
        wattage += Number(tdp) * item.quantity;
      }
    });
    
    return wattage;
  };

  const checkCompatibilityIssues = () => {
    const issues = [];
    
    // Basic compatibility checks
    const cpu = cart.find(item => item.category === 'Processor');
    const motherboard = cart.find(item => item.category === 'Motherboard');
    
    if (cpu && motherboard) {
      const cpuSocket = cpu.specs?.find(spec => spec.name === 'Socket')?.value;
      const moboSocket = motherboard.specs?.find(spec => spec.name === 'Socket')?.value;
      
      if (cpuSocket && moboSocket && cpuSocket !== moboSocket) {
        issues.push('CPU socket mismatch with motherboard');
      }
    }
    
    return issues;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const buildData = generateBuildData();
      
      switch (exportOptions.format) {
        case 'json':
          await exportAsJSON(buildData);
          break;
        case 'csv':
          await exportAsCSV(buildData);
          break;
        case 'pdf':
          await exportAsPDF(buildData);
          break;
      }
      
      toast({
        title: "Export successful!",
        description: `Build exported as ${exportOptions.format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export build data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsJSON = async (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    downloadFile(blob, `${buildName.replace(/\s+/g, "_")}_build.json`);
  };

  const exportAsCSV = async (data: any) => {
    const headers = ['Name', 'Category', 'Brand', 'Price', 'Quantity'];
    if (exportOptions.includeSpecs) {
      headers.push('Specifications');
    }
    
    const rows = data.components.map((component: any) => {
      const row = [
        component.name,
        component.category,
        component.brand || '',
        component.price ? `₹${component.price}` : '',
        component.quantity.toString()
      ];
      
      if (exportOptions.includeSpecs && component.specs) {
        const specsText = component.specs.map((spec: any) => 
          `${spec.name}: ${spec.value}`
        ).join('; ');
        row.push(specsText);
      }
      
      return row;
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map((cell: string) => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadFile(blob, `${buildName.replace(/\s+/g, "_")}_build.csv`);
  };

  const exportAsPDF = async (data: any) => {
    // Create a simple HTML representation for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${buildName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .component { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
          .price { font-weight: bold; color: #2563eb; }
          .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>${buildName}</h1>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
        <p>Total Price: ₹${data.totalPrice.toLocaleString('en-IN')}</p>
        
        <h2>Components</h2>
        ${data.components.map((component: any) => `
          <div class="component">
            <h3>${component.name}</h3>
            <p>Category: ${component.category}</p>
            ${component.brand ? `<p>Brand: ${component.brand}</p>` : ''}
            ${component.price ? `<p class="price">₹${component.price.toLocaleString('en-IN')}</p>` : ''}
            <p>Quantity: ${component.quantity}</p>
          </div>
        `).join('')}
        
        <div class="total">
          Total: ₹${data.totalPrice.toLocaleString('en-IN')}
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    downloadFile(blob, `${buildName.replace(/\s+/g, "_")}_build.html`);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const buildData = generateBuildData();
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${buildName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .component { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
            .price { font-weight: bold; color: #2563eb; }
            .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
            @media print { body { margin: 10px; } }
          </style>
        </head>
        <body>
          <h1>${buildName}</h1>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
          <p>Total Price: ₹${buildData.totalPrice.toLocaleString('en-IN')}</p>
          
          <h2>Components</h2>
          ${buildData.components.map((component: any) => `
            <div class="component">
              <h3>${component.name}</h3>
              <p>Category: ${component.category}</p>
              ${component.brand ? `<p>Brand: ${component.brand}</p>` : ''}
              ${component.price ? `<p class="price">₹${component.price.toLocaleString('en-IN')}</p>` : ''}
              <p>Quantity: ${component.quantity}</p>
            </div>
          `).join('')}
          
          <div class="total">
            Total: ₹${buildData.totalPrice.toLocaleString('en-IN')}
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleShareImage = async () => {
    // Create a simple canvas-based build summary image
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Title
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(buildName, 50, 50);
      
      // Components list
      ctx.font = '16px Arial';
      let y = 100;
      
      cart.forEach((item, index) => {
        const price = item.selectedVariant?.price || 0;
        const line = `${index + 1}. ${item.name} - ₹${price.toLocaleString('en-IN')}`;
        ctx.fillText(line, 50, y);
        y += 30;
      });
      
      // Total
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`Total: ₹${totalPrice.toLocaleString('en-IN')}`, 50, y + 20);
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          downloadFile(blob, `${buildName.replace(/\s+/g, "_")}_build.png`);
        }
      });
    }
  };

  if (cart.length === 0) {
    return (
      <div className={`border border-gray-200 bg-white rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Add components to export build</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 bg-white rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Export & Share</h3>
        <p className="text-sm text-gray-500 mt-1">Export your build in various formats</p>
      </div>
      
      {/* Export Options */}
      <div className="p-4 space-y-4">
        {/* Format Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['json', 'csv', 'pdf'] as const).map(format => (
              <button
                key={format}
                onClick={() => setExportOptions(prev => ({ ...prev, format }))}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  exportOptions.format === format
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        {/* Include Options */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Include in Export
          </label>
          <div className="space-y-2">
            {[
              { key: 'includeSpecs', label: 'Component Specifications' },
              { key: 'includePrices', label: 'Pricing Information' },
              { key: 'includeCompatibility', label: 'Compatibility Notes' }
            ].map(option => (
              <label key={option.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    [option.key]: e.target.checked
                  }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : `Export as ${exportOptions.format.toUpperCase()}`}
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleShareImage}>
              <Image className="h-4 w-4 mr-2" />
              Share Image
            </Button>
          </div>
        </div>
        
        {/* Build Summary */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Components:</span>
            <span className="font-medium text-gray-900">{cart.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Value:</span>
            <span className="font-medium text-gray-900">₹{totalPrice.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
